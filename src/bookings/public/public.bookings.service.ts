import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import { BookingBase, BookingResponse } from '../types/bookings-response.types';
import { ApartmentStatus, BookingStatus } from 'src/generated/prisma/enums';
import { bookingApartmentInclude } from '../prisma/booking.include';
import { mapBookingApartment } from '../mappers/booking.mapper';

@Injectable()
export class PublicBookingsService {
  private readonly logger = new Logger(PublicBookingsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(
    dto: CreateBookingDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<BookingResponse>> {
    const userId = authUser.sub;
    const { apartmentId } = dto;

    const MAX_ACTIVE_BOOKINGS = Number(process.env.MAX_ACTIVE_BOOKINGS);

    this.logger.log(
      `Booking creation attempt (userId=${userId}, apartmentId=${apartmentId})`,
    );

    const booking = await this.prismaService.$transaction(async (tx) => {
      const apartment = await tx.apartment.findUnique({
        where: { id: apartmentId },
        select: { id: true, status: true, isPublished: true },
      });

      if (!apartment) {
        this.logger.warn(
          `Booking creation failed: apartment not found (apartmentId=${apartmentId})`,
        );
        throw new NotFoundException('Квартира не найдена');
      }

      if (!apartment.isPublished) {
        this.logger.warn(
          `Booking creation failed: apartment not published (apartmentId=${apartmentId})`,
        );
        throw new ConflictException('Квартира не доступна');
      }

      if (apartment.status === ApartmentStatus.SOLD) {
        this.logger.warn(
          `Booking creation failed: apartment already sold (apartmentId=${apartmentId})`,
        );
        throw new ConflictException('Квартира уже продана');
      }

      const activeBookingsCount = await tx.booking.count({
        where: {
          userId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
      });

      if (activeBookingsCount >= MAX_ACTIVE_BOOKINGS) {
        this.logger.warn(
          `Booking limit exceeded (userId=${userId}, activeBookings=${activeBookingsCount})`,
        );

        throw new ConflictException(
          `У вас может быть максимум ${MAX_ACTIVE_BOOKINGS} активных брони`,
        );
      }

      const existing = await tx.booking.findUnique({
        where: {
          userId_apartmentId: {
            userId,
            apartmentId,
          },
        },
      });

      if (existing) {
        this.logger.warn(
          `Booking already exists (userId=${userId}, apartmentId=${apartmentId})`,
        );
        throw new ConflictException('Бронь уже существует');
      }

      const createdBooking = await tx.booking.create({
        data: {
          userId,
          apartmentId,
          status: BookingStatus.PENDING,
        },
        include: bookingApartmentInclude,
      });

      if (apartment.status === ApartmentStatus.AVAILABLE) {
        await tx.apartment.update({
          where: { id: apartmentId },
          data: { status: ApartmentStatus.RESERVED },
        });
      }

      return createdBooking;
    });

    this.logger.log(`Booking created successfully (id=${booking.id})`);

    const formattedBooking: BookingResponse = {
      id: booking.id,
      userId: booking.userId,
      apartmentId: booking.apartmentId,
      status: booking.status,
      createdAt: booking.createdAt,
      apartment: mapBookingApartment(booking.apartment),
    };

    return {
      message: 'Квартира успешно забронирована',
      data: formattedBooking,
    };
  }

  async findAll(
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<BookingBase[]>> {
    const userId = authUser.sub;

    this.logger.log(`Fetching bookings (userId=${userId})`);

    const bookings = await this.prismaService.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: bookingApartmentInclude,
    });

    const formatted: BookingBase[] = bookings.map((item) => ({
      id: item.id,
      status: item.status,
      createdAt: item.createdAt,
      apartment: mapBookingApartment(item.apartment),
    }));

    this.logger.log(
      `Bookings retrieved successfully (userId=${userId}, items=${formatted.length})`,
    );

    return {
      message: 'Брони успешно получены',
      data: formatted,
    };
  }

  async remove(
    apartmentId: number,
    authUser: AuthUser,
  ): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(
      `Booking removal attempt (userId=${userId}, apartmentId=${apartmentId})`,
    );

    await this.prismaService.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({
        where: {
          userId_apartmentId: {
            userId,
            apartmentId,
          },
        },
      });

      if (!existing) {
        this.logger.warn(
          `Booking removal failed: not found (userId=${userId}, apartmentId=${apartmentId})`,
        );
        throw new NotFoundException('Бронь не найдена');
      }


      await tx.booking.delete({
        where: {
          userId_apartmentId: {
            userId,
            apartmentId,
          },
        },
      });

      const remainingBookings = await tx.booking.count({
        where: {
          apartmentId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
      });

      if (remainingBookings === 0) {
        await tx.apartment.update({
          where: { id: apartmentId },
          data: { status: ApartmentStatus.AVAILABLE },
        });
      }
    });

    this.logger.log(
      `Booking removed successfully (userId=${userId}, apartmentId=${apartmentId})`,
    );

    return {
      message: 'Бронь успешно удалена',
    };
  }
}
