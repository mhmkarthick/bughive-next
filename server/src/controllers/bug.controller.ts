import { Request, Response } from 'express'
import { Bug } from '../models/bug.model'
import { Project } from '../models/project.model'
import { User } from '../models/user.model'
import { Notification } from '../models/notification.model'
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response'
import { NotFoundError, ForbiddenError } from '../utils/errors'
import { generateBugId, parsePagination } from '../utils/helpers'
import { emailService } from '../services/email.service'
import { getIO } from '../socket'

const POPULATE_BUG = [
  { path: 'project', select: 'name slug' },
  { path: 'reporter', select: 'name email avatar role' },
  { path: 'assignee', select: 'name email avatar role' },
  { path: 'comments.user', select: 'name avatar role' },
  { path: 'attachments.uploadedBy', select: 'name' },
  { path: 'activityLog.user', select: 'name avatar' },
]

// ─── List Bugs ────────────────────────────────────────────────────────────────
export const listBugs = async (req: Request, res: Response) => {
  const {
    page, limit, status, priority, severity,
    projectId, assigneeId, reporterId, search,
    sortBy = 'createdAt', sortOrder = 'desc', tags,
  } = req.query as Record<string, string>

  const { page: p, limit: l, skip } = parsePagination(page, limit)

  const filter: Record<string, unknown> = {}
  if (status)     filter.status   = status
  if (priority)   filter.priority = priority
  if (severity)   filter.severity = severity
  if (projectId)  filter.project  = projectId
  if (assigneeId) filter.assignee = assigneeId
  if (reporterId) filter.reporter = reporterId
  if (tags)       filter.tags     = { $in: tags.split(',') }
  if (search)     filter.$text    = { $search: search }

  const sortDir = sortOrder === 'asc' ? 1 : -1
  const validSorts = ['createdAt', 'updatedAt', 'priority', 'severity', 'status']
  const sort: Record<string, 1 | -1> = {
    [validSorts.includes(sortBy) ? sortBy : 'createdAt']: sortDir,
  }

  const [bugs, total] = await Promise.all([
    Bug.find(filter)
      .populate('project', 'name slug')
      .populate('reporter', 'name email avatar role')
      .populate('assignee', 'name email avatar role')
      .select('-comments -attachments -activityLog')
      .sort(sort)
      .skip(skip)
      .limit(l)
      .lean(),
    Bug.countDocuments(filter),
  ])

  return sendPaginated(res, bugs, total, p, l)
}

// ─── Get Single Bug ───────────────────────────────────────────────────────────
export const getBug = async (req: Request, res: Response) => {
  const { id } = req.params
  const bug = await Bug.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bugId: id }] })
    .populate(POPULATE_BUG)
    .lean()

  if (!bug) throw new NotFoundError('Bug not found')
  return sendSuccess(res, bug)
}

// ─── Create Bug ───────────────────────────────────────────────────────────────
export const createBug = async (req: Request, res: Response) => {
  const {
    title, description, stepsToReproduce, expectedBehavior, actualBehavior,
    environment, browser, os, version,
    priority = 'MEDIUM', severity = 'MAJOR',
    projectId, assigneeId, dueDate, tags = [],
  } = req.body

  const project = await Project.findById(projectId)
  if (!project) throw new NotFoundError('Project not found')

  const bugId = await generateBugId(project.slug)

  const bug = await Bug.create({
    bugId, title, description, stepsToReproduce, expectedBehavior, actualBehavior,
    environment, browser, os, version, priority, severity,
    project: projectId,
    reporter: req.user!.userId,
    assignee: assigneeId || null,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    tags: (tags as string[]).map((t: string) => t.toLowerCase().trim()),
    activityLog: [{
      user: req.user!.userId,
      action: 'CREATED',
      createdAt: new Date(),
    }],
  })

  await bug.populate(POPULATE_BUG)

  // Notify assignee
  if (assigneeId && assigneeId !== req.user!.userId) {
    const notif = await Notification.create({
      receiver: assigneeId,
      triggeredBy: req.user!.userId,
      bug: bug._id,
      type: 'BUG_ASSIGNED',
      title: 'Bug Assigned',
      message: `You were assigned ${bugId}`,
    })
    getIO()?.to(`user:${assigneeId}`).emit('notification', notif)

    const assignee = await User.findById(assigneeId).select('email name')
    if (assignee) {
      emailService.sendBugAssigned(assignee.email, assignee.name, bugId, title, req.user!.email).catch(() => {})
    }
  }

  return sendCreated(res, bug, 'Bug reported')
}

