import { File } from 'src/common/types/file.type';
import { ApartmentStatus } from 'src/generated/prisma/enums';

export interface ApartmentListItem {
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

export interface ApartmentResponse extends ApartmentListItem {
  description?: string | null;
  complex: {
    id: number;
    title: string;
    slug: string;
    city: string;
    address: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
