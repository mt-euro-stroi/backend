export interface ResidentialComplexListItem {
  id: number;
  title: string;
  slug: string;
  city: string;
  address: string;
  isPublished: boolean;
}

export interface ResidentialComplexResponse extends ResidentialComplexListItem {
  description?: string | null;
  developerName?: string | null;
  completionDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  files: File[];
}

export interface File {
  id: number;
  path: string;
}
