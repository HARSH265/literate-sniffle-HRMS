import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ResponseHandler {
  static success(res: Response, data: unknown, message = 'Success'): void {
    res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  static paginated(
    res: Response,
    data: unknown,
    meta: PaginationMeta,
    message = 'Success',
  ): void {
    res.status(200).json({
      success: true,
      message,
      data,
      meta,
    });
  }

  static created(res: Response, data: unknown, message = 'Created successfully'): void {
    res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static noContent(res: Response): void {
    res.status(204).send();
  }

  static error(res: Response, message = 'Error', statusCode = 400): void {
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}