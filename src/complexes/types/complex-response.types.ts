import { Prisma } from 'src/generated/prisma/client';
import {
  apartmentCardSelect,
  complexFullSelect,
  complexListSelect,
} from '../prisma/complex.select';

export type ComplexListItem = Prisma.ComplexGetPayload<{
  select: typeof complexListSelect;
}>;

export type ComplexApartmentCard = Prisma.ApartmentGetPayload<{
  select: typeof apartmentCardSelect;
}>;

export type ComplexResponse = Prisma.ComplexGetPayload<{
  select: typeof complexFullSelect;
}>;