// ─── Update Bug ───────────────────────────────────────────────────────────────
export const updateBug = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user!

  const bug = await Bug.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bugId: id }] })
  if (!bug) throw new NotFoundError('Bug not found')

  const isPrivileged = ['ADMIN', 'PROJECT_MANAGER'].includes(user.role)
  const isReporter   = String(bug.reporter) === user.userId
  const isAssignee   = String(bug.assignee) === user.userId
  if (!isPrivileged && !isReporter && !isAssignee) throw new ForbiddenError('Not authorized')

  const {
    title, description, stepsToReproduce, expectedBehavior, actualBehavior,
    environment, browser, os, version, status, priority, severity,
    assigneeId, dueDate, tags,
  } = req.body

  const activities: Array<{ user: string; action: string; oldValue?: string; newValue?: string }> = []

  // Track changes for activity log
  if (status && status !== bug.status) {
    activities.push({ user: user.userId, action: 'STATUS_CHANGED', oldValue: bug.status, newValue: status })
    bug.status = status
    if (status === 'RESOLVED') bug.resolvedAt = new Date()
    if (status === 'CLOSED')   bug.closedAt   = new Date()

    // Notify reporter of status change
    if (String(bug.reporter) !== user.userId) {
      const notif = await Notification.create({
        receiver: bug.reporter,
        triggeredBy: user.userId,
        bug: bug._id,
        type: 'STATUS_CHANGED',
        title: 'Bug Status Changed',
        message: `${bug.bugId} moved to ${status}`,
      })
      getIO()?.to(`user:${String(bug.reporter)}`).emit('notification', notif)
    }
  }

  if (priority && priority !== bug.priority) {
    activities.push({ user: user.userId, action: 'PRIORITY_CHANGED', oldValue: bug.priority, newValue: priority })
    bug.priority = priority
  }
  if (severity && severity !== bug.severity) {
    activities.push({ user: user.userId, action: 'SEVERITY_CHANGED', oldValue: bug.severity, newValue: severity })
    bug.severity = severity
  }
  if (assigneeId !== undefined && assigneeId !== String(bug.assignee)) {
    activities.push({ user: user.userId, action: assigneeId ? 'ASSIGNED' : 'UNASSIGNED', newValue: assigneeId || undefined })
    bug.assignee = assigneeId || null

    if (assigneeId && assigneeId !== user.userId) {
      const notif = await Notification.create({
        receiver: assigneeId, triggeredBy: user.userId, bug: bug._id,
        type: 'BUG_ASSIGNED', title: 'Bug Assigned', message: `You were assigned ${bug.bugId}`,
      })
      getIO()?.to(`user:${assigneeId}`).emit('notification', notif)
    }
  }

  if (title !== undefined)            bug.title            = title
  if (description !== undefined)      bug.description      = description
  if (stepsToReproduce !== undefined) bug.stepsToReproduce = stepsToReproduce
  if (expectedBehavior !== undefined) bug.expectedBehavior = expectedBehavior
  if (actualBehavior !== undefined)   bug.actualBehavior   = actualBehavior
  if (environment !== undefined)      bug.environment      = environment
  if (browser !== undefined)          bug.browser          = browser
  if (os !== undefined)               bug.os               = os
  if (version !== undefined)          bug.version          = version
  if (dueDate !== undefined)          bug.dueDate          = dueDate ? new Date(dueDate) : undefined
  if (tags !== undefined)             bug.tags             = (tags as string[]).map((t: string) => t.toLowerCase().trim())

  // Append activity logs
  activities.forEach(a => bug.activityLog.push(a as any))

  await bug.save()
  await bug.populate(POPULATE_BUG)

  // Emit real-time update to bug room
  getIO()?.to(`bug:${bug._id}`).emit('bug:updated', bug)

  return sendSuccess(res, bug, 'Bug updated')
}

