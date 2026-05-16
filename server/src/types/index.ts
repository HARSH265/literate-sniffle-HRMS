export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export type QueryParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  department?: string;
  month?: string;
};