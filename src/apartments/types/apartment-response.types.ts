import { Prisma } from 'src/generated/prisma/client';
import {
  apartmentListSelect,
  apartmentResponseSelect,
} from '../prisma/apartment.select';

export type ApartmentListItem = Prisma.ApartmentGetPayload<{
  select: typeof apartmentListSelect;
}>;

export type ApartmentResponse = Prisma.ApartmentGetPayload<{
  select: typeof apartmentResponseSelect;
}>;
