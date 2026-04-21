'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Spinner } from '@/components/ui'

/**
 * Wraps any page that requires authentication.
 * Redirects to /auth/login if no access token is found in the store.
 * Use inside layouts or individual pages as needed.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const token  = useAuthStore(s => s.accessToken)
  const user   = useAuthStore(s => s.user)

  useEffect(() => {
    if (!token || !user) {
      router.replace('/auth/login')
    }
  }, [token, user, router])

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <Spinner size={28} />
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Role guard — renders children only if the user has one of the allowed roles.
 * Otherwise renders the fallback (default: null).
 */
export function RoleGuard({
  roles,
  children,
  fallback = null,
}: {
  roles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const role = useAuthStore(s => s.user?.role)
  if (!role || !roles.includes(role)) return <>{fallback}</>
  return <>{children}</>
}
