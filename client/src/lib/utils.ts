import { clsx, type ClassValue } from 'clsx'
import { formatDistanceToNow, format } from 'date-fns'
import type { BugStatus, Priority, Severity, Role } from '@/types'

export const cn = (...i: ClassValue[]) => clsx(i)

// ─── Date ─────────────────────────────────────────────────────────────────────
export const timeAgo     = (d: string | Date) => formatDistanceToNow(new Date(d), { addSuffix: true })
export const fmtDate     = (d: string | Date) => format(new Date(d), 'MMM d, yyyy')
export const fmtDateTime = (d: string | Date) => format(new Date(d), 'MMM d, yyyy HH:mm')
export const fmtFileSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`

// ─── Labels ───────────────────────────────────────────────────────────────────
export const STATUS_LABELS: Record<BugStatus, string> = {
  OPEN:'Open', IN_PROGRESS:'In Progress', IN_REVIEW:'In Review',
  RESOLVED:'Resolved', CLOSED:'Closed', REOPENED:'Reopened',
}
export const PRIORITY_LABELS: Record<Priority, string> = {
  CRITICAL:'Critical', HIGH:'High', MEDIUM:'Medium', LOW:'Low',
}
export const SEVERITY_LABELS: Record<Severity, string> = {
  BLOCKER:'Blocker', MAJOR:'Major', MINOR:'Minor', TRIVIAL:'Trivial',
}
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN:'Admin', PROJECT_MANAGER:'Project Manager',
  DEVELOPER:'Developer', QA:'QA', REPORTER:'Reporter',
}

// ─── Badge class helpers ──────────────────────────────────────────────────────
export const statusBadge   = (s: BugStatus) => `badge badge-${s.toLowerCase()}`
export const priorityBadge = (p: Priority)  => `badge badge-${p.toLowerCase()}`
export const severityBadge = (s: Severity)  => `badge badge-${s.toLowerCase()}`

// ─── Colors ───────────────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<BugStatus, string> = {
  OPEN:'#ef4444', IN_PROGRESS:'#f59e0b', IN_REVIEW:'#8b5cf6',
  RESOLVED:'#22c55e', CLOSED:'#6b7280', REOPENED:'#ef4444',
}
export const PRIORITY_COLORS: Record<Priority, string> = {
  CRITICAL:'#ef4444', HIGH:'#f59e0b', MEDIUM:'#3b82f6', LOW:'#22c55e',
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#22c55e','#f59e0b','#3b82f6','#14b8a6']
export const avatarColor = (name: string) => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}
export const initials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

// ─── Constants ────────────────────────────────────────────────────────────────
export const STATUSES:   BugStatus[] = ['OPEN','IN_PROGRESS','IN_REVIEW','RESOLVED','CLOSED','REOPENED']
export const PRIORITIES: Priority[]  = ['CRITICAL','HIGH','MEDIUM','LOW']
export const SEVERITIES: Severity[]  = ['BLOCKER','MAJOR','MINOR','TRIVIAL']
export const ROLES:      Role[]      = ['ADMIN','PROJECT_MANAGER','DEVELOPER','QA','REPORTER']
