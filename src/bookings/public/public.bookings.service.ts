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
import { bookingApartmentInclude, bookingInclude } from '../prisma/booking.include';
import { mapBookingApartment } from '../mappers/booking.mapper';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class PublicBookingsService {
  private readonly logger = new Logger(PublicBookingsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService
  ) {}

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
        select: {
          id: true,
          status: true,
          isPublished: true,
        },
      });

      if (!apartment) {
        this.logger.warn(
          `Booking creation failed: apartment not found (apartmentId=${apartmentId})`,
        );
        throw new NotFoundException('Квартира не найдена');
      }

      if (!apartment.isPublished) {
        throw new ConflictException('Квартира не доступна');
      }

      if (apartment.status === ApartmentStatus.SOLD) {
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
        throw new ConflictException(
          `У вас может быть максимум ${MAX_ACTIVE_BOOKINGS} активных брони`,
        );
      }

      const existing = await tx.booking.findFirst({
        where: {
          userId,
          apartmentId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
      });

      if (existing) {
        throw new ConflictException('Бронь уже существует');
      }

      const createdBooking = await tx.booking.create({
        data: {
          userId,
          apartmentId,
          status: BookingStatus.PENDING,
        },
        include: bookingInclude
      });

      return createdBooking;
    });

    this.logger.log(`Booking created successfully (id=${booking.id})`);

    const apartmentTitle = `${booking.apartment.complex.title} — квартира ${booking.apartment.number}`;

    await this.mailService.sendBookingStatusEmail({
      email: booking.user.email,
      apartmentTitle,
      status: 'CREATED',
    });

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
    id: number,
    authUser: AuthUser,
  ): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(
      `Booking removal attempt (bookingId=${id}, userId=${userId})`,
    );

    const booking = await this.prismaService.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: bookingInclude,
      });

      if (!booking || booking.userId !== userId) {
        this.logger.warn(
          `Booking removal failed: not found or forbidden (bookingId=${id}, userId=${userId})`,
        );
        throw new NotFoundException('Бронь не найдена');
      }

      if (booking.status === BookingStatus.CONFIRMED) {
        throw new ConflictException(
          'Нельзя отменить подтвержденную бронь. Свяжитесь с администратором',
        );
      }

      await tx.booking.delete({
        where: { id },
      });

      const remainingBookings = await tx.booking.count({
        where: {
          apartmentId: booking.apartmentId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
      });

      if (remainingBookings === 0) {
        await tx.apartment.update({
          where: { id: booking.apartmentId },
          data: { status: ApartmentStatus.AVAILABLE },
        });
      }

      return booking;
    });

    this.logger.log(
      `Booking removed successfully (bookingId=${id}, userId=${userId})`,
    );

    const apartmentTitle = `${booking.apartment.complex.title} — квартира ${booking.apartment.number}`;

    await this.mailService.sendBookingStatusEmail({
      email: booking.user.email,
      apartmentTitle,
      status: 'REMOVED',
    });

    return {
      message: 'Бронь успешно отменена',
    };
  }
}
