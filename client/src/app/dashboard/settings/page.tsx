'use client'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useUpdateUser } from '@/hooks'
import { authApi } from '@/lib/api'
import { Avatar, Field, Spinner } from '@/components/ui'
import { ROLE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'

const PREFS = ['Bug assigned to me','Status changes on my bugs','New comments','Daily digest','Weekly report']

export default function SettingsPage() {
  const user    = useAuthStore(s => s.user)
  const setAuth = useAuthStore(s => s.setAuth)
  const token   = useAuthStore(s => s.accessToken)
  const { mutate: update, isPending } = useUpdateUser()
  const [name, setName] = useState(user?.name || '')
  const [pw, setPw]     = useState({ current:'', next:'', confirm:'' })
  const [pwPending, setPwPending] = useState(false)
  const [prefs, setPrefs] = useState<Record<string,boolean>>(Object.fromEntries(PREFS.map(k=>[k,true])))

  const saveProfile = () => {
    if (!user) return
    update({ id: user.id, data: { name } }, {
      onSuccess: u => setAuth(u, token!),
    })
  }

  const changePw = async () => {
    if (pw.next !== pw.confirm) { toast.error('Passwords do not match'); return }
    if (pw.next.length < 8) { toast.error('Min. 8 characters'); return }
    setPwPending(true)
    try {
      await authApi.changePassword(pw.current, pw.next)
      toast.success('Password changed. Please log in again.')
      setPw({ current:'', next:'', confirm:'' })
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally { setPwPending(false) }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-ink-3 mt-0.5">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5">Profile</h2>
        <div className="flex items-center gap-4 mb-5 p-4 bg-surface-3 rounded-xl">
          <Avatar user={user ?? undefined} size={52}/>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-ink-3">{user?.email}</p>
            <span className="text-xs bg-surface-4 text-ink-2 px-2 py-0.5 rounded-full mt-1 inline-block">{ROLE_LABELS[user?.role||'REPORTER']}</span>
          </div>
        </div>
        <Field label="Display Name"><input value={name} onChange={e => setName(e.target.value)}/></Field>
        <Field label="Email"><input value={user?.email||''} disabled className="opacity-50 cursor-not-allowed"/></Field>
        <Field label="Role"><input value={ROLE_LABELS[user?.role||'REPORTER']} disabled className="opacity-50 cursor-not-allowed"/></Field>
        <button className="btn btn-primary gap-1.5" onClick={saveProfile} disabled={isPending||name===user?.name}>
          {isPending && <Spinner size={14}/>} Save Changes
        </button>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5">Change Password</h2>
        <Field label="Current Password"><input type="password" value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))} placeholder="••••••••"/></Field>
        <Field label="New Password"><input type="password" value={pw.next} onChange={e=>setPw(p=>({...p,next:e.target.value}))} placeholder="Min. 8 characters"/></Field>
        <Field label="Confirm New Password"><input type="password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} placeholder="Repeat password"/></Field>
        <button className="btn btn-primary gap-1.5" onClick={changePw} disabled={pwPending||!pw.current||!pw.next||!pw.confirm}>
          {pwPending && <Spinner size={14}/>} Update Password
        </button>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5">Notification Preferences</h2>
        <div className="space-y-1">
          {PREFS.map(pref => (
            <div key={pref} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm">{pref}</span>
              <button onClick={() => setPrefs(p=>({...p,[pref]:!p[pref]}))}
                className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors flex-shrink-0 ${prefs[pref]?'bg-primary':'bg-surface-4'}`}>
                <span className="w-3.5 h-3.5 bg-white rounded-full border border-border transition-transform"
                  style={{transform:prefs[pref]?'translateX(18px)':'translateX(2px)'}}/>
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn-primary mt-4" onClick={() => toast.success('Preferences saved!')}>Save Preferences</button>
      </div>
    </div>
  )
}
