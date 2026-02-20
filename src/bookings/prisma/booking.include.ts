export const bookingApartmentInclude = {
  apartment: {
    include: {
      files: {
        select: { id: true, path: true },
        orderBy: { createdAt: 'asc' as const },
      },
    },
  },
} as const;
