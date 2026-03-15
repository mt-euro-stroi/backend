import { filesSelect } from 'src/common/types/file.select';

export const complexListSelect = {
  id: true,
  title: true,
  slug: true,
  city: true,
  address: true,
  priceFrom: true,
  isPublished: true,
  files: {
    select: filesSelect,
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export const apartmentCardSelect = {
  id: true,
  entrance: true,
  number: true,
  rooms: true,
  area: true,
  floor: true,
  price: true,
  status: true,
  isPublished: true,
  files: {
    select: filesSelect,
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export const complexFullSelect = {
  ...complexListSelect,
  description: true,
  completionDate: true,
  createdAt: true,
  updatedAt: true,
  apartments: {
    select: apartmentCardSelect,
  },
} as const;
