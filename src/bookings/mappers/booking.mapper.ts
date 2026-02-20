import { BookingApartmentCard } from '../types/bookings-response.types';

export function mapBookingApartment(apartment: any): BookingApartmentCard {
  return {
    ...apartment,
    area: Number(apartment.area),
  };
}
