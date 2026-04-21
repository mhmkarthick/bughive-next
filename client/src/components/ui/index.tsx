'use client'
import { X, Loader2, Inbox, AlertTriangle } from 'lucide-react'
import { initials, avatarColor, STATUS_LABELS, PRIORITY_LABELS, SEVERITY_LABELS } from '@/lib/utils'
import type { BugStatus, Priority, Severity, User } from '@/types'

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ user, size = 28, showName, className = '' }: {
  user?: Pick<User,'name'|'avatar'> | null; size?: number; showName?: boolean; className?: string
}) {
  if (!user) return <span className="text-xs text-ink-3">Unassigned</span>
  const color = avatarColor(user.name)
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {user.avatar
        ? <img src={user.avatar} alt={user.name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
        : <span className="rounded-full flex items-center justify-center font-semibold flex-shrink-0"
            style={{ width: size, height: size, background: color + '22', color, fontSize: size <= 28 ? 10 : 12 }}>
            {initials(user.name)}
          </span>
      }
      {showName && <span className="text-sm truncate">{user.name}</span>}
    </span>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────
export const StatusBadge   = ({ s }: { s: BugStatus })  => <span className={`badge badge-${s.toLowerCase()}`}>{STATUS_LABELS[s]}</span>
export const PriorityBadge = ({ p }: { p: Priority })   => <span className={`badge badge-${p.toLowerCase()}`}>{PRIORITY_LABELS[p]}</span>
export const SeverityBadge = ({ s }: { s: Severity })   => <span className={`badge badge-${s.toLowerCase()}`}>{SEVERITY_LABELS[s]}</span>

// ─── Tag ─────────────────────────────────────────────────────────────────────
export const Tag = ({ label }: { label: string }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-4 border border-border text-[11px] text-ink-2">{label}</span>
)

// ─── Spinner / Loader ─────────────────────────────────────────────────────────
export const Spinner  = ({ size = 18 }: { size?: number }) => <Loader2 size={size} className="animate-spin text-primary" />
export const PageLoader = () => (
  <div className="flex items-center justify-center h-64"><Spinner size={28} /></div>
)

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4 opacity-30">{icon ?? <Inbox size={40} />}</div>
      <h3 className="text-base font-semibold text-ink-2 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-3 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────
export const ErrorState = ({ message = 'Something went wrong' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <AlertTriangle size={28} className="text-danger mb-3" />
    <p className="text-sm text-ink-2">{message}</p>
  </div>
)

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, subtitle, onClose, children, footer, size = 'md' }: {
  title: string; subtitle?: string; onClose: () => void
  children: React.ReactNode; footer?: React.ReactNode; size?: 'sm'|'md'|'lg'|'xl'
}) {
  const w = { sm:'max-w-md', md:'max-w-xl', lg:'max-w-2xl', xl:'max-w-4xl' }[size]
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-surface-2 border border-border rounded-2xl w-full ${w} max-h-[90vh] flex flex-col animate-fade-in`}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-ink-3 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon p-1.5 mt-0.5"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border flex-shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, total, limit, onPage }: {
  page: number; totalPages: number; total: number; limit: number; onPage: (p: number) => void
}) {
  const start = (page - 1) * limit + 1, end = Math.min(page * limit, total)
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-xs text-ink-3">{start}–{end} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="btn btn-sm btn-ghost">‹</button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
          return <button key={p} onClick={() => onPage(p)} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}>{p}</button>
        })}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="btn btn-sm btn-ghost">›</button>
      </div>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
export function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] tracking-widest uppercase text-ink-3 mb-1.5">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}
