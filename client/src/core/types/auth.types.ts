export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string | null;
  permissions?: string[];
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface PasswordPolicy {
  passwordMinLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  passwordHistoryCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
}
