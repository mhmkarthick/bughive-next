export class AppError extends Error {
  statusCode: number
  isOperational: boolean
  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}
export class NotFoundError     extends AppError { constructor(m = 'Not found')          { super(m, 404) } }
export class UnauthorizedError extends AppError { constructor(m = 'Unauthorized')        { super(m, 401) } }
export class ForbiddenError    extends AppError { constructor(m = 'Forbidden')           { super(m, 403) } }
export class ConflictError     extends AppError { constructor(m = 'Already exists')      { super(m, 409) } }
export class ValidationError   extends AppError {
  errors: unknown[]
  constructor(m = 'Validation failed', errors: unknown[] = []) { super(m, 422); this.errors = errors }
}
