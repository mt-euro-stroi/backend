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
import { bookingApartmentInclude } from '../prisma/booking.include';
import { mapBookingApartment } from '../mappers/booking.mapper';

@Injectable()
export class AdminBookingsService {
  private readonly logger = new Logger(AdminBookingsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll(
    query: AdminFindAllBookingsDto,
  ): Promise<ServiceDataResponse<PaginatedResult<BookingAdminResponse>>> {
    const { page = 1, limit = 20, userId, status } = query;

    const skip = (page - 1) * limit;

    this.logger.log(
      `Admin fetching bookings (page=${page}, limit=${limit}, status=${status ?? 'any'})`,
    );

    const where = {
      ...(status && { status }),
      ...(userId && { userId }),
    };

    const [bookings, total] = await this.prismaService.$transaction([
      this.prismaService.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          ...bookingApartmentInclude,
        },
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

  async findOne(
    id: number,
  ): Promise<ServiceDataResponse<BookingAdminResponse>> {
    this.logger.log(`Admin fetching booking (id=${id})`);

    const booking = await this.prismaService.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        ...bookingApartmentInclude,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      message: 'Booking retrieved successfully',
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

    const booking = await this.prismaService.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (status === BookingStatus.CONFIRMED) {
      const existingConfirmed = await this.prismaService.booking.findFirst({
        where: {
          apartmentId: booking.apartmentId,
          status: BookingStatus.CONFIRMED,
          NOT: { id },
        },
      });

      if (existingConfirmed) {
        throw new ConflictException('Apartment already has confirmed booking');
      }
    }

    const updated = await this.prismaService.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          ...bookingApartmentInclude,
        },
      });

      if (status === BookingStatus.CONFIRMED) {
        await tx.apartment.update({
          where: { id: booking.apartmentId },
          data: { status: ApartmentStatus.SOLD },
        });
      }

      if (status === BookingStatus.CANCELLED) {
        await tx.apartment.update({
          where: { id: booking.apartmentId },
          data: { status: ApartmentStatus.AVAILABLE },
        });
      }

      return updatedBooking;
    });

    return {
      message: 'Booking status updated successfully',
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

    const booking = await this.prismaService.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.booking.delete({ where: { id } });

      await tx.apartment.update({
        where: { id: booking.apartmentId },
        data: { status: ApartmentStatus.AVAILABLE },
      });
    });

    return {
      message: 'Booking removed successfully',
    };
  }
}
