import { Prisma } from 'src/generated/prisma/client';
import {
  apartmentCardSelect,
  bookingAdminSelect,
  bookingListSelect,
  bookingResponseSelect,
} from '../prisma/booking.select';

export type BookingApartmentCard = Prisma.ApartmentGetPayload<{
  select: typeof apartmentCardSelect;
}>;

export type BookingBase = Prisma.BookingGetPayload<{
  select: typeof bookingListSelect;
}>;

export type BookingResponse = Prisma.BookingGetPayload<{
  select: typeof bookingResponseSelect;
}>;

export type BookingAdminResponse = Prisma.BookingGetPayload<{
  select: typeof bookingAdminSelect;
}>;
