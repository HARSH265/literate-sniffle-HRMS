import type { Request } from 'express';
import type { PaginationInput } from '../validation/common.schemas.js';
import type { PaginationMeta } from '../../types/index.js';

export type { PaginationMeta } from '../../types/index.js';

export class PaginationUtil {
  static parse(req: Request): PaginationInput {
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = Math.min(parseInt(String(req.query.limit || '10'), 10), 100);
    const sort = String(req.query.sort || 'createdAt');
    const order = req.query.order === 'asc' ? 'asc' : 'desc';

    return { page, limit, sort, order };
  }

  static parseFromObject(params: Record<string, unknown>): { page: number; limit: number; sort: string; order: 'asc' | 'desc'; search?: string } {
    const query = params.query as Record<string, unknown> | undefined;
    const page = parseInt(String(query?.page || params.page || '1'), 10);
    const limit = Math.min(parseInt(String(query?.limit || params.limit || '10'), 10), 100);
    const sort = String(query?.sort || params.sort || 'createdAt');
    const order = (query?.order === 'asc' || params.order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const search = String(query?.search || params.search || '');

    return { page, limit, sort, order, search: search || undefined };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static getMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default PaginationUtil;