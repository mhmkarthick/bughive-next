'use client'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Bug, TrendingUp, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react'
import { useDashboard, useMyStats } from '@/hooks'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { Avatar, StatusBadge, PriorityBadge, PageLoader, ErrorState } from '@/components/ui'
import { timeAgo, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils'
import type { BugStatus, Priority } from '@/types'

const TIP = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="bg-surface-3 border border-border rounded-xl p-2.5 text-xs">
      <p className="text-ink-2 mb-1">{label}</p>
      <p className="text-primary font-semibold">{payload[0].value} bugs</p>
    </div>
  ) : null

function Stat({
  label,
  value,
  icon: Icon,
  color,
  sub,
  onClick,
}: {
  label: string
  value: number | string
  icon: any
  color: string
  sub?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card p-5 relative overflow-hidden text-left ${onClick ? 'cursor-pointer hover:border-border-strong transition-colors' : ''}`}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{background:color}}/>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] tracking-widest uppercase text-ink-3">{label}</p>
        <div className="p-1.5 rounded-lg" style={{background:color+'18'}}>
          <Icon size={14} style={{color}}/>
        </div>
      </div>
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      {sub && <p className="text-xs text-ink-3 mt-1">{sub}</p>}
    </button>
  )
}

export default function DashboardPage() {
  const router  = useRouter()
  const user    = useAuthStore(s => s.user)
  const setFilters = useUIStore(s => s.setFilters)
  const { data: stats, isLoading, isError } = useDashboard()
  const { data: mine } = useMyStats()

  if (isLoading) return <PageLoader/>
  if (isError || !stats) return <ErrorState message="Failed to load dashboard"/>

  const { summary, weeklyTrend, byPriority, byStatus, topAssignees, recentBugs } = stats
  const priorityData  = Object.entries(byPriority as Record<string, number>).map(([name, value]) => ({ name, value }))
  const statusBarData = Object.entries(byStatus as Record<string, number>).map(([name, value]) => ({
    key: name as BugStatus,
    name: name.replace('_',' '),
    value,
    color: STATUS_COLORS[name as BugStatus] || '#6b7280',
  }))

  const goBugs = (filters: any) => {
    setFilters({ status: '', priority: '', severity: '', projectId: '', assigneeId: '', reporterId: '', search: '', page: 1, ...filters })
    router.push('/dashboard/bugs')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-ink-3 mt-1">Here's your team's bug tracker overview.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Open Bugs" value={summary.openBugs} icon={Bug} color="#ef4444" sub={`↑ ${summary.newThisWeek} this week`} onClick={() => goBugs({ status: 'OPEN' })}/>
        <Stat label="In Progress" value={summary.inProgressBugs} icon={TrendingUp} color="#f59e0b" sub="Across all projects" onClick={() => goBugs({ status: 'IN_PROGRESS' })}/>
        <Stat label="Resolved" value={summary.resolvedBugs} icon={CheckCircle} color="#22c55e" sub={`${summary.resolvedThisWeek} this week`} onClick={() => goBugs({ status: 'RESOLVED' })}/>
        <Stat label="Critical" value={summary.criticalBugs} icon={AlertTriangle} color="#ef4444" sub={`${summary.blockerBugs} blockers`} onClick={() => goBugs({ priority: 'CRITICAL' })}/>
      </div>

      {/* My Stats */}
      {mine && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Assigned to Me" value={mine.assigned} icon={Bug} color="#6366f1"
            onClick={() => user?.id && goBugs({ assigneeId: user.id })}/>
          <Stat label="My Open" value={mine.open} icon={Clock} color="#f59e0b"
            onClick={() => user?.id && goBugs({ assigneeId: user.id, status: 'OPEN' })}/>
          <Stat label="In Review" value={mine.inReview} icon={Zap} color="#3b82f6"
            onClick={() => user?.id && goBugs({ assigneeId: user.id, status: 'IN_REVIEW' })}/>
          <Stat label="I Reported" value={mine.reported} icon={TrendingUp} color="#22c55e"
            onClick={() => user?.id && goBugs({ reporterId: user.id })}/>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-base font-semibold mb-4">Bugs Reported — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyTrend} barSize={22}>
              <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en',{weekday:'short'})}
                tick={{fill:'#6a6a80',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#6a6a80',fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip content={<TIP/>} cursor={{fill:'rgba(255,255,255,.03)'}}/>
              <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority pie */}
        <div className="card p-5">
          <h3 className="text-base font-semibold mb-4">By Priority</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                {priorityData.map(e => <Cell key={e.name} fill={PRIORITY_COLORS[e.name as Priority] || '#6b7280'}/>)}
              </Pie>
              <Tooltip contentStyle={{background:'#1a1a22',border:'1px solid #2a2a38',borderRadius:8,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {priorityData.map(e => (
              <button
                key={e.name}
                type="button"
                onClick={() => goBugs({ priority: e.name as Priority })}
                className="flex items-center justify-between text-xs w-full hover:bg-surface-3/50 rounded-lg px-2 py-1 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{background:PRIORITY_COLORS[e.name as Priority]}}/>
                  <span className="text-ink-2 capitalize">{e.name.toLowerCase()}</span>
                </div>
                <span className="font-medium">{e.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent bugs */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-base font-semibold">Recent Activity</h3>
            <button className="btn btn-ghost btn-sm text-ink-3 text-xs" onClick={() => router.push('/dashboard/bugs')}>View all →</button>
          </div>
          <div className="divide-y divide-border">
            {recentBugs.slice(0,6).map((bug: any) => (
              <div key={bug.id || bug.bugId} onClick={() => router.push(`/dashboard/bugs/${bug.bugId}`)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-surface-3/50 cursor-pointer transition-colors">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:STATUS_COLORS[bug.status as BugStatus]}}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-ink-3">{bug.bugId}</span>
                    <PriorityBadge p={bug.priority}/>
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">{bug.title}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Avatar user={bug.assignee} size={22}/>
                  <span className="text-[10px] text-ink-3">{timeAgo(bug.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top assignees + status */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-base font-semibold mb-4">Top Assignees</h3>
            <div className="space-y-3">
              {topAssignees.filter((a: any) => a.user).map((a: any) => (
                <button
                  type="button"
                  key={a.user!._id || a.user!.id}
                  onClick={() => a.user?.id && goBugs({ assigneeId: a.user.id })}
                  className="flex items-center gap-3 w-full text-left hover:bg-surface-3/50 rounded-xl px-2 py-2 transition-colors"
                >
                  <Avatar user={a.user} size={26} showName/>
                  <div className="flex-1">
                    <div className="h-1.5 bg-surface-4 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full"
                        style={{width:`${Math.min(100,(a.count/(topAssignees[0]?.count||1))*100)}%`}}/>
                    </div>
                  </div>
                  <span className="text-sm font-medium w-5 text-right">{a.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold mb-4">Status Distribution</h3>
            <div className="space-y-2.5">
              {statusBarData.map(s => {
                const total = Object.values(byStatus as Record<string, number>).reduce((a, b) => a + b, 0)
                const pct   = total ? Math.round((s.value/total)*100) : 0
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => goBugs({ status: s.key })}
                    className="flex items-center gap-3 text-xs w-full text-left hover:bg-surface-3/50 rounded-lg px-2 py-1 transition-colors"
                  >
                    <span className="w-20 text-ink-2 capitalize text-[11px]">{s.name}</span>
                    <div className="flex-1 h-1.5 bg-surface-4 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${pct}%`, background:s.color}}/>
                    </div>
                    <span className="w-6 text-right font-medium">{s.value}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Overdue alert */}
      {summary.overdueCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl">
          <AlertTriangle size={15} className="text-danger flex-shrink-0"/>
          <p className="text-sm">
            <span className="font-semibold text-danger">{summary.overdueCount} bug{summary.overdueCount>1?'s':''} overdue. </span>
            <button onClick={() => router.push('/dashboard/bugs')} className="text-primary hover:underline">Review now →</button>
          </p>
        </div>
      )}
    </div>
  )
}