// ─── Delete Bug ───────────────────────────────────────────────────────────────
export const deleteBug = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user!
  const bug = await Bug.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bugId: id }] })
  if (!bug) throw new NotFoundError('Bug not found')
  if (user.role !== 'ADMIN' && String(bug.reporter) !== user.userId) throw new ForbiddenError()
  await bug.deleteOne()
  return sendSuccess(res, null, 'Bug deleted')
}

// ─── Add Comment ──────────────────────────────────────────────────────────────
export const addComment = async (req: Request, res: Response) => {
  const { id } = req.params
  const { content } = req.body
  const bug = await Bug.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bugId: id }] })
  if (!bug) throw new NotFoundError('Bug not found')

  bug.comments.push({ user: req.user!.userId as any, content, isEdited: false } as any)
  bug.activityLog.push({ user: req.user!.userId as any, action: 'COMMENTED' } as any)
  await bug.save()
  await bug.populate('comments.user', 'name avatar role')

  const newComment = bug.comments[bug.comments.length - 1]

  // Notify reporter + assignee (not commenter)
  const toNotify = [String(bug.reporter), bug.assignee ? String(bug.assignee) : '']
    .filter(uid => uid && uid !== req.user!.userId)

  await Promise.all(toNotify.map(async uid => {
    const notif = await Notification.create({
      receiver: uid, triggeredBy: req.user!.userId, bug: bug._id,
      type: 'COMMENT_ADDED', title: 'New Comment', message: `New comment on ${bug.bugId}`,
    })
    getIO()?.to(`user:${uid}`).emit('notification', notif)
  }))

  getIO()?.to(`bug:${bug._id}`).emit('comment:added', newComment)
  return sendCreated(res, newComment, 'Comment added')
}

// ─── Delete Comment ───────────────────────────────────────────────────────────
export const deleteComment = async (req: Request, res: Response) => {
  const { id, commentId } = req.params
  const bug = await Bug.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bugId: id }] })
  if (!bug) throw new NotFoundError('Bug not found')

  const comment = (bug.comments as any).id(commentId) as any
  if (!comment) throw new NotFoundError('Comment not found')
  if (String(comment.user) !== req.user!.userId && req.user!.role !== 'ADMIN') throw new ForbiddenError()

  ;(bug.comments as any).pull({ _id: commentId })
  await bug.save()
  getIO()?.to(`bug:${bug._id}`).emit('comment:deleted', commentId)
  return sendSuccess(res, null, 'Comment deleted')
}

// ─── Bug Stats ────────────────────────────────────────────────────────────────
export const getBugStats = async (req: Request, res: Response) => {
  const { projectId } = req.query as Record<string, string>
  const match = projectId ? { project: new (require('mongoose').Types.ObjectId)(projectId) } : {}

  const [byStatus, byPriority, bySeverity] = await Promise.all([
    Bug.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Bug.aggregate([{ $match: match }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Bug.aggregate([{ $match: match }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
  ])

  const toMap = (arr: { _id: string; count: number }[]) =>
    Object.fromEntries(arr.map(x => [x._id, x.count]))

  return sendSuccess(res, { byStatus: toMap(byStatus), byPriority: toMap(byPriority), bySeverity: toMap(bySeverity) })
}
