import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/user.model'
import { Bug } from '../models/bug.model'
import { RefreshToken } from '../models/notification.model'
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response'
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors'
import { parsePagination } from '../utils/helpers'
import { emailService } from '../services/email.service'

// ─── List Users (any authenticated user can view team) ────────────────────────
export const listUsers = async (req: Request, res: Response) => {
  const { page, limit, role, search, isActive } = req.query as Record<string, string>
  const { page: p, limit: l, skip } = parsePagination(page, limit)

  const filter: Record<string, unknown> = {}
  if (role)              filter.role     = role
  if (isActive !== undefined) filter.isActive = isActive === 'true'
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(l).sort({ createdAt: -1 }).lean(),
    User.countDocuments(filter),
  ])

  return sendPaginated(res, users, total, p, l)
}

// ─── Get Single User ──────────────────────────────────────────────────────────
export const getUser = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).lean()
  if (!user) throw new NotFoundError('User not found')
  return sendSuccess(res, user)
}

// ─── Create User — ADMIN ONLY — no public self-registration ───────────────────
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body

  if (await User.findOne({ email })) throw new ConflictError('Email already registered')

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, passwordHash, role: role || 'REPORTER' })

  // Send welcome email with credentials
  emailService.sendWelcomeNewUser(user.email, user.name, email, password).catch(() => {})

  return sendCreated(res, user, 'User created')
}

// ─── Update User (self or admin) ──────────────────────────────────────────────
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const requester = req.user!

  if (id !== requester.userId && requester.role !== 'ADMIN') {
    throw new ForbiddenError('Cannot update another user')
  }

  const { name, avatar } = req.body
  const update: Record<string, unknown> = {}
  if (name)   update.name   = name
  if (avatar) update.avatar = avatar

  const user = await User.findByIdAndUpdate(id, update, { new: true }).lean()
  if (!user) throw new NotFoundError('User not found')
  return sendSuccess(res, user, 'Profile updated')
}

// ─── Update Role — ADMIN ONLY ─────────────────────────────────────────────────
export const updateRole = async (req: Request, res: Response) => {
  const { id } = req.params
  if (id === req.user!.userId) throw new ForbiddenError('Cannot change your own role')

  const user = await User.findByIdAndUpdate(id, { role: req.body.role }, { new: true }).lean()
  if (!user) throw new NotFoundError('User not found')
  return sendSuccess(res, user, 'Role updated')
}

// ─── Toggle Active — ADMIN ONLY ───────────────────────────────────────────────
export const toggleActive = async (req: Request, res: Response) => {
  const { id } = req.params
  if (id === req.user!.userId) throw new ForbiddenError('Cannot deactivate yourself')

  const user = await User.findById(id)
  if (!user) throw new NotFoundError('User not found')

  user.isActive = !user.isActive
  await user.save()

  // Revoke all sessions when deactivated
  if (!user.isActive) await RefreshToken.deleteMany({ user: user._id })

  return sendSuccess(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`)
}

// ─── Reset User Password — ADMIN ONLY ────────────────────────────────────────
export const adminResetPassword = async (req: Request, res: Response) => {
  const { id } = req.params
  const { newPassword } = req.body

  const user = await User.findById(id)
  if (!user) throw new NotFoundError('User not found')

  user.passwordHash = await bcrypt.hash(newPassword, 12)
  await user.save()
  await RefreshToken.deleteMany({ user: user._id })

  emailService.sendPasswordResetByAdmin(user.email, user.name, newPassword).catch(() => {})

  return sendSuccess(res, null, 'Password reset and user notified')
}

// ─── Get user stats ───────────────────────────────────────────────────────────
export const getUserStats = async (req: Request, res: Response) => {
  const { id } = req.params
  const [assigned, reported] = await Promise.all([
    Bug.countDocuments({ assignee: id }),
    Bug.countDocuments({ reporter: id }),
  ])
  const resolved = await Bug.countDocuments({ assignee: id, status: { $in: ['RESOLVED', 'CLOSED'] } })
  return sendSuccess(res, { assigned, reported, resolved })
}
