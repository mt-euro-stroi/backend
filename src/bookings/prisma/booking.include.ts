export const bookingApartmentInclude = {
  apartment: {
    select: {
      id: true,
      number: true,
      complex: {
        select: { title: true }
      },
      files: {
        select: { id: true, path: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  }
} as const;

export const bookingInclude = {
  user: {
    select: {
      email: true,
    },
  },
  ...bookingApartmentInclude,
} as const;

export const bookingAdminInclude = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  ...bookingApartmentInclude,
} as const;