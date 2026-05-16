import { Request, NextFunction, Response } from 'express';
import { AppError } from './AppError.js';
import { logger } from '../logger/logger.js';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: [],
    });
    return;
  }

  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    res.status(400).json({
      success: false,
      message: 'Duplicate value error',
      errors: [],
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      errors: [],
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: err.message,
      errors: [],
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      errors: [],
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      errors: [],
    });
    return;
  }

  logger.error(err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
  });
}