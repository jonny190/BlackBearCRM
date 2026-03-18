import { Response } from 'express';
import type { PaginationMeta } from '@blackpear/shared';

export function sendSuccess<T>(res: Response, data: T, meta?: PaginationMeta, status = 200) {
  const body: { data: T; meta?: PaginationMeta } = { data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendCreated<T>(res: Response, data: T) {
  return sendSuccess(res, data, undefined, 201);
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
