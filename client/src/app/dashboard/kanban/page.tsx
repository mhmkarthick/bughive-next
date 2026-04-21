'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { useBugs, useUpdateBug } from '@/hooks'
import { useUIStore } from '@/store/ui'
import { useCanReportBug } from '@/hooks/common'
import { PriorityBadge, Avatar, PageLoader } from '@/components/ui'
import { timeAgo, STATUS_COLORS } from '@/lib/utils'
import type { Bug, BugStatus } from '@/types'

const COLS: { key: BugStatus; label: string }[] = [
  { key:'OPEN',        label:'Open' },
  { key:'IN_PROGRESS', label:'In Progress' },
  { key:'IN_REVIEW',   label:'In Review' },
  { key:'RESOLVED',    label:'Resolved' },
  { key:'CLOSED',      label:'Closed' },
]

export default function KanbanPage() {
  const router    = useRouter()
  const { openNewBug } = useUIStore()
  const canReportBug = useCanReportBug()
  const { data, isLoading } = useBugs({ limit: 100 })
  const { mutate: updateBug } = useUpdateBug()
  const [localBugs, setLocalBugs] = useState<Bug[] | null>(null)

  const bugs = localBugs ?? ((data?.data || []) as Bug[])

  const onDragEnd = (r: DropResult) => {
    if (!r.destination) return
    if (r.destination.droppableId === r.source.droppableId && r.destination.index === r.source.index) return
    const newStatus = r.destination.droppableId as BugStatus
    setLocalBugs(bugs.map(b => b.bugId === r.draggableId ? { ...b, status: newStatus } : b))
    updateBug(
      { id: r.draggableId, data: { status: newStatus } },
      { onError: () => setLocalBugs(null), onSuccess: () => setLocalBugs(null) },
    )
  }

  if (isLoading) return <PageLoader/>

  return (
    <div className="p-6 h-[calc(100vh-56px)] flex flex-col">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold">Kanban Board</h1>
          <p className="text-sm text-ink-3 mt-0.5">Drag cards to update status</p>
        </div>
        {canReportBug && (
          <button className="btn btn-primary gap-1.5" onClick={openNewBug}><Plus size={14}/> Report Bug</button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {COLS.map(col => {
            const colBugs = bugs.filter(b => b.status === col.key)
            const color   = STATUS_COLORS[col.key]
            return (
              <div key={col.key} className="flex-shrink-0 w-64 flex flex-col bg-surface-2 border border-border rounded-2xl">
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{background:color}}/>
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-2">{col.label}</span>
                  </div>
                  <span className="text-xs bg-surface-4 text-ink-3 px-2 py-0.5 rounded-full font-semibold">{colBugs.length}</span>
                </div>

                <Droppable droppableId={col.key}>
                  {(prov, snap) => (
                    <div ref={prov.innerRef} {...prov.droppableProps}
                      className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[80px] transition-colors ${snap.isDraggingOver ? 'bg-primary/5' : ''}`}>
                      {colBugs.map((bug, i) => (
                        <Draggable key={bug.bugId} draggableId={bug.bugId} index={i}>
                          {(p, s) => (
                            <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                              onClick={() => router.push(`/dashboard/bugs/${bug.bugId}`)}
                              className={`bg-surface-3 border rounded-xl p-3 cursor-pointer transition-all ${
                                s.isDragging ? 'border-primary/40 bg-primary/5 rotate-1' : 'border-border hover:border-border-strong'}`}>
                              <div className="font-mono text-[10px] text-ink-3 mb-1.5">{bug.bugId}</div>
                              <p className="text-sm font-medium leading-snug mb-2.5 line-clamp-2">{bug.title}</p>
                              <div className="flex items-center justify-between">
                                <PriorityBadge p={bug.priority}/>
                                <Avatar user={bug.assignee} size={20}/>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-ink-3">
                                <span className="ml-auto">{timeAgo(bug.updatedAt)}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {prov.placeholder}
                    </div>
                  )}
                </Droppable>

                {canReportBug && (
                  <button onClick={openNewBug}
                    className="flex items-center gap-1.5 text-[11px] text-ink-3 hover:text-ink-2 px-3.5 py-2.5 border-t border-border transition-colors w-full">
                    <Plus size={12}/> Add
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
