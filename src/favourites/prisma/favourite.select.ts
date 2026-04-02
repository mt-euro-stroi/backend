export const favouriteApartmentSelect = {
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
    select: {
      id: true,
      path: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export const favouriteListSelect = {
  id: true,
  createdAt: true,
  apartment: {
    select: favouriteApartmentSelect,
  },
} as const;

export const favouriteResponseSelect = {
  id: true,
  userId: true,
  apartmentId: true,
  createdAt: true,
  apartment: {
    select: favouriteApartmentSelect,
  },
} as const;
