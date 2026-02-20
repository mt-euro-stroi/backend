import { FavouriteApartmentCard } from '../types/favourites-response.types';

export function mapFavouriteApartment(
  apartment: any,
): FavouriteApartmentCard {
  return {
    ...apartment,
    area: Number(apartment.area),
  };
}
