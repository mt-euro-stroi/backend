export interface ServiceMessageResponse {
  message: string;
}

export interface ServiceDataResponse<T> extends ServiceMessageResponse {
  data: T;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
