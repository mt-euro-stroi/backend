import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllBookingsDto } from './dto/find-all-bookings.dto';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import {
  BookingListItem,
  BookingResponse,
} from './types/bookings-response.types';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createBookingDto: CreateBookingDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<BookingResponse>> {
    const userId = authUser.sub;
    const { apartmentId } = createBookingDto;

    this.logger.log(
      `Booking creation attempt (userId=${userId}, apartmentId=${apartmentId})`,
    );

    const apartment = await this.prismaService.apartment.findUnique({
      where: { id: apartmentId },
      select: { id: true, status: true, isPublished: true },
    });

    if (!apartment) {
      this.logger.warn(
        `Booking creation failed: apartment not found (apartmentId=${apartmentId})`,
      );
      throw new NotFoundException('Apartment not found');
    }

    if (!apartment.isPublished) {
      this.logger.warn(
        `Booking creation failed: apartment not published (apartmentId=${apartmentId})`,
      );
      throw new ConflictException('Apartment is not available');
    }

    if (apartment.status !== 'AVAILABLE') {
      this.logger.warn(
        `Booking creation failed: apartment not available (status=${apartment.status})`,
      );
      throw new ConflictException('Apartment is not available for booking');
    }

    const existing = await this.prismaService.booking.findUnique({
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
      throw new ConflictException('Booking already exists');
    }

    const booking = await this.prismaService.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          userId,
          apartmentId,
        },
        include: {
          apartment: {
            include: {
              files: {
                select: { id: true, path: true },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      await tx.apartment.update({
        where: { id: apartmentId },
        data: { status: 'RESERVED' },
      });

      return createdBooking;
    });

    this.logger.log(`Booking created successfully (id=${booking.id})`);

    const formattedBooking = {
      id: booking.id,
      userId: booking.userId,
      apartmentId: booking.apartmentId,
      status: booking.status,
      createdAt: booking.createdAt,
      apartment: {
        ...booking.apartment,
        area: Number(booking.apartment.area),
      },
    };

    return {
      message: 'Apartment booked successfully',
      data: formattedBooking,
    };
  }

  async findAll(
    authUser: AuthUser,
    query: FindAllBookingsDto,
  ): Promise<ServiceDataResponse<PaginatedResult<BookingListItem>>> {
    const { page = 1, limit = 20 } = query;
    const userId = authUser.sub;
    const skip = (page - 1) * limit;

    this.logger.log(
      `Fetching bookings (userId=${userId}, page=${page}, limit=${limit})`,
    );

    const [bookings, total] = await this.prismaService.$transaction([
      this.prismaService.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          apartment: {
            include: {
              files: {
                select: { id: true, path: true },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      }),
      this.prismaService.booking.count({
        where: { userId },
      }),
    ]);

    const formatted = bookings.map((item) => ({
      id: item.id,
      status: item.status,
      createdAt: item.createdAt,
      apartment: {
        ...item.apartment,
        area: Number(item.apartment.area),
      },
    }));

    this.logger.log(
      `Bookings retrieved successfully (userId=${userId}, items=${formatted.length}, total=${total})`,
    );

    return {
      message: 'Bookings retrieved successfully',
      data: {
        items: formatted,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
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

    const existing = await this.prismaService.booking.findUnique({
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
      throw new NotFoundException('Booking not found');
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.booking.delete({
        where: {
          userId_apartmentId: {
            userId,
            apartmentId,
          },
        },
      });

      await tx.apartment.update({
        where: { id: apartmentId },
        data: { status: 'AVAILABLE' },
      });
    });

    this.logger.log(
      `Booking removed successfully and apartment released (userId=${userId}, apartmentId=${apartmentId})`,
    );

    return {
      message: 'Booking removed successfully',
    };
  }
}
