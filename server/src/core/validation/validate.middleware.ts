import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../errors/AppError.js';

type ValidateTarget = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const result = schema.safeParse(data);

      if (!result.success) {
        throw new AppError('Validation failed', 400);
      }

      req[target] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}