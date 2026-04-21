'use client'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useNotifications, useMarkAllRead } from '@/hooks'
import { notificationsApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar, PageLoader, EmptyState } from '@/components/ui'
import { timeAgo } from '@/lib/utils'
import type { NotifType, Notification } from '@/types'
import toast from 'react-hot-toast'

const ICONS: Record<NotifType, string> = {
  BUG_ASSIGNED:'🎯', STATUS_CHANGED:'🔄', COMMENT_ADDED:'💬',
  PRIORITY_CHANGED:'⚡', BUG_RESOLVED:'✅', MENTION:'📣',
}

export default function NotificationsPage() {
  const router = useRouter()
  const qc     = useQueryClient()
  const { data, isLoading } = useNotifications()
  const { mutate: markAll } = useMarkAllRead()

  const notifications = (data?.data || []) as Notification[]
  const unread        = (data?.meta as any)?.unreadCount ?? 0

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id)
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }
  const del = async (id: string) => {
    await notificationsApi.delete(id)
    qc.invalidateQueries({ queryKey: ['notifications'] })
    toast.success('Deleted')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-ink-3 mt-0.5">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        {unread > 0 && <button className="btn btn-sm gap-1.5" onClick={() => markAll()}><CheckCheck size={13}/> Mark all read</button>}
      </div>

      {isLoading ? <PageLoader/> : notifications.length === 0 ? (
        <EmptyState icon={<Bell size={40}/>} title="No notifications" description="You're all caught up!"/>
      ) : (
        <div className="card overflow-hidden divide-y divide-border">
          {notifications.map(n => (
            <div key={n.id} onClick={() => { if (!n.isRead) markRead(n.id); if (n.bug) router.push(`/dashboard/bugs/${n.bug.bugId}`) }}
              className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors group hover:bg-surface-3/50 ${!n.isRead ? 'bg-primary/4' : ''}`}>
              <div className="flex-shrink-0 mt-1.5">
                {!n.isRead ? <div className="w-2 h-2 rounded-full bg-primary"/> : <div className="w-2 h-2 rounded-full border border-border-strong"/>}
              </div>
              <span className="text-base flex-shrink-0 w-5">{ICONS[n.type]||'🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-ink-2 mt-0.5">{n.message}</p>
                {n.bug && <span className="text-[11px] font-mono text-ink-3 bg-surface-3 px-1.5 py-0.5 rounded mt-1.5 inline-block">{n.bug.bugId}</span>}
                <div className="flex items-center gap-2 mt-1.5">
                  {n.triggeredBy && <Avatar user={n.triggeredBy} size={16} showName/>}
                  <span className="text-[11px] text-ink-3">{timeAgo(n.createdAt)}</span>
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); del(n.id) }}
                className="btn btn-ghost btn-sm p-1.5 text-ink-3 hover:text-danger opacity-0 group-hover:opacity-100 flex-shrink-0">
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
