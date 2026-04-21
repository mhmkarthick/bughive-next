import { Response } from 'express'
import { normalizeIds } from './normalize'
export const sendSuccess  = <T>(res: Response, data: T, message = 'Success', code = 200, meta?: object) =>
  res.status(code).json({ success: true, message, data: normalizeIds(data), ...(meta ? { meta } : {}) })
export const sendCreated  = <T>(res: Response, data: T, message = 'Created') => sendSuccess(res, data, message, 201)
export const sendError    = (res: Response, message: string, code = 400, errors?: unknown[]) =>
  res.status(code).json({ success: false, message, ...(errors ? { errors } : {}) })
export const sendPaginated = <T>(res: Response, data: T[], total: number, page: number, limit: number) =>
  res.json({ success: true, data: normalizeIds(data), meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } })
