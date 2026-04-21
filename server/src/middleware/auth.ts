import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JwtPayload } from '../utils/jwt'
import { UnauthorizedError, ForbiddenError } from '../utils/errors'
import { User } from '../models/user.model'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { isActive?: boolean }
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('No token provided')

  const token = header.split(' ')[1]
  const payload = verifyAccessToken(token)

  const user = await User.findById(payload.userId).select('isActive role').lean()
  if (!user || !user.isActive) throw new UnauthorizedError('User not found or deactivated')

  req.user = { ...payload, isActive: user.isActive }
  next()
}

export const requireRole = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError()
    if (!roles.includes(req.user.role)) throw new ForbiddenError(`Required role: ${roles.join(' or ')}`)
    next()
  }

export const requireAdmin   = requireRole('ADMIN')
export const requireManager = requireRole('ADMIN', 'PROJECT_MANAGER')
export const requireDev     = requireRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER')

// Bug creation is allowed for everyone except DEVELOPER
export const requireBugCreator = requireRole('ADMIN', 'PROJECT_MANAGER', 'QA', 'REPORTER')
