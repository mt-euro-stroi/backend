import { ApartmentResponse } from '../types/apartment-response.types';

export function mapApartment(apartment: any): ApartmentResponse {
  return {
    ...apartment,
    area: Number(apartment.area),
  };
}
