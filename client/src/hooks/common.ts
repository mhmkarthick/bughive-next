'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'

export function useDebounce<T>(value: T, delay = 400): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

export function useClickOutside<T extends HTMLElement>(cb: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [cb])
  return ref
}

export function useKeyPress(key: string, cb: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === key) cb() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [key, cb])
}

export const useCurrentUser = () => useAuthStore(s => s.user)
export const useIsAdmin     = () => useAuthStore(s => s.user?.role === 'ADMIN')
export const useIsManager   = () => useAuthStore(s => s.user?.role === 'ADMIN' || s.user?.role === 'PROJECT_MANAGER')
export const useCanReportBug = () => useAuthStore(s => !!s.user && s.user.role !== 'DEVELOPER')
