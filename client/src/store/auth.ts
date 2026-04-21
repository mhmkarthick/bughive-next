'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  hydrated: boolean
  setAuth:  (user: User, token: string) => void
  setToken: (token: string) => void
  setHydrated: (v: boolean) => void
  logout:   () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      hydrated: false,
      setAuth:  (user, accessToken) => set({ user, accessToken }),
      setToken: (accessToken)       => set({ accessToken }),
      setHydrated: (hydrated)       => set({ hydrated }),
      logout:   ()                  => set({ user: null, accessToken: null }),
    }),
    {
      name: 'bughive-auth',
      partialize: s => ({ user: s.user, accessToken: s.accessToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)
