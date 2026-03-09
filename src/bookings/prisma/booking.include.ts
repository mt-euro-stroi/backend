export const bookingApartmentInclude = {
  apartment: {
    include: {
      complex: {
        select: {
          title: true,
        },
      },
      files: {
        select: { id: true, path: true },
        orderBy: { createdAt: 'asc' as const },
      },
    },
  },
} as const;