import { filesSelect } from 'src/common/types/file.select';

export const apartmentListSelect = {
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

export const apartmentResponseSelect = {
  ...apartmentListSelect,
  description: true,
  createdAt: true,
  updatedAt: true,
  complex: {
    select: {
      id: true,
      title: true,
      slug: true,
      city: true,
      address: true,
    },
  },
} as const;
