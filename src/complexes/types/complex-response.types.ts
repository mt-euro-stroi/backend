import { File } from 'src/common/types/file.type';
import { ApartmentStatus } from 'src/generated/prisma/enums';

export interface ComplexListItem {
  id: number;
  title: string;
  slug: string;
  city: string;
  address: string;
  priceFrom?: number | null;
  isPublished: boolean;
  files: File[];
}

export interface ComplexApartmentCard {
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

export interface ComplexResponse extends ComplexListItem {
  description?: string | null;
  completionDate?: Date | null;
  apartments?: ComplexApartmentCard[];
  createdAt: Date;
  updatedAt: Date;
}
