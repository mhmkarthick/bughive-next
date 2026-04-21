export type Role        = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'QA' | 'REPORTER'
export type BugStatus   = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED' | 'REOPENED'
export type Priority    = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type Severity    = 'BLOCKER' | 'MAJOR' | 'MINOR' | 'TRIVIAL'
export type NotifType   = 'BUG_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'PRIORITY_CHANGED' | 'BUG_RESOLVED' | 'MENTION'

export interface User {
  id: string; _id?: string
  name: string; email: string; role: Role
  avatar?: string; isActive: boolean
  emailVerified: boolean; lastLoginAt?: string; createdAt: string
}

export interface ProjectMember { user: Pick<User,'id'|'name'|'email'|'avatar'>; role: Role; joinedAt: string }

export interface Project {
  id: string; _id?: string; name: string; slug: string
  description?: string; isActive: boolean
  owner: Pick<User,'id'|'name'|'avatar'>
  members: ProjectMember[]
  bugCount?: number; createdAt: string; updatedAt: string
}

export interface Comment {
  _id: string; content: string; isEdited: boolean
  user: Pick<User,'id'|'name'|'avatar'|'role'>
  createdAt: string; updatedAt: string
}

export interface Attachment {
  _id: string; filename: string; originalName: string
  mimeType: string; size: number; url: string
  uploadedBy: Pick<User,'id'|'name'>; createdAt: string
}

export interface ActivityLog {
  _id: string; action: string; oldValue?: string; newValue?: string
  user: Pick<User,'id'|'name'|'avatar'>; createdAt: string
}

export interface Bug {
  id: string; _id?: string; bugId: string
  title: string; description: string
  stepsToReproduce?: string; expectedBehavior?: string; actualBehavior?: string
  environment?: string; browser?: string; os?: string; version?: string
  status: BugStatus; priority: Priority; severity: Severity
  project: Pick<Project,'id'|'name'|'slug'>
  reporter: Pick<User,'id'|'name'|'email'|'avatar'|'role'>
  assignee?: Pick<User,'id'|'name'|'email'|'avatar'|'role'> | null
  tags: string[]
  comments?: Comment[]; attachments?: Attachment[]; activityLog?: ActivityLog[]
  dueDate?: string; resolvedAt?: string; closedAt?: string
  createdAt: string; updatedAt: string
}

export interface Notification {
  id: string; _id?: string; type: NotifType
  title: string; message: string
  isRead: boolean; readAt?: string; createdAt: string
  triggeredBy?: Pick<User,'id'|'name'|'avatar'>
  bug?: { _id: string; bugId: string; title: string }
}

export interface DashboardStats {
  summary: {
    totalBugs: number; openBugs: number; inProgressBugs: number
    resolvedBugs: number; criticalBugs: number; blockerBugs: number
    newThisWeek: number; resolvedThisWeek: number; overdueCount: number
  }
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  weeklyTrend: { date: string; count: number }[]
  topAssignees: { user: Pick<User,'id'|'name'|'avatar'>; count: number }[]
  recentBugs: Bug[]
}

export interface BugFilters {
  status?: BugStatus | ''; priority?: Priority | ''; severity?: Severity | ''
  projectId?: string; assigneeId?: string; reporterId?: string; search?: string
  page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T> { success: boolean; message: string; data: T }
export interface PaginatedResponse<T> {
  success: boolean; data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean; unreadCount?: number }
}

export interface CreateBugPayload {
  title: string; description: string
  stepsToReproduce?: string; expectedBehavior?: string; actualBehavior?: string
  environment?: string; browser?: string; os?: string; version?: string
  priority?: Priority; severity?: Severity
  projectId: string; assigneeId?: string | null
  dueDate?: string | null; tags?: string[]
}
