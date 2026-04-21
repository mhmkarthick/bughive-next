import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/user.model'
import { RefreshToken } from '../models/notification.model'
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt'
import { sendSuccess, sendCreated } from '../utils/response'
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors'
import { emailService } from '../services/email.service'

// 🔥 FIXED COOKIE CONFIG
const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,                 // REQUIRED for production (https)
  sameSite: 'none' as const,    // 🔥 KEY FIX for cross-domain (Vercel ↔ Railway)
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}

// ─────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body

  if (await User.findOne({ email })) {
    throw new ConflictError('Email already registered')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'REPORTER',
  })

  const { accessToken, refreshToken } = generateTokenPair({
    userId: String(user._id),
    email: user.email,
    role: user.role,
  })

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: new Date(Date.now() + 7 * 86400000),
  })

  emailService.sendWelcome(user.email, user.name).catch(() => {})

  res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
})

  return sendCreated(res, { user, accessToken }, 'Registration successful')
}

// ─────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+passwordHash')
  if (!user) throw new UnauthorizedError('Invalid email or password')
  if (!user.isActive) throw new UnauthorizedError('Account deactivated')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new UnauthorizedError('Invalid email or password')

  const { accessToken, refreshToken } = generateTokenPair({
    userId: String(user._id),
    email: user.email,
    role: user.role,
  })

  // Clean expired tokens
  await RefreshToken.deleteMany({
    user: user._id,
    expiresAt: { $lt: new Date() },
  })

  // Store new refresh token
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: new Date(Date.now() + 7 * 86400000),
  })

  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() })

  res.cookie('refreshToken', refreshToken, COOKIE_OPTS)

  const { passwordHash: _, ...safeUser } = user.toObject()

  return sendSuccess(res, { user: safeUser, accessToken }, 'Login successful')
}

// ─────────────────────────────────────────────────────────────

export const refreshTokens = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken

  if (!token) throw new UnauthorizedError('No refresh token')

  const payload = verifyRefreshToken(token)

  const stored = await RefreshToken.findOne({ token })
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Token expired')
  }

  const user = await User.findById(payload.userId).select('email role isActive')
  if (!user || !user.isActive) throw new UnauthorizedError('User not found')

  const { accessToken, refreshToken: newRefresh } = generateTokenPair({
    userId: String(user._id),
    email: user.email,
    role: user.role,
  })

  await RefreshToken.findByIdAndUpdate(stored._id, {
    token: newRefresh,
    expiresAt: new Date(Date.now() + 7 * 86400000),
  })

  res.cookie('refreshToken', newRefresh, COOKIE_OPTS)

  return sendSuccess(res, { accessToken }, 'Token refreshed')
}

// ─────────────────────────────────────────────────────────────

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken

  if (token) {
    await RefreshToken.deleteMany({ token }).catch(() => {})
  }

  res.clearCookie('refreshToken', {
    ...COOKIE_OPTS,
  })

  return sendSuccess(res, null, 'Logged out')
}

// ─────────────────────────────────────────────────────────────

export const getMe = async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId)
  if (!user) throw new NotFoundError('User not found')

  return sendSuccess(res, user)
}

// ─────────────────────────────────────────────────────────────

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body

  const user = await User.findById(req.user!.userId).select('+passwordHash')
  if (!user) throw new NotFoundError()

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) throw new UnauthorizedError('Current password incorrect')

  user.passwordHash = await bcrypt.hash(newPassword, 12)
  await user.save()

  await RefreshToken.deleteMany({ user: user._id })

  return sendSuccess(res, null, 'Password changed. Please log in again.')
}