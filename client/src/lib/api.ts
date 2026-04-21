import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15_000,
})

// Attach token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let refreshing = false
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  r => r,
  async (err: AxiosError) => {
    const orig = err.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (err.response?.status === 401 && !orig._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(t => { orig.headers.Authorization = `Bearer ${t}`; return api(orig) })
      }
      orig._retry = true; refreshing = true
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const token: string = data.data.accessToken
        useAuthStore.getState().setToken(token)
        try {
          const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
          const attrs = [`Path=/`, `Max-Age=900`, `SameSite=Lax`]
          if (secure) attrs.push('Secure')
          document.cookie = `bh_at=${encodeURIComponent(token)}; ${attrs.join('; ')}`
        } catch {}
        queue.forEach(p => p.resolve(token)); queue = []
        orig.headers.Authorization = `Bearer ${token}`
        return api(orig)
      } catch (e) {
        queue.forEach(p => p.reject(e)); queue = []
        useAuthStore.getState().logout()
        try {
          document.cookie = 'bh_at=; Path=/; Max-Age=0; SameSite=Lax'
        } catch {}
        window.location.href = '/auth/login'
        return Promise.reject(e)
      } finally { refreshing = false }
    }
    return Promise.reject(err)
  },
)

export default api

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout:         ()                                => api.post('/auth/logout'),
  refresh:        ()                                => api.post('/auth/refresh'),
  me:             ()                                => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
}

// ─── Users API ────────────────────────────────────────────────────────────────
export const usersApi = {
  list:          (p?: object)                      => api.get('/users', { params: p }),
  get:           (id: string)                      => api.get(`/users/${id}`),
  stats:         (id: string)                      => api.get(`/users/${id}/stats`),
  create:        (d: object)                       => api.post('/users', d),
  update:        (id: string, d: object)           => api.patch(`/users/${id}`, d),
  updateRole:    (id: string, role: string)        => api.patch(`/users/${id}/role`, { role }),
  toggleActive:  (id: string)                      => api.patch(`/users/${id}/toggle-active`),
  resetPassword: (id: string, newPassword: string) => api.patch(`/users/${id}/reset-password`, { newPassword }),
}

// ─── Projects API ─────────────────────────────────────────────────────────────
export const projectsApi = {
  list:         (p?: object)                     => api.get('/projects', { params: p }),
  get:          (id: string)                     => api.get(`/projects/${id}`),
  create:       (d: object)                      => api.post('/projects', d),
  update:       (id: string, d: object)          => api.patch(`/projects/${id}`, d),
  addMember:    (id: string, userId: string, role?: string) => api.post(`/projects/${id}/members`, { userId, role }),
  removeMember: (id: string, userId: string)    => api.delete(`/projects/${id}/members/${userId}`),
}

// ─── Bugs API ─────────────────────────────────────────────────────────────────
export const bugsApi = {
  list:          (p?: object)                              => api.get('/bugs', { params: p }),
  get:           (id: string)                              => api.get(`/bugs/${id}`),
  stats:         (projectId?: string)                      => api.get('/bugs/stats', { params: projectId ? { projectId } : {} }),
  create:        (d: object)                               => api.post('/bugs', d),
  update:        (id: string, d: object)                   => api.patch(`/bugs/${id}`, d),
  delete:        (id: string)                              => api.delete(`/bugs/${id}`),
  addComment:    (id: string, content: string)             => api.post(`/bugs/${id}/comments`, { content }),
  deleteComment: (bugId: string, commentId: string)        => api.delete(`/bugs/${bugId}/comments/${commentId}`),
  uploadFile:    (bugId: string, file: File)               => {
    const form = new FormData(); form.append('file', file)
    return api.post(`/bugs/${bugId}/attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        (p?: object)  => api.get('/notifications', { params: p }),
  unreadCount: ()            => api.get('/notifications/unread-count'),
  markRead:    (id: string)  => api.patch(`/notifications/${id}/read`),
  markAllRead: ()            => api.patch('/notifications/mark-all-read'),
  delete:      (id: string)  => api.delete(`/notifications/${id}`),
}

// ─── Dashboard API ────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats:   (projectId?: string) => api.get('/dashboard/stats',    { params: projectId ? { projectId } : {} }),
  myStats: ()                   => api.get('/dashboard/my-stats'),
}
