import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminFindAllBookingsDto } from '../dto/admin-find-all-bookings.dto';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import { BookingAdminResponse } from '../types/bookings-response.types';
import { ApartmentStatus, BookingStatus } from 'src/generated/prisma/enums';
import { UpdateBookingStatusDto } from '../dto/update-booking-status.dto';
import { bookingAdminInclude, bookingApartmentInclude } from '../prisma/booking.include';
import { mapBookingApartment } from '../mappers/booking.mapper';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AdminBookingsService {
  private readonly logger = new Logger(AdminBookingsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService
  ) {}

  async findAll(
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
        include: bookingAdminInclude,
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
      include: bookingAdminInclude,
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

    this.logger.log(
      `Admin updating booking status (id=${id}, newStatus=${status})`,
    );

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
        const apartment = await tx.apartment.findUnique({
          where: { id: booking.apartmentId },
          select: { status: true },
        });

        if (!apartment) {
          throw new NotFoundException('Квартира не найдена');
        }

        if (apartment.status === ApartmentStatus.SOLD) {
          throw new ConflictException('Квартира уже продана');
        }

        const updatedBooking = await tx.booking.update({
          where: { id },
          data: { status: BookingStatus.CONFIRMED },
          include: bookingAdminInclude,
        });

        await tx.booking.updateMany({
          where: {
            apartmentId: booking.apartmentId,
            status: BookingStatus.PENDING,
            NOT: { id },
          },
          data: { status: BookingStatus.CANCELLED },
        });

        await tx.apartment.update({
          where: { id: booking.apartmentId },
          data: { status: ApartmentStatus.SOLD },
        });

        return updatedBooking;
      }

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED },
        include: bookingAdminInclude,
      });

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
        await tx.apartment.update({
          where: { id: booking.apartmentId },
          data: { status: ApartmentStatus.AVAILABLE },
        });
      }

      return updatedBooking;
    });

    const apartmentTitle =
      `${updated.apartment.complex.title} — квартира ${updated.apartment.number}`;
    
    await this.mailService.sendBookingStatusEmail({
      email: updated.user.email,
      apartmentTitle,
      status: updated.status === BookingStatus.CONFIRMED ? 'CONFIRMED' : 'CANCELLED',
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

  async remove(id: number): Promise<ServiceMessageResponse> {
    this.logger.log(`Admin removing booking (id=${id})`);

    await this.prismaService.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        select: {
          apartmentId: true,
          status: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Бронь не найдена');
      }

      if (booking.status === BookingStatus.CONFIRMED) {
        throw new ConflictException(
          'Нельзя удалить подтвержденную бронь. Сначала отмените её',
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
    });

    return {
      message: 'Бронь успешно удалена',
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cancelExpiredBookings() {
    this.logger.log('Cron: checking expired bookings');

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const expiredBookings = await this.prismaService.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        createdAt: { lte: threeDaysAgo },
      },
      select: {
        id: true,
        apartmentId: true,
      },
    });

    if (!expiredBookings.length) {
      return;
    }

    const bookingIds = expiredBookings.map((b) => b.id);
    const apartmentIds = [...new Set(expiredBookings.map((b) => b.apartmentId))];

    await this.prismaService.$transaction(async (tx) => {
      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: BookingStatus.CANCELLED },
      });

      for (const apartmentId of apartmentIds) {
        const active = await tx.booking.count({
          where: {
            apartmentId,
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
            },
          },
        });

        if (active === 0) {
          await tx.apartment.update({
            where: { id: apartmentId },
            data: { status: ApartmentStatus.AVAILABLE },
          });
        }
      }
    });

    this.logger.log(`Cron: ${bookingIds.length} bookings cancelled`);
  }
}
