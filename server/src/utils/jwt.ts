import jwt from 'jsonwebtoken'
import { UnauthorizedError } from './errors'

export interface JwtPayload { userId: string; email: string; role: string }

export const signAccessToken  = (p: JwtPayload) =>
  jwt.sign(p, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions)
export const signRefreshToken = (p: JwtPayload) =>
  jwt.sign(p, process.env.JWT_REFRESH_SECRET!, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions)

export const verifyAccessToken = (token: string): JwtPayload => {
  try { return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload }
  catch (e) { throw e instanceof jwt.TokenExpiredError ? new UnauthorizedError('Token expired') : new UnauthorizedError('Invalid token') }
}
export const verifyRefreshToken = (token: string): JwtPayload => {
  try { return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload }
  catch { throw new UnauthorizedError('Invalid refresh token') }
}
export const generateTokenPair = (p: JwtPayload) => ({ accessToken: signAccessToken(p), refreshToken: signRefreshToken(p) })
