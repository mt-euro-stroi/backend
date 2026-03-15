import { filesSelect } from 'src/common/types/file.select';

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

export const bookingListSelect = {
  id: true,
  status: true,
  createdAt: true,
  apartment: {
    select: apartmentCardSelect,
  },
} as const;

export const bookingResponseSelect = {
  ...bookingListSelect,
  userId: true,
  apartmentId: true,
} as const;

export const bookingAdminSelect = {
  ...bookingResponseSelect,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;
