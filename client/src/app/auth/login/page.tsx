'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react'
import { useLogin } from '@/hooks'
import { Spinner } from '@/components/ui'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="card p-8 bg-surface-2 dark:bg-surface-2/70 backdrop-blur-none dark:backdrop-blur-xl animate-slide-up">
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <Spinner size={16} /> Loading…
          </div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const { mutate: login, isPending } = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [buzz, setBuzz] = useState(false)
  const [tagline, setTagline] = useState('Sign in to continue — your backlog is waiting.')

  useEffect(() => {
    const lines = [
      'Welcome back. Your bugs missed you. Not in a healthy way.',
      "Sign in to continue: because chaos doesn’t ship itself (sadly).",
      'BugHive: where “works on my machine” goes to be cross‑examined.',
      'Please authenticate. The bugs demand paperwork.',
      'Log in. Then we can argue about whether it’s a bug or a “surprise”.',
    ]
    setTagline(lines[Math.floor(Math.random() * lines.length)])
  }, [])

  useEffect(() => {
    if (!errors.email && !errors.password) return
    setBuzz(true)
    const t = setTimeout(() => setBuzz(false), 420)
    return () => clearTimeout(t)
  }, [errors.email, errors.password])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    const from = sp.get('from')
    const next = from && from.startsWith('/') ? from : '/dashboard'
    login({ email, password }, { onSuccess: () => router.push(next) })
  }

  return (
    <div
      className={`card p-8 bg-surface-2 dark:bg-surface-2/70 backdrop-blur-none dark:backdrop-blur-xl animate-slide-up ${
        buzz ? 'animate-wiggle' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-xl font-semibold mb-1 tracking-tight">Sign in</h2>
          <p className="text-sm text-ink-3 leading-6">{tagline}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-surface-3 dark:bg-surface-3/70 border border-border/80 flex items-center justify-center flex-shrink-0">
          <span className="font-mono text-[12px] text-ink-2">{'</>'}</span>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        {/* Email */}
        <div className="mb-4">
          <label className="block text-[11px] tracking-widest uppercase text-ink-3 mb-1.5">Email</label>
          <div
            className={`flex items-center gap-2 bg-surface-3 dark:bg-surface-3/60 border rounded-xl px-3 py-2.5 transition-colors ${
              errors.email ? 'border-danger' : 'border-border hover:border-border-strong'
            }`}
          >
            <Mail size={14} className="text-ink-3 flex-shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((x) => ({ ...x, email: '' }))
              }}
              placeholder="you@company.com"
              className="bg-transparent border-none p-0 outline-none w-full placeholder:text-ink-3"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-[11px] tracking-widest uppercase text-ink-3 mb-1.5">Password</label>
          <div
            className={`flex items-center gap-2 bg-surface-3 dark:bg-surface-3/60 border rounded-xl px-3 py-2.5 transition-colors ${
              errors.password ? 'border-danger' : 'border-border hover:border-border-strong'
            }`}
          >
            <Lock size={14} className="text-ink-3 flex-shrink-0" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((x) => ({ ...x, password: '' }))
              }}
              placeholder="••••••••••••••••"
              className="bg-transparent border-none p-0 outline-none w-full placeholder:text-ink-3"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="text-ink-3 hover:text-ink-1 transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white
            bg-gradient-to-r from-primary via-violet-500 to-info transition-all
            hover:brightness-110 active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 focus-visible:outline-offset-2"
        >
          {isPending ? (
            <Spinner size={16} />
          ) : (
            <>
              <LogIn size={15} /> Sign In
            </>
          )}
        </button>
      </form>

      {/* Demo accounts */}
      <div className="mt-6 p-4 bg-surface-3/70 dark:bg-surface-3/50 rounded-xl border border-border/80">
        <p className="text-[10px] tracking-widest uppercase text-ink-3 mb-3">Demo Accounts</p>
        {[
          { label: 'Admin', email: 'admin@bughive.io' },
          { label: 'Dev', email: 'dev1@bughive.io' },
          { label: 'QA', email: 'qa@bughive.io' },
        ].map((a) => (
          <button
            key={a.email}
            type="button"
            onClick={() => {
              setEmail(a.email)
              setPassword('Password123!')
            }}
            className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-surface-4 transition-colors group mb-0.5"
          >
            <span className="text-xs font-medium text-ink-2 group-hover:text-ink-1">{a.label}</span>
            <span className="text-[11px] text-ink-3 font-mono">{a.email}</span>
          </button>
        ))}
        <p className="text-[11px] text-ink-3 text-center mt-2">
          Password: <span className="font-mono">Password123!</span>
        </p>
      </div>

      {/* No register link — admin creates users */}
      <p className="text-xs text-ink-3 text-center mt-5 leading-5">
        Don&apos;t have an account? Ask your admin to add you.
        <br />
        User accounts are created by admins only.
      </p>
    </div>
  )
}
