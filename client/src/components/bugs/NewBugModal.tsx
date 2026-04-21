'use client'
import { useState } from 'react'
import { useCreateBug, useProjects, useUsers } from '@/hooks'
import { Modal, Field, Spinner } from '@/components/ui'
import { PRIORITIES, SEVERITIES, PRIORITY_LABELS, SEVERITY_LABELS } from '@/lib/utils'
import type { CreateBugPayload, Priority, Project, Severity, User } from '@/types'

const INIT: CreateBugPayload = {
  title:'', description:'', stepsToReproduce:'', expectedBehavior:'', actualBehavior:'',
  environment:'production', browser:'', os:'', priority:'MEDIUM', severity:'MAJOR',
  projectId:'', assigneeId:null, tags:[],
}

export default function NewBugModal({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateBug()
  const { data: projectsData } = useProjects()
  const { data: usersData }    = useUsers()
  const [form, setForm]        = useState<CreateBugPayload>(INIT)
  const [tab, setTab]          = useState<'basic'|'details'>('basic')
  const [tagInput, setTagInput]= useState('')
  const [errors, setErrors]    = useState<Record<string,string>>({})

  const set = (k: keyof CreateBugPayload, v: unknown) => {
    setForm(f => ({...f,[k]:v}))
    setErrors(e => {const{[k]:_,...r}=e;return r})
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags?.includes(t)) set('tags', [...(form.tags||[]), t])
    setTagInput('')
  }

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.title.trim() || form.title.length < 5) e.title = 'At least 5 characters'
    if (!form.description.trim() || form.description.length < 10) e.description = 'At least 10 characters'
    if (!form.projectId) e.projectId = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = () => { if (validate()) create(form) }

  const projects = (projectsData?.data || []) as Project[]
  const users    = (usersData?.data    || []) as User[]

  return (
    <Modal title="Report New Bug" subtitle="Document the issue with as much detail as possible" onClose={onClose} size="lg"
      footer={<><button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={isPending}>
          {isPending && <Spinner size={14}/>} Submit Bug
        </button></>}>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-5 -mx-6 px-6">
        {(['basic','details'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 px-1 text-sm border-b-2 transition-colors capitalize ${
              tab===t ? 'border-primary text-primary font-medium' : 'border-transparent text-ink-3 hover:text-ink-2'}`}>
            {t === 'basic' ? 'Basic Info' : 'Details & Context'}
          </button>
        ))}
      </div>

      {tab === 'basic' ? (
        <>
          <Field label="Bug Title" required error={errors.title}>
            <input value={form.title} onChange={e => set('title',e.target.value)} placeholder="Short, descriptive title"/>
          </Field>
          <Field label="Description" required error={errors.description}>
            <textarea value={form.description} onChange={e => set('description',e.target.value)} placeholder="Describe the bug in detail..." rows={4}/>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project" required error={errors.projectId}>
              <select value={form.projectId} onChange={e => set('projectId',e.target.value)}>
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Assignee">
              <select value={form.assigneeId||''} onChange={e => set('assigneeId',e.target.value||null)}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_',' ')})</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Priority">
              <select value={form.priority} onChange={e => set('priority',e.target.value as Priority)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </Field>
            <Field label="Severity">
              <select value={form.severity} onChange={e => set('severity',e.target.value as Severity)}>
                {SEVERITIES.map(s => <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>)}
              </select>
            </Field>
            <Field label="Environment">
              <select value={form.environment} onChange={e => set('environment',e.target.value)}>
                {['production','staging','development','local'].map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase()+e.slice(1)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Tags">
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addTag())}
                placeholder="Press Enter to add tag" className="flex-1"/>
              <button type="button" className="btn btn-sm" onClick={addTag}>Add</button>
            </div>
            {(form.tags||[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(form.tags||[]).map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-4 border border-border rounded-full text-[11px] text-ink-2">
                    {t}<button onClick={() => set('tags',(form.tags||[]).filter(x=>x!==t))} className="text-ink-3 hover:text-danger">×</button>
                  </span>
                ))}
              </div>
            )}
          </Field>
        </>
      ) : (
        <>
          <Field label="Steps to Reproduce">
            <textarea value={form.stepsToReproduce||''} onChange={e => set('stepsToReproduce',e.target.value)}
              placeholder={"1. Go to...\n2. Click on...\n3. See error"} rows={4}/>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expected Behavior">
              <textarea value={form.expectedBehavior||''} onChange={e => set('expectedBehavior',e.target.value)} placeholder="What should happen?" rows={3}/>
            </Field>
            <Field label="Actual Behavior">
              <textarea value={form.actualBehavior||''} onChange={e => set('actualBehavior',e.target.value)} placeholder="What actually happened?" rows={3}/>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Browser"><input value={form.browser||''} onChange={e => set('browser',e.target.value)} placeholder="Chrome 120"/></Field>
            <Field label="OS"><input value={form.os||''} onChange={e => set('os',e.target.value)} placeholder="macOS 14"/></Field>
            <Field label="Version"><input value={form.version||''} onChange={e => set('version',e.target.value)} placeholder="v2.1.4"/></Field>
          </div>
          <Field label="Due Date">
            <input type="date" value={form.dueDate||''} onChange={e => set('dueDate',e.target.value||null)}/>
          </Field>
        </>
      )}
    </Modal>
  )
}
