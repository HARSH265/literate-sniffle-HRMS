export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LocationState {
  section?: string;
  [key: string]: unknown;
}

export interface NameEntity {
  id: string;
  name: string;
}

export type UserRole = 'super-admin' | 'hr-admin' | 'hr-staff' | 'accounts' | 'manager';

export function isNameEntity(value: unknown): value is NameEntity {
  return typeof value === 'object' && value !== null && 'name' in value && typeof (value as NameEntity).name === 'string';
}

export function isNamedLabel(value: unknown): value is { name: string } | { label: string } {
  if (typeof value !== 'object' || value === null) return false;
  return 'name' in value || 'label' in value;
}
