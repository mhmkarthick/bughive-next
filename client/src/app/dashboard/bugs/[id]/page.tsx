'use client'
import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Send, Upload, Paperclip } from 'lucide-react'
import { useBug, useUpdateBug, useDeleteBug, useAddComment, useDeleteComment, useUsers, useProjects } from '@/hooks'
import { useAuthStore } from '@/store/auth'
import { Avatar, StatusBadge, PriorityBadge, SeverityBadge, Tag, PageLoader, ErrorState, Field } from '@/components/ui'
import { timeAgo, fmtDate, fmtFileSize, STATUSES, PRIORITIES, SEVERITIES, STATUS_LABELS, PRIORITY_LABELS, SEVERITY_LABELS } from '@/lib/utils'
import { bugsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import type { ActivityLog, Attachment, BugStatus, Comment, Priority, Severity, User } from '@/types'

type Tab = 'overview' | 'comments' | 'attachments' | 'activity'

export default function BugDetailPage() {
  const { id }      = useParams<{ id: string }>()
  const router      = useRouter()
  const currentUser = useAuthStore(s => s.user)

  const { data: bug, isLoading, isError } = useBug(id)
  const { mutate: updateBug }  = useUpdateBug()
  const { mutate: deleteBug, isPending: deleting } = useDeleteBug()
  const { mutate: addComment, isPending: commenting } = useAddComment()
  const { mutate: deleteComment }  = useDeleteComment()
  const { data: usersData }    = useUsers()
  const [tab, setTab]          = useState<Tab>('overview')
  const [comment, setComment]  = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef                = useRef<HTMLInputElement>(null)

  const users      = (usersData?.data || []) as User[]
  const isPriv     = ['ADMIN','PROJECT_MANAGER'].includes(currentUser?.role || '')
  const isReporter = bug?.reporter?.id === currentUser?.id

  if (isLoading) return <PageLoader/>
  if (isError || !bug) return <ErrorState message="Bug not found"/>

  const upd = (field: string, value: string | null) =>
    updateBug({ id: bug.id || bug.bugId, data: { [field]: value } })

  const handleDelete = () => {
    if (!confirm(`Delete ${bug.bugId}? This cannot be undone.`)) return
    deleteBug(bug.id || bug.bugId, { onSuccess: () => router.push('/dashboard/bugs') })
  }

  const submitComment = () => {
    if (!comment.trim()) return
    addComment({ bugId: bug.id || bug.bugId, content: comment }, { onSuccess: () => setComment('') })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await bugsApi.uploadFile(bug.id || bug.bugId, file)
      toast.success('File uploaded')
    } catch { toast.error('Upload failed') } finally { setUploading(false); e.target.value = '' }
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key:'overview',    label:'Overview' },
    { key:'comments',    label:'Comments',    count: bug.comments?.length },
    { key:'attachments', label:'Attachments', count: bug.attachments?.length },
    { key:'activity',    label:'Activity',    count: bug.activityLog?.length },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => router.back()} className="btn btn-ghost btn-sm gap-1.5 text-ink-3 mb-4 -ml-1">
        <ArrowLeft size={14}/> Back
      </button>

      {/* Header card */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-ink-3">{bug.bugId}</span>
              <span className="text-border">·</span>
              <span className="text-xs text-ink-3">{bug.project?.name}</span>
            </div>
            <h1 className="text-2xl font-semibold leading-snug mb-3">{bug.title}</h1>
            <div className="flex flex-wrap gap-2">
              <StatusBadge s={bug.status}/>
              <PriorityBadge p={bug.priority}/>
              <SeverityBadge s={bug.severity}/>
              {bug.tags.map((t: string) => <Tag key={t} label={t}/>)}
            </div>
          </div>
          {(isPriv || isReporter) && (
            <button onClick={handleDelete} disabled={deleting} className="btn btn-danger btn-sm flex-shrink-0">
              <Trash2 size={13}/> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {TABS.map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`pb-2.5 px-1 text-sm border-b-2 transition-colors flex items-center gap-1.5 ${
                  tab===key ? 'border-primary text-primary font-medium' : 'border-transparent text-ink-3 hover:text-ink-2'}`}>
                {label}
                {count !== undefined && count > 0 && (
                  <span className="text-[10px] bg-surface-4 px-1.5 py-0.5 rounded-full">{count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="card p-5">
                <h4 className="text-[11px] tracking-widest uppercase text-ink-3 mb-3 pb-2 border-b border-border">Description</h4>
                <p className="text-sm leading-7 text-ink-2 whitespace-pre-wrap">{bug.description}</p>
              </div>
              {bug.stepsToReproduce && (
                <div className="card p-5">
                  <h4 className="text-[11px] tracking-widest uppercase text-ink-3 mb-3 pb-2 border-b border-border">Steps to Reproduce</h4>
                  <p className="text-sm leading-7 text-ink-2 whitespace-pre-wrap">{bug.stepsToReproduce}</p>
                </div>
              )}
              {(bug.expectedBehavior || bug.actualBehavior) && (
                <div className="grid grid-cols-2 gap-4">
                  {bug.expectedBehavior && (
                    <div className="card p-5">
                      <h4 className="text-[11px] uppercase tracking-widest text-green-400 mb-3">Expected</h4>
                      <p className="text-sm leading-6 text-ink-2">{bug.expectedBehavior}</p>
                    </div>
                  )}
                  {bug.actualBehavior && (
                    <div className="card p-5">
                      <h4 className="text-[11px] uppercase tracking-widest text-danger mb-3">Actual</h4>
                      <p className="text-sm leading-6 text-ink-2">{bug.actualBehavior}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          {tab === 'comments' && (
            <div className="space-y-3">
              {!bug.comments?.length && (
                <div className="card p-8 text-center"><p className="text-sm text-ink-3">No comments yet.</p></div>
              )}
              {bug.comments?.map((c: Comment) => (
                <div key={c._id} className="flex gap-3">
                  <Avatar user={c.user} size={32} className="flex-shrink-0 mt-1"/>
                  <div className="flex-1 card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.user.name}</span>
                        {c.isEdited && <span className="text-[10px] text-ink-3">(edited)</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-ink-3">{timeAgo(c.createdAt)}</span>
                        {c.user.id === currentUser?.id && (
                          <button onClick={() => deleteComment({ bugId: bug.id||bug.bugId, commentId: c._id })}
                            className="btn btn-ghost btn-sm p-1 text-ink-3 hover:text-danger ml-1">×</button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-ink-2 leading-6 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
              {/* Add comment */}
              <div className="flex gap-3">
                <Avatar user={currentUser ?? undefined} size={32} className="flex-shrink-0 mt-1"/>
                <div className="flex-1 card p-4">
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                    placeholder="Write a comment…"
                    onKeyDown={e => { if (e.key==='Enter'&&(e.metaKey||e.ctrlKey)) submitComment() }}
                    className="border-none bg-transparent p-0 resize-none outline-none text-sm w-full placeholder:text-ink-3"/>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-[11px] text-ink-3">⌘+Enter to submit</span>
                    <button onClick={submitComment} disabled={!comment.trim()||commenting} className="btn btn-primary btn-sm gap-1.5">
                      <Send size={12}/> Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {tab === 'attachments' && (
            <div className="space-y-3">
              <div>
                <input type="file" ref={fileRef} onChange={handleUpload} className="hidden"
                  accept="image/*,.pdf,.txt,.csv,.zip"/>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn gap-2">
                  <Upload size={14}/> {uploading ? 'Uploading…' : 'Upload File'}
                </button>
                <p className="text-xs text-ink-3 mt-1">Images, PDFs, text files up to 10MB</p>
              </div>
              {!bug.attachments?.length ? (
                <div className="card p-8 text-center">
                  <Paperclip size={24} className="text-ink-3 mx-auto mb-2 opacity-40"/>
                  <p className="text-sm text-ink-3">No attachments yet.</p>
                </div>
              ) : bug.attachments.map((a: Attachment) => (
                <div key={a._id} className="card p-4 flex items-center gap-3">
                  <div className="p-2 bg-surface-3 rounded-lg"><Paperclip size={14} className="text-ink-3"/></div>
                  <div className="flex-1 min-w-0">
                    <a href={a.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline truncate block">{a.originalName}</a>
                    <p className="text-xs text-ink-3">{fmtFileSize(a.size)} · {a.uploadedBy?.name} · {timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activity */}
          {tab === 'activity' && (
            <div className="card divide-y divide-border">
              {!bug.activityLog?.length ? (
                <p className="p-6 text-sm text-ink-3 text-center">No activity yet.</p>
              ) : bug.activityLog.map((a: ActivityLog) => (
                <div key={a._id} className="flex items-start gap-3 p-4">
                  <Avatar user={a.user} size={24} className="flex-shrink-0 mt-0.5"/>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{a.user.name}</span>{' '}
                      <span className="text-ink-2">{a.action.toLowerCase().replace('_',' ')}
                        {a.oldValue && a.newValue && <> from <span className="text-ink-1">{a.oldValue}</span> to <span className="text-primary">{a.newValue}</span></>}
                      </span>
                    </p>
                    <p className="text-[11px] text-ink-3 mt-0.5">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h4 className="text-[11px] tracking-widest uppercase text-ink-3 mb-4 pb-2 border-b border-border">Details</h4>
            <div className="space-y-4">
              {[
                { label:'Status', node: <select value={bug.status} onChange={e => upd('status',e.target.value)} className="text-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select> },
                { label:'Priority', node: <select value={bug.priority} onChange={e => upd('priority',e.target.value)} className="text-sm">
                    {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select> },
                { label:'Severity', node: <select value={bug.severity} onChange={e => upd('severity',e.target.value)} className="text-sm">
                    {SEVERITIES.map(s => <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>)}
                  </select> },
                { label:'Assignee', node: <select value={bug.assignee?.id||''} onChange={e => upd('assigneeId',e.target.value||null)} className="text-sm">
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select> },
              ].map(({ label, node }) => (
                <div key={label}>
                  <p className="text-[11px] uppercase tracking-wide text-ink-3 mb-1.5">{label}</p>
                  {node}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h4 className="text-[11px] tracking-widest uppercase text-ink-3 mb-4 pb-2 border-b border-border">People</h4>
            <div className="space-y-3">
              <div><p className="text-[11px] text-ink-3 mb-1.5">Reporter</p><Avatar user={bug.reporter} size={24} showName/></div>
              <div><p className="text-[11px] text-ink-3 mb-1.5">Assignee</p><Avatar user={bug.assignee} size={24} showName/></div>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="text-[11px] tracking-widest uppercase text-ink-3 mb-4 pb-2 border-b border-border">Meta</h4>
            <div className="space-y-2 text-xs">
              {[
                { label:'Created',     val: fmtDate(bug.createdAt) },
                { label:'Updated',     val: timeAgo(bug.updatedAt) },
                bug.dueDate     && { label:'Due Date',    val: fmtDate(bug.dueDate) },
                bug.environment && { label:'Environment', val: bug.environment },
                bug.browser     && { label:'Browser',     val: bug.browser },
                bug.os          && { label:'OS',          val: bug.os },
                bug.version     && { label:'Version',     val: bug.version },
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-ink-3">{item.label}</span>
                  <span className="text-ink-2 font-medium">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
