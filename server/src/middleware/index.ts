import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError, ValidationError } from '../utils/errors'
import { logger } from '../utils/logger'

// ─── Global error handler ─────────────────────────────────────────────────────
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`)

  if (err instanceof ValidationError) {
    return res.status(422).json({ success: false, message: err.message, errors: err.errors })
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message })
  }
  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    return res.status(409).json({ success: false, message: 'Resource already exists' })
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: err.message })
  }
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}

// ─── 404 ─────────────────────────────────────────────────────────────────────
export const notFound = (req: Request, res: Response) =>
  res.status(404).json({ success: false, message: `${req.method} ${req.originalUrl} not found` })

// ─── Zod validation ───────────────────────────────────────────────────────────
export const validate =
  (schema: ZodSchema, from: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[from] = schema.parse(req[from])
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError('Validation failed', err.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
      }
      next(err)
    }
  }
