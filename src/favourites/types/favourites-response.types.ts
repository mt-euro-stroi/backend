import { ApartmentStatus } from 'src/generated/prisma/enums';
import { File } from 'src/common/types/file.type';

export interface FavouriteApartmentCard {
  id: number;
  entrance: number;
  number: number;
  rooms: number;
  area: number;
  floor: number;
  price: number;
  status: ApartmentStatus;
  isPublished: boolean;
  files: File[];
}

export interface FavouriteListItem {
  id: number;
  createdAt: Date;
  apartment: FavouriteApartmentCard;
}

export interface FavouriteResponse extends FavouriteListItem {
  userId: number;
  apartmentId: number;
}
