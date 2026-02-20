import { BookingStatus, ApartmentStatus } from 'src/generated/prisma/enums';
import { File } from 'src/common/types/file.type';

export interface BookingApartmentCard {
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

export interface BookingBase {
  id: number;
  status: BookingStatus;
  createdAt: Date;
  apartment: BookingApartmentCard;
}

export interface BookingResponse extends BookingBase {
  userId: number;
  apartmentId: number;
}

export interface BookingAdminResponse extends BookingBase {
  userId: number;
  apartmentId: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}