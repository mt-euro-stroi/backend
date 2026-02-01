export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ServiceMessageResponse {
  message: string;
}

export interface ServiceDataResponse<T> extends ServiceMessageResponse {
  data: T;
}

export interface UserResponse {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string;
  role: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
