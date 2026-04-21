import { Request, Response } from 'express'
import { Notification } from '../models/notification.model'
import { Bug } from '../models/bug.model'
import { sendSuccess, sendPaginated } from '../utils/response'
import { parsePagination } from '../utils/helpers'
import mongoose from 'mongoose'
import { normalizeIds } from '../utils/normalize'

// ═══ NOTIFICATIONS ════════════════════════════════════════════════════════════

export const listNotifications = async (req: Request, res: Response) => {
  const { page, limit, unreadOnly } = req.query as Record<string, string>
  const { page: p, limit: l, skip } = parsePagination(page, limit, 50)

  const filter: Record<string, unknown> = { receiver: req.user!.userId }
  if (unreadOnly === 'true') filter.isRead = false

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('triggeredBy', 'name avatar')
      .populate('bug', 'bugId title')
      .sort({ createdAt: -1 })
      .skip(skip).limit(l).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ receiver: req.user!.userId, isRead: false }),
  ])

  return res.json({
    success: true,
    data: normalizeIds(notifications),
    meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l), unreadCount },
  })
}

export const markRead = async (req: Request, res: Response) => {
  await Notification.updateOne(
    { _id: req.params.id, receiver: req.user!.userId },
    { isRead: true, readAt: new Date() },
  )
  return sendSuccess(res, null, 'Marked as read')
}

export const markAllRead = async (req: Request, res: Response) => {
  await Notification.updateMany(
    { receiver: req.user!.userId, isRead: false },
    { isRead: true, readAt: new Date() },
  )
  return sendSuccess(res, null, 'All marked as read')
}

export const deleteNotification = async (req: Request, res: Response) => {
  await Notification.deleteOne({ _id: req.params.id, receiver: req.user!.userId })
  return sendSuccess(res, null, 'Deleted')
}

export const getUnreadCount = async (req: Request, res: Response) => {
  const count = await Notification.countDocuments({ receiver: req.user!.userId, isRead: false })
  return sendSuccess(res, { count })
}

// ═══ DASHBOARD ════════════════════════════════════════════════════════════════

export const getDashboardStats = async (req: Request, res: Response) => {
  const { projectId } = req.query as Record<string, string>
  const match: Record<string, unknown> = {}
  if (projectId) match.project = new mongoose.Types.ObjectId(projectId)

  const now      = new Date()
  const weekAgo  = new Date(now.getTime() - 7  * 86400000)
  const monthAgo = new Date(now.getTime() - 30 * 86400000)

  const [
    totalBugs, openBugs, inProgressBugs, resolvedBugs,
    criticalBugs, blockerBugs, newThisWeek, resolvedThisWeek,
    overdueCount, byStatus, byPriority, weeklyTrend, topAssignees, recentBugs,
  ] = await Promise.all([
    Bug.countDocuments(match),
    Bug.countDocuments({ ...match, status: 'OPEN' }),
    Bug.countDocuments({ ...match, status: 'IN_PROGRESS' }),
    Bug.countDocuments({ ...match, status: { $in: ['RESOLVED', 'CLOSED'] } }),
    Bug.countDocuments({ ...match, priority: 'CRITICAL' }),
    Bug.countDocuments({ ...match, severity: 'BLOCKER' }),
    Bug.countDocuments({ ...match, createdAt: { $gte: weekAgo } }),
    Bug.countDocuments({ ...match, resolvedAt: { $gte: weekAgo } }),
    Bug.countDocuments({ ...match, dueDate: { $lt: now }, status: { $nin: ['RESOLVED','CLOSED'] } }),
    Bug.aggregate([{ $match: match }, { $group: { _id: '$status',   count: { $sum: 1 } } }]),
    Bug.aggregate([{ $match: match }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    // 7-day daily counts
    Promise.all(Array.from({ length: 7 }, (_, i) => {
      const d    = new Date(now); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0)
      const next = new Date(d);   next.setDate(next.getDate() + 1)
      return Bug.countDocuments({ ...match, createdAt: { $gte: d, $lt: next } })
        .then(count => ({ date: d.toISOString().split('T')[0], count }))
    })),
    Bug.aggregate([
      { $match: { ...match, assignee: { $ne: null } } },
      { $group: { _id: '$assignee', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { count: 1, 'user.name': 1, 'user.avatar': 1, 'user._id': 1 } },
    ]),
    Bug.find(match)
      .populate('assignee', 'name avatar')
      .populate('project', 'name')
      .select('bugId title status priority updatedAt assignee project')
      .sort({ updatedAt: -1 }).limit(8).lean(),
  ])

  return sendSuccess(res, {
    summary: { totalBugs, openBugs, inProgressBugs, resolvedBugs, criticalBugs, blockerBugs, newThisWeek, resolvedThisWeek, overdueCount },
    byStatus:   Object.fromEntries(byStatus.map(x => [x._id, x.count])),
    byPriority: Object.fromEntries(byPriority.map(x => [x._id, x.count])),
    weeklyTrend,
    topAssignees,
    recentBugs,
  })
}

export const getMyStats = async (req: Request, res: Response) => {
  const uid = req.user!.userId
  const [assigned, open, inReview, resolved, reported] = await Promise.all([
    Bug.countDocuments({ assignee: uid }),
    Bug.countDocuments({ assignee: uid, status: 'OPEN' }),
    Bug.countDocuments({ assignee: uid, status: 'IN_REVIEW' }),
    Bug.countDocuments({ assignee: uid, status: { $in: ['RESOLVED','CLOSED'] } }),
    Bug.countDocuments({ reporter: uid }),
  ])
  const myBugs = await Bug.find({ assignee: uid, status: { $nin: ['RESOLVED','CLOSED'] } })
    .populate('project', 'name')
    .select('bugId title status priority dueDate project')
    .sort({ priority: 1, createdAt: -1 }).limit(10).lean()
  return sendSuccess(res, { assigned, open, inReview, resolved, reported, myBugs })
}
