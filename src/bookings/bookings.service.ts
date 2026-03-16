import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import { BookingAdminResponse, BookingBase, BookingResponse } from './types/bookings-response.types';
import { ApartmentStatus, BookingStatus } from 'src/generated/prisma/enums';
import { mapBookingApartment } from './mappers/booking.mapper';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  bookingAdminSelect,
  bookingListSelect,
  bookingResponseSelect,
} from './prisma/booking.select';
import { AdminFindAllBookingsDto } from './dto/admin-find-all-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(
    dto: CreateBookingDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<BookingResponse>> {
    const userId = authUser.sub;
    const { apartmentId } = dto;

    const MAX_ACTIVE_BOOKINGS = Number(process.env.MAX_ACTIVE_BOOKINGS ?? 3);

    this.logger.log(
      `Booking creation attempt (userId=${userId}, apartmentId=${apartmentId})`,
    );

    const booking = await this.prismaService.$transaction(async (tx) => {
      const apartment = await tx.apartment.findUnique({
        where: { id: apartmentId },
        select: { id: true, status: true, isPublished: true },
      });

      if (!apartment || !apartment.isPublished) {
        throw new ConflictException('Квартира не доступна');
      }

      if (apartment.status !== ApartmentStatus.AVAILABLE) {
        throw new ConflictException('Квартира недоступна для бронирования');
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
        select: bookingResponseSelect,
      });

      return createdBooking;
    });

    return {
      message: 'Квартира успешно забронирована',
      data: {
        id: booking.id,
        userId: booking.userId,
        apartmentId: booking.apartmentId,
        status: booking.status,
        createdAt: booking.createdAt,
        apartment: mapBookingApartment(booking.apartment),
      },
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
      select: bookingListSelect,
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

    await this.prismaService.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          apartmentId: true,
        },
      });

      if (!existing || existing.userId !== userId) {
        throw new NotFoundException('Бронь не найдена');
      }

      await tx.booking.delete({
        where: { id },
      });

      const remainingBookings = await tx.booking.count({
        where: {
          apartmentId: existing.apartmentId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
      });

      if (remainingBookings === 0) {
        await tx.apartment.updateMany({
          where: {
            id: existing.apartmentId,
            status: ApartmentStatus.RESERVED,
          },
          data: { status: ApartmentStatus.AVAILABLE },
        });
      }
    });

    return {
      message: 'Бронь успешно удалена',
    };
  }

  async findAllAdmin(
    query: AdminFindAllBookingsDto,
  ): Promise<ServiceDataResponse<PaginatedResult<BookingAdminResponse>>> {
    const { page = 1, limit = 20, userId, status } = query;

    const skip = (page - 1) * limit;

    this.logger.log(
      `Admin fetching bookings (page=${page}, limit=${limit}, status=${status ?? 'any'})`,
    );

    const where = {
      ...(status !== undefined && { status }),
      ...(userId !== undefined && { userId }),
    };

    const [bookings, total] = await this.prismaService.$transaction([
      this.prismaService.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: bookingAdminSelect,
      }),
      this.prismaService.booking.count({ where }),
    ]);

    const formatted = bookings.map((item) => ({
      id: item.id,
      status: item.status,
      createdAt: item.createdAt,
      userId: item.userId,
      apartmentId: item.apartmentId,
      user: item.user,
      apartment: mapBookingApartment(item.apartment),
    }));

    return {
      message: 'Брони успешно получены',
      data: {
        items: formatted,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    id: number,
  ): Promise<ServiceDataResponse<BookingAdminResponse>> {
    this.logger.log(`Admin fetching booking (id=${id})`);

    const booking = await this.prismaService.booking.findUnique({
      where: { id },
      select: bookingAdminSelect,
    });

    if (!booking) {
      throw new NotFoundException('Бронь не найдена');
    }

    return {
      message: 'Бронь успешно получена',
      data: {
        id: booking.id,
        status: booking.status,
        createdAt: booking.createdAt,
        userId: booking.userId,
        apartmentId: booking.apartmentId,
        user: booking.user,
        apartment: mapBookingApartment(booking.apartment),
      },
    };
  }

  async updateStatus(
    id: number,
    dto: UpdateBookingStatusDto,
  ): Promise<ServiceDataResponse<BookingAdminResponse>> {
    const { status } = dto;

    const updated = await this.prismaService.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          apartmentId: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Бронь не найдена');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new ConflictException('Отмененная бронь не может быть изменена');
      }

      if (
        booking.status === BookingStatus.CONFIRMED &&
        status === BookingStatus.PENDING
      ) {
        throw new ConflictException(
          'Нельзя вернуть подтвержденную бронь в состояние ожидания',
        );
      }

      if (status === BookingStatus.CONFIRMED) {
        const updatedApartment = await tx.apartment.updateMany({
          where: {
            id: booking.apartmentId,
            status: ApartmentStatus.AVAILABLE,
          },
          data: {
            status: ApartmentStatus.RESERVED,
          },
        });

        if (updatedApartment.count === 0) {
          throw new ConflictException(
            'Квартира уже зарезервирована или продана',
          );
        }
      }

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
        select: bookingAdminSelect,
      });

      if (
        status === BookingStatus.CANCELLED &&
        booking.status === BookingStatus.CONFIRMED
      ) {
        const remainingBookings = await tx.booking.count({
          where: {
            apartmentId: booking.apartmentId,
            NOT: { id },
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
            },
          },
        });

        if (remainingBookings === 0) {
          await tx.apartment.updateMany({
            where: {
              id: booking.apartmentId,
              status: ApartmentStatus.RESERVED,
            },
            data: { status: ApartmentStatus.AVAILABLE },
          });
        }
      }

      return updatedBooking;
    });

    return {
      message: 'Статус брони успешно обновлен',
      data: {
        id: updated.id,
        status: updated.status,
        createdAt: updated.createdAt,
        userId: updated.userId,
        apartmentId: updated.apartmentId,
        user: updated.user,
        apartment: mapBookingApartment(updated.apartment),
      },
    };
  }

  async removeAdmin(id: number): Promise<ServiceMessageResponse> {
    this.logger.log(`Admin removing booking (id=${id})`);

    await this.prismaService.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        select: {
          apartmentId: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Бронь не найдена');
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
        await tx.apartment.updateMany({
          where: {
            id: booking.apartmentId,
            status: ApartmentStatus.RESERVED,
          },
          data: {
            status: ApartmentStatus.AVAILABLE,
          },
        });
      }
    });

    return {
      message: 'Бронь успешно удалена',
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cancelExpiredBookings() {
    const expirationDays = Number(process.env.BOOKING_EXPIRATION_DAYS);

    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - expirationDays);

    const expiredBookings = await this.prismaService.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        createdAt: { lte: expiredDate },
      },
      select: {
        id: true,
        apartmentId: true,
      },
    });

    if (!expiredBookings.length) return;

    const apartmentIds = [
      ...new Set(expiredBookings.map((b) => b.apartmentId)),
    ];
    const bookingIds = expiredBookings.map((b) => b.id);

    await this.prismaService.$transaction(async (tx) => {
      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: BookingStatus.CANCELLED },
      });

      for (const apartmentId of apartmentIds) {
        const remainingBookings = await tx.booking.count({
          where: {
            apartmentId,
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
            },
          },
        });

        if (remainingBookings === 0) {
          await tx.apartment.updateMany({
            where: {
              id: apartmentId,
              status: ApartmentStatus.RESERVED,
            },
            data: { status: ApartmentStatus.AVAILABLE },
          });
        }
      }
    });

    this.logger.log(`Cron: ${expiredBookings.length} bookings cancelled`);
  }
}
