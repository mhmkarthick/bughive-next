'use client'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { authApi, usersApi, projectsApi, bugsApi, notificationsApi, dashboardApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import toast from 'react-hot-toast'
import type { BugFilters, CreateBugPayload } from '@/types'

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const K = {
  me:            ['me'],
  users:         (p?: object) => ['users', p],
  user:          (id: string) => ['users', id],
  projects:      (p?: object) => ['projects', p],
  project:       (id: string) => ['projects', id],
  bugs:          (f?: BugFilters) => ['bugs', f],
  bug:           (id: string) => ['bugs', id],
  notifications: (p?: object) => ['notifications', p],
  unread:        ['notifications', 'unread'],
  dashboard:     (pid?: string) => ['dashboard', pid],
  myStats:       ['dashboard', 'mine'],
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export function useMe() {
  const token = useAuthStore(s => s.accessToken)
  return useQuery({ queryKey: K.me, queryFn: () => authApi.me().then(r => r.data.data), enabled: !!token })
}

export function useLogin() {
  const setAuth = useAuthStore(s => s.setAuth)
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password).then(r => r.data.data),
    onSuccess: d => {
      setAuth(d.user, d.accessToken)
      try {
        const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
        const attrs = [`Path=/`, `Max-Age=900`, `SameSite=Lax`]
        if (secure) attrs.push('Secure')
        document.cookie = `bh_at=${encodeURIComponent(d.accessToken)}; ${attrs.join('; ')}`
      } catch {}
      toast.success('Welcome back!')
    },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Login failed'),
  })
}

export function useLogout() {
  const logout = useAuthStore(s => s.logout)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled:  () => {
      try {
        document.cookie = 'bh_at=; Path=/; Max-Age=0; SameSite=Lax'
      } catch {}
      logout()
      qc.clear()
    },
  })
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useUsers(params?: object) {
  return useQuery({ queryKey: K.users(params), queryFn: () => usersApi.list(params).then(r => r.data), placeholderData: keepPreviousData })
}
export function useUser(id: string) {
  return useQuery({ queryKey: K.user(id), queryFn: () => usersApi.get(id).then(r => r.data.data), enabled: !!id })
}
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: object) => usersApi.create(d).then(r => r.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created and notified by email') },
    onError:    (e: any) => toast.error(e.response?.data?.message || 'Failed to create user'),
  })
}
export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => usersApi.update(id, data).then(r => r.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Profile updated') },
    onError:    (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  })
}
export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role).then(r => r.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Role updated') },
  })
}
export function useToggleActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id).then(r => r.data.data),
    onSuccess:  (u) => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(`User ${u.isActive ? 'activated' : 'deactivated'}`) },
  })
}
export function useAdminResetPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersApi.resetPassword(id, newPassword),
    onSuccess: () => toast.success('Password reset. User notified by email.'),
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export function useProjects(params?: object) {
  return useQuery({ queryKey: K.projects(params), queryFn: () => projectsApi.list(params).then(r => r.data) })
}
export function useProject(id: string) {
  return useQuery({ queryKey: K.project(id), queryFn: () => projectsApi.get(id).then(r => r.data.data), enabled: !!id })
}
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: object) => projectsApi.create(d).then(r => r.data.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project created') },
    onError:    (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
}

// ─── Bugs ─────────────────────────────────────────────────────────────────────
export function useBugs(filters?: BugFilters) {
  return useQuery({
    queryKey: K.bugs(filters),
    queryFn:  () => bugsApi.list(filters).then(r => r.data),
    placeholderData: keepPreviousData,
  })
}
export function useBug(id: string) {
  return useQuery({ queryKey: K.bug(id), queryFn: () => bugsApi.get(id).then(r => r.data.data), enabled: !!id })
}
export function useCreateBug() {
  const qc  = useQueryClient()
  const cls = useUIStore(s => s.closeNewBug)
  return useMutation({
    mutationFn: (d: CreateBugPayload) => bugsApi.create(d).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bugs'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); cls(); toast.success('Bug reported!') },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed to create bug'),
  })
}
export function useUpdateBug() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => bugsApi.update(id, data).then(r => r.data.data),
    onSuccess: (bug) => {
      qc.invalidateQueries({ queryKey: ['bugs'] })
      qc.invalidateQueries({ queryKey: K.bug(bug.bugId) })
      qc.invalidateQueries({ queryKey: K.bug(bug.id) })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Bug updated')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  })
}
export function useDeleteBug() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bugsApi.delete(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['bugs'] }); toast.success('Bug deleted') },
  })
}
export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bugId, content }: { bugId: string; content: string }) =>
      bugsApi.addComment(bugId, content).then(r => r.data.data),
    onSuccess: (_d, { bugId }) => { qc.invalidateQueries({ queryKey: K.bug(bugId) }); toast.success('Comment added') },
  })
}
export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bugId, commentId }: { bugId: string; commentId: string }) => bugsApi.deleteComment(bugId, commentId),
    onSuccess: (_d, { bugId }) => { qc.invalidateQueries({ queryKey: K.bug(bugId) }); toast.success('Comment deleted') },
  })
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function useNotifications(params?: object) {
  return useQuery({ queryKey: K.notifications(params), queryFn: () => notificationsApi.list(params).then(r => r.data), refetchInterval: 30_000 })
}
export function useUnreadCount() {
  return useQuery({ queryKey: K.unread, queryFn: () => notificationsApi.unreadCount().then(r => r.data.data.count as number), refetchInterval: 15_000 })
}
export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read') },
  })
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function useDashboard(projectId?: string) {
  return useQuery({ queryKey: K.dashboard(projectId), queryFn: () => dashboardApi.stats(projectId).then(r => r.data.data), staleTime: 60_000 })
}
export function useMyStats() {
  return useQuery({ queryKey: K.myStats, queryFn: () => dashboardApi.myStats().then(r => r.data.data) })
}
