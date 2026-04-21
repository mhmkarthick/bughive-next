'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Bug, Columns, FolderKanban,
  Users, Bell, Settings, LogOut, Plus, ShieldCheck,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { useLogout, useUnreadCount } from '@/hooks'
import { useCanReportBug, useIsAdmin } from '@/hooks/common'
import { Avatar } from '@/components/ui'
import { AuthGuard } from '@/components/ui/AuthGuard'
import { SocketProvider } from '@/components/ui/SocketProvider'
import NewBugModal from '@/components/bugs/NewBugModal'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

const NAV = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/bugs',         icon: Bug,             label: 'All Bugs' },
  { href: '/dashboard/kanban',       icon: Columns,         label: 'Kanban Board' },
  { href: '/dashboard/projects',     icon: FolderKanban,    label: 'Projects' },
  { href: '/dashboard/users',        icon: Users,           label: 'Team' },
  { href: '/dashboard/notifications',icon: Bell,            label: 'Notifications' },
  { href: '/dashboard/settings',     icon: Settings,        label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname()
  const router       = useRouter()
  const user         = useAuthStore(s => s.user)
  const isAdmin      = useIsAdmin()
  const canReportBug = useCanReportBug()
  const { newBugOpen, openNewBug, closeNewBug } = useUIStore()
  const { mutate: logout } = useLogout()
  const { data: unread = 0 } = useUnreadCount()

  const handleLogout = () => { logout(); router.push('/auth/login') }

  return (
    <AuthGuard>
      <SocketProvider />
      <div className="flex h-screen overflow-hidden bg-surface-1">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-[220px] min-w-[220px] flex flex-col bg-surface-2 border-r border-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={15} className="text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">BugHive</div>
              <div className="text-[10px] text-ink-3 tracking-wide">Bug Tracking</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          <p className="text-[10px] tracking-widest uppercase text-ink-3 px-3 pt-3 pb-1.5">Menu</p>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)
            return (
              <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {label === 'Notifications' && unread > 0 && (
                  <span className="bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-2 border-t border-border">
          <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors">
            <Avatar user={user ?? undefined} size={30} />
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-[11px] text-ink-3 truncate">{user?.role?.replace('_',' ')}</div>
            </div>
          </Link>
          <button onClick={handleLogout} className="nav-item mt-0.5 text-ink-3 hover:text-danger w-full">
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center gap-3 px-6 bg-surface-2 border-b border-border flex-shrink-0">
          <div className="flex-1" />
          <ThemeToggle />
          {canReportBug && (
            <button onClick={openNewBug} className="btn btn-primary gap-1.5">
              <Plus size={14} /> Report Bug
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>

      {newBugOpen && <NewBugModal onClose={closeNewBug} />}
    </div>
    </AuthGuard>
  )
}
