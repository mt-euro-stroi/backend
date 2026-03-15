import { ComplexApartmentCard } from '../types/complex-response.types';

export function mapApartmentCard(apartment: any): ComplexApartmentCard {
  return {
    ...apartment,
    area: Number(apartment.area),
  };
}
