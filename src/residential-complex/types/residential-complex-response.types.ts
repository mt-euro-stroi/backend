export interface ResidentialComplexListItem {
  id: number;
  title: string;
  slug: string;
  city: string;
  address: string;
  isPublished: boolean;
  files: File[];   // 🔹 добавили массив файлов
}

export interface ResidentialComplexResponse extends ResidentialComplexListItem {
  description?: string | null;
  developerName?: string | null;
  completionDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface File {
  id: number;
  path: string;
}
