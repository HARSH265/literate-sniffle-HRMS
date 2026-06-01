export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'MISSING_PARAMS'
  | 'RESOURCE_NOT_FOUND'
  | 'SETTINGS_NOT_FOUND';

export class AppError extends Error {
  statusCode: number;
  errorCode: ErrorCode;
  isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode?: ErrorCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || 'INTERNAL_ERROR';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}