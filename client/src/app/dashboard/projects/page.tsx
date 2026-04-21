'use client'
// ── Projects Page ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import Link from 'next/link'
import { FolderKanban, Plus, Bug, Users } from 'lucide-react'
import { useProjects, useCreateProject } from '@/hooks'
import { useIsManager } from '@/hooks/common'
import { Avatar, Modal, Field, Spinner, PageLoader, ErrorState, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import type { Project } from '@/types'

export default function ProjectsPage() {
  const isManager = useIsManager()
  const { data, isLoading, isError } = useProjects()
  const { mutate: createProject, isPending } = useCreateProject()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const projects = (data?.data || []) as Project[]

  const submit = () => {
    if (!form.name.trim()) return
    createProject(form, { onSuccess: () => { setShow(false); setForm({ name: '', description: '' }) } })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-ink-3 mt-0.5">{projects.length} active</p>
        </div>
        {isManager && (
          <button className="btn btn-primary gap-1.5" onClick={() => setShow(true)}><Plus size={14}/> New Project</button>
        )}
      </div>

      {isLoading ? <PageLoader/> : isError ? <ErrorState/> : projects.length === 0 ? (
        <EmptyState icon={<FolderKanban size={40}/>} title="No projects yet"
          action={isManager ? <button className="btn btn-primary" onClick={() => setShow(true)}>Create Project</button> : undefined}/>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <Link key={p.id} href={`/dashboard/projects/${p.slug}`} className="card p-5 hover:border-border-strong transition-colors cursor-pointer block">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary/10 rounded-xl"><FolderKanban size={16} className="text-primary"/></div>
                <span className="text-[11px] font-mono text-ink-3 bg-surface-3 px-2 py-0.5 rounded-lg">{p.slug}</span>
              </div>
              <h3 className="font-semibold text-base mb-1">{p.name}</h3>
              {p.description && <p className="text-sm text-ink-3 line-clamp-2 mb-4">{p.description}</p>}
              <div className="flex items-center gap-4 text-xs text-ink-3 mb-4">
                <span className="flex items-center gap-1"><Bug size={11}/> {p.bugCount ?? 0} bugs</span>
                <span className="flex items-center gap-1"><Users size={11}/> {p.members?.length ?? 0} members</span>
              </div>
              {p.members && p.members.length > 0 && (
                <div className="flex -space-x-1.5">
                  {p.members.slice(0, 5).map(m => (
                    <Avatar key={m.user.id} user={m.user} size={26} className="ring-2 ring-surface-2"/>
                  ))}
                </div>
              )}
              <div className="border-t border-border mt-3 pt-3">
                <span className="text-[11px] text-ink-3">Created {fmtDate(p.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {show && (
        <Modal title="Create Project" onClose={() => setShow(false)} size="sm"
          footer={<><button className="btn" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={isPending}>{isPending && <Spinner size={14}/>} Create</button></>}>
          <Field label="Project Name" required><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Frontend Portal"/></Field>
          <Field label="Description"><textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="What does this project track?"/></Field>
        </Modal>
      )}
    </div>
  )
}
