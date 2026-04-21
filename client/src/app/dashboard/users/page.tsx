'use client'
import { useState } from 'react'
import { Plus, UserPlus, KeyRound } from 'lucide-react'
import { useUsers, useCreateUser, useUpdateRole, useToggleActive, useAdminResetPassword } from '@/hooks'
import { useIsAdmin } from '@/hooks/common'
import { Avatar, Modal, Field, Spinner, PageLoader, ErrorState } from '@/components/ui'
import { ROLES, ROLE_LABELS, timeAgo } from '@/lib/utils'
import type { Role, User } from '@/types'

const ROLE_BADGE: Record<Role, string> = {
  ADMIN:'badge-critical', PROJECT_MANAGER:'badge-in_review',
  DEVELOPER:'badge-resolved', QA:'badge-in_progress', REPORTER:'badge-closed',
}

export default function UsersPage() {
  const isAdmin = useIsAdmin()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [resetTarget, setResetTarget] = useState<string|null>(null)
  const [newPw, setNewPw] = useState('')
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'REPORTER' as Role })

  const { data, isLoading, isError } = useUsers({ search:search||undefined, role:roleFilter||undefined })
  const { mutate: createUser, isPending: creating } = useCreateUser()
  const { mutate: updateRole } = useUpdateRole()
  const { mutate: toggleActive } = useToggleActive()
  const { mutate: resetPw, isPending: resetting } = useAdminResetPassword()

  const users = (data?.data || []) as User[]

  const submitCreate = () => {
    if (!form.name || !form.email || !form.password) return
    createUser(form, { onSuccess: () => { setShowCreate(false); setForm({name:'',email:'',password:'',role:'REPORTER'}) } })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-sm text-ink-3 mt-0.5">{data?.meta?.total ?? 0} members</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary gap-1.5" onClick={() => setShowCreate(true)}>
            <UserPlus size={14}/> Add Member
          </button>
        )}
      </div>

      {/* Note about no self-registration */}
      {isAdmin && (
        <div className="flex items-center gap-2.5 p-3.5 bg-primary/8 border border-primary/20 rounded-xl mb-5 text-sm">
          <UserPlus size={15} className="text-primary flex-shrink-0"/>
          <span className="text-ink-2">User accounts are <strong className="text-ink-1">admin-only</strong>. There is no public registration. New members receive their login credentials by email.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="flex-1 max-w-xs"/>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-auto">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader/> : isError ? <ErrorState/> : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <th className="th">User</th>
              <th className="th">Role</th>
              <th className="th">Last Active</th>
              <th className="th">Status</th>
              {isAdmin && <th className="th">Actions</th>}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-3/50 transition-colors">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} size={36}/>
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-ink-3">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    {isAdmin ? (
                      <select value={u.role} onChange={e => updateRole({id:u.id,role:e.target.value})} className="w-auto text-xs py-1">
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    ) : (
                      <span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                    )}
                  </td>
                  <td className="td"><span className="text-xs text-ink-3">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</span></td>
                  <td className="td">
                    <span className={`badge ${u.isActive ? 'badge-resolved' : 'badge-closed'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  {isAdmin && (
                    <td className="td">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => toggleActive(u.id)} className="btn btn-sm btn-ghost text-xs text-ink-3">
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => { setResetTarget(u.id); setNewPw('') }}
                          className="btn btn-sm btn-ghost text-xs text-ink-3" title="Reset password">
                          <KeyRound size={12}/>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <Modal title="Add Team Member" subtitle="User will receive login credentials by email" onClose={() => setShowCreate(false)} size="sm"
          footer={<><button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitCreate} disabled={creating}>
              {creating && <Spinner size={14}/>} Create & Notify
            </button></>}>
          <Field label="Full Name" required><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Arun Kumar"/></Field>
          <Field label="Email" required><input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="arun@company.com"/></Field>
          <Field label="Temporary Password" required><input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Min. 8 characters"/></Field>
          <Field label="Role">
            <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value as Role}))}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
          <p className="text-xs text-ink-3 mt-1">The user will be emailed their credentials and asked to change their password.</p>
        </Modal>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <Modal title="Reset Password" subtitle="User will be notified by email" onClose={() => setResetTarget(null)} size="sm"
          footer={<><button className="btn" onClick={() => setResetTarget(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => resetPw({id:resetTarget,newPassword:newPw},{onSuccess:()=>setResetTarget(null)})} disabled={resetting||newPw.length<8}>
              {resetting && <Spinner size={14}/>} Reset
            </button></>}>
          <Field label="New Password" required><input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 8 characters"/></Field>
        </Modal>
      )}
    </div>
  )
}
