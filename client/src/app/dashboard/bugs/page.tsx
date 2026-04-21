'use client'
import { useRouter } from 'next/navigation'
import { Plus, Search, ArrowUpDown } from 'lucide-react'
import { useBugs, useProjects } from '@/hooks'
import { useUIStore } from '@/store/ui'
import { useCanReportBug, useDebounce } from '@/hooks/common'
import { useState, useEffect } from 'react'
import { Avatar, StatusBadge, PriorityBadge, SeverityBadge, Tag, Pagination, PageLoader, EmptyState, ErrorState } from '@/components/ui'
import { timeAgo, STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils'
import type { Bug, BugStatus, Priority, Project } from '@/types'

export default function BugsPage() {
  const router = useRouter()
  const { openNewBug } = useUIStore()
  const canReportBug = useCanReportBug()
  const { filters: f, setFilters } = useUIStore()
  const { data: projectsData } = useProjects()
  const [localSearch, setLocalSearch] = useState(f.search || '')
  const debouncedSearch = useDebounce(localSearch, 350)

  useEffect(() => { setFilters({ search: debouncedSearch, page: 1 }) }, [debouncedSearch])

  const { data, isLoading, isError } = useBugs({
    ...f,
    status:    f.status    || undefined,
    priority:  f.priority  || undefined,
    projectId: f.projectId || undefined,
    assigneeId: f.assigneeId || undefined,
    reporterId: f.reporterId || undefined,
    search:    f.search    || undefined,
  })

  const bugs     = (data?.data || []) as Bug[]
  const meta     = data?.meta
  const projects = (projectsData?.data || []) as Project[]

  const toggleSort = (field: string) => {
    setFilters({ sortBy: field, sortOrder: f.sortBy === field && f.sortOrder === 'desc' ? 'asc' : 'desc' })
  }

  const SortBtn = ({ field, label }: { field: string; label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-ink-1 transition-colors">
      {label}<ArrowUpDown size={10} className={f.sortBy===field ? 'text-primary' : 'opacity-30'}/>
    </button>
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold">All Bugs</h1>
          <p className="text-sm text-ink-3 mt-0.5">{meta?.total ?? 0} bugs total</p>
        </div>
        {canReportBug && (
          <button className="btn btn-primary gap-1.5" onClick={openNewBug}><Plus size={14}/> Report Bug</button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-surface-3 border border-border rounded-xl px-3 py-1.5 flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="text-ink-3 flex-shrink-0"/>
          <input value={localSearch} onChange={e => setLocalSearch(e.target.value)}
            placeholder="Search bugs, IDs…"
            className="bg-transparent border-none p-0 text-sm outline-none w-full placeholder:text-ink-3"/>
          {localSearch && <button onClick={() => { setLocalSearch(''); setFilters({ search:'', page:1 }) }} className="text-ink-3 hover:text-ink-1">×</button>}
        </div>

        <select value={f.status||''} onChange={e => setFilters({status: e.target.value as BugStatus|'', page:1})} className="w-auto text-sm">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <select value={f.priority||''} onChange={e => setFilters({priority: e.target.value as Priority|'', page:1})} className="w-auto text-sm">
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>

        <select value={f.projectId||''} onChange={e => setFilters({projectId: e.target.value, page:1})} className="w-auto text-sm">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {(f.status||f.priority||f.projectId||f.assigneeId||f.reporterId||f.search) && (
          <button onClick={() => { setLocalSearch(''); setFilters({status:'',priority:'',projectId:'',assigneeId:'',reporterId:'',search:'',page:1}) }}
            className="btn btn-sm btn-ghost text-ink-3 text-xs">Clear ×</button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <PageLoader/> : isError ? <ErrorState/> : bugs.length === 0 ? (
          <EmptyState icon={<span>🐛</span>} title="No bugs found" description="Try adjusting your filters"
            action={canReportBug ? <button className="btn btn-primary" onClick={openNewBug}><Plus size={14}/> Report Bug</button> : undefined}/>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="th w-24"><SortBtn field="bugId" label="ID"/></th>
                  <th className="th">Title</th>
                  <th className="th w-32">Project</th>
                  <th className="th w-28"><SortBtn field="status" label="Status"/></th>
                  <th className="th w-24"><SortBtn field="priority" label="Priority"/></th>
                  <th className="th w-24">Severity</th>
                  <th className="th w-32">Assignee</th>
                  <th className="th w-28"><SortBtn field="updatedAt" label="Updated"/></th>
                </tr></thead>
                <tbody>
                  {bugs.map(bug => (
                    <tr key={bug.id||bug.bugId} className="tr" onClick={() => router.push(`/dashboard/bugs/${bug.bugId}`)}>
                      <td className="td"><span className="font-mono text-[11px] text-ink-3">{bug.bugId}</span></td>
                      <td className="td max-w-xs">
                        <p className="font-medium text-sm truncate">{bug.title}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">{bug.tags.slice(0,3).map(t => <Tag key={t} label={t}/>)}</div>
                      </td>
                      <td className="td"><span className="text-xs text-ink-2">{bug.project?.name}</span></td>
                      <td className="td"><StatusBadge s={bug.status}/></td>
                      <td className="td"><PriorityBadge p={bug.priority}/></td>
                      <td className="td"><SeverityBadge s={bug.severity}/></td>
                      <td className="td"><Avatar user={bug.assignee} size={24} showName/></td>
                      <td className="td"><span className="text-[11px] text-ink-3">{timeAgo(bug.updatedAt)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total}
                limit={meta.limit} onPage={p => setFilters({page:p})}/>
            )}
          </>
        )}
      </div>
    </div>
  )
}
