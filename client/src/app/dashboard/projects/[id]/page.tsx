'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FolderKanban, Bug, Users, Activity, AlertTriangle } from 'lucide-react'
import { useDashboard, useProject, useBugs } from '@/hooks'
import { Avatar, PageLoader, ErrorState, StatusBadge, PriorityBadge } from '@/components/ui'
import { useUIStore } from '@/store/ui'
import { timeAgo } from '@/lib/utils'
import type { Bug as BugType, Project } from '@/types'

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const setFilters = useUIStore(s => s.setFilters)

  const { data: project, isLoading, isError } = useProject(params.id)
  const projectId = (project as any)?.id || (project as any)?._id

  const { data: stats } = useDashboard(projectId)
  const { data: bugsData } = useBugs(projectId ? { projectId, limit: 8, sortBy: 'updatedAt', sortOrder: 'desc' } : undefined)

  if (isLoading) return <PageLoader />
  if (isError || !project) return <ErrorState message="Project not found" />

  const p = project as Project
  const recentBugs = (bugsData?.data || []) as BugType[]

  const openBugs = () => {
    setFilters({ projectId: p.id, page: 1 })
    router.push('/dashboard/bugs')
  }

  return (
    <div className="p-6 space-y-5">
      <button onClick={() => router.back()} className="btn btn-ghost btn-sm gap-1.5 w-fit">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-ink-3 mb-2">
              <span className="inline-flex items-center gap-1.5">
                <FolderKanban size={14} className="text-primary" /> Project
              </span>
              <span className="text-border">·</span>
              <span className="font-mono bg-surface-3 border border-border px-2 py-0.5 rounded-lg">{p.slug}</span>
            </div>
            <h1 className="text-2xl font-semibold truncate">{p.name}</h1>
            {p.description && <p className="text-sm text-ink-2 mt-2 leading-6 max-w-3xl">{p.description}</p>}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="btn btn-primary gap-1.5" onClick={openBugs}>
              <Bug size={14} /> View Bugs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <div className="card-inner p-4">
            <p className="text-[10px] tracking-widest uppercase text-ink-3 mb-2">Total Bugs</p>
            <div className="text-2xl font-semibold tabular-nums">{stats?.summary?.totalBugs ?? p.bugCount ?? 0}</div>
          </div>
          <div className="card-inner p-4">
            <p className="text-[10px] tracking-widest uppercase text-ink-3 mb-2">Open</p>
            <div className="text-2xl font-semibold tabular-nums">{stats?.summary?.openBugs ?? 0}</div>
          </div>
          <div className="card-inner p-4">
            <p className="text-[10px] tracking-widest uppercase text-ink-3 mb-2">In Progress</p>
            <div className="text-2xl font-semibold tabular-nums">{stats?.summary?.inProgressBugs ?? 0}</div>
          </div>
          <div className="card-inner p-4">
            <p className="text-[10px] tracking-widest uppercase text-ink-3 mb-2">Overdue</p>
            <div className="text-2xl font-semibold tabular-nums">{stats?.summary?.overdueCount ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Activity size={16} className="text-ink-3" /> Recent Bugs
            </h3>
            <button className="btn btn-ghost btn-sm text-ink-3 text-xs" onClick={openBugs}>View all →</button>
          </div>

          {recentBugs.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-3">No bugs in this project yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {recentBugs.map(b => (
                <div
                  key={b.id || b.bugId}
                  onClick={() => router.push(`/dashboard/bugs/${b.bugId}`)}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-surface-3/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-3">{b.bugId}</span>
                      <StatusBadge s={b.status} />
                      <PriorityBadge p={b.priority} />
                    </div>
                    <p className="text-sm font-medium truncate mt-1">{b.title}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Avatar user={b.assignee} size={22} />
                    <span className="text-[10px] text-ink-3">{timeAgo(b.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Users size={16} className="text-ink-3" /> Team
            </h3>

            {p.members?.length ? (
              <div className="space-y-2.5">
                {p.members.map(m => (
                  <div key={m.user.id} className="flex items-center gap-3">
                    <Avatar user={m.user} size={28} showName />
                    <span className="ml-auto text-[11px] text-ink-3 font-mono">{m.role.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-ink-3">No members.</div>
            )}
          </div>

          {(stats?.summary?.overdueCount ?? 0) > 0 && (
            <div className="flex items-center gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
              <AlertTriangle size={15} className="text-danger flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold text-danger">{stats!.summary.overdueCount} overdue. </span>
                <button onClick={openBugs} className="text-primary hover:underline">Review now →</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

