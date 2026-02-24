export const apartmentInclude = {
  files: {
    select: { id: true, path: true },
    orderBy: { createdAt: 'asc' as const },
  },
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
