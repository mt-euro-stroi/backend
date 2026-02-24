export const complexFilesInclude = {
  files: {
    select: { id: true, path: true },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;
