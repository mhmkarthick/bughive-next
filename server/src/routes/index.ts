import { Router } from 'express'
import { z } from 'zod'
import * as auth    from '../controllers/auth.controller'
import * as bugs    from '../controllers/bug.controller'
import * as users   from '../controllers/user.controller'
import * as projects from '../controllers/project.controller'
import * as misc    from '../controllers/misc.controller'
import { authenticate, requireAdmin, requireBugCreator, requireManager } from '../middleware/auth'
import { validate } from '../middleware/index'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authRouter = Router()

authRouter.post('/login',
  validate(z.object({ email: z.string().email(), password: z.string().min(1) })),
  auth.login)
authRouter.post('/refresh', auth.refreshTokens)
authRouter.post('/logout',  auth.logout)
authRouter.get( '/me',      authenticate, auth.getMe)
authRouter.patch('/change-password', authenticate,
  validate(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })),
  auth.changePassword)

// ─── Users (Admin-only creation) ──────────────────────────────────────────────
export const usersRouter = Router()
usersRouter.use(authenticate)

usersRouter.get('/',    users.listUsers)
usersRouter.get('/:id', users.getUser)
usersRouter.get('/:id/stats', users.getUserStats)
usersRouter.post('/',   requireAdmin,
  validate(z.object({
    name:     z.string().min(2).max(60),
    email:    z.string().email(),
    password: z.string().min(8),
    role:     z.enum(['ADMIN','PROJECT_MANAGER','DEVELOPER','QA','REPORTER']).optional(),
  })),
  users.createUser)
usersRouter.patch('/:id',       validate(z.object({ name: z.string().optional(), avatar: z.string().optional() })), users.updateUser)
usersRouter.patch('/:id/role',  requireAdmin, users.updateRole)
usersRouter.patch('/:id/toggle-active', requireAdmin, users.toggleActive)
usersRouter.patch('/:id/reset-password', requireAdmin,
  validate(z.object({ newPassword: z.string().min(8) })),
  users.adminResetPassword)

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsRouter = Router()
projectsRouter.use(authenticate)

projectsRouter.get('/',    projects.listProjects)
projectsRouter.get('/:id', projects.getProject)
projectsRouter.post('/',   requireManager,
  validate(z.object({ name: z.string().min(2).max(100), description: z.string().optional() })),
  projects.createProject)
projectsRouter.patch('/:id', requireManager,
  validate(z.object({ name: z.string().optional(), description: z.string().optional() })),
  projects.updateProject)
projectsRouter.post('/:id/members',         requireManager, projects.addMember)
projectsRouter.delete('/:id/members/:userId', requireManager, projects.removeMember)

// ─── Bugs ─────────────────────────────────────────────────────────────────────
export const bugsRouter = Router()
bugsRouter.use(authenticate)

const bugCreateSchema = z.object({
  title:            z.string().min(5).max(200),
  description:      z.string().min(10),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior:   z.string().optional(),
  environment:      z.string().optional(),
  browser:          z.string().optional(),
  os:               z.string().optional(),
  version:          z.string().optional(),
  priority:         z.enum(['CRITICAL','HIGH','MEDIUM','LOW']).optional(),
  severity:         z.enum(['BLOCKER','MAJOR','MINOR','TRIVIAL']).optional(),
  projectId:        z.string().min(1),
  assigneeId:       z.string().optional().nullable(),
  dueDate:          z.string().optional().nullable(),
  tags:             z.array(z.string()).optional(),
})

bugsRouter.get('/',      bugs.listBugs)
bugsRouter.get('/stats', bugs.getBugStats)
bugsRouter.get('/:id',   bugs.getBug)
bugsRouter.post('/',     requireBugCreator, validate(bugCreateSchema), bugs.createBug)
bugsRouter.patch('/:id', validate(bugCreateSchema.partial().omit({ projectId: true })), bugs.updateBug)
bugsRouter.delete('/:id', bugs.deleteBug)
bugsRouter.post('/:id/comments', validate(z.object({ content: z.string().min(1).max(5000) })), bugs.addComment)
bugsRouter.delete('/:id/comments/:commentId', bugs.deleteComment)

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsRouter = Router()
notificationsRouter.use(authenticate)

notificationsRouter.get('/',              misc.listNotifications)
notificationsRouter.get('/unread-count',  misc.getUnreadCount)
notificationsRouter.patch('/mark-all-read', misc.markAllRead)
notificationsRouter.patch('/:id/read',    misc.markRead)
notificationsRouter.delete('/:id',        misc.deleteNotification)

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardRouter = Router()
dashboardRouter.use(authenticate)

dashboardRouter.get('/stats',    misc.getDashboardStats)
dashboardRouter.get('/my-stats', misc.getMyStats)
