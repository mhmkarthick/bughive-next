'use client'
import { create } from 'zustand'
import type { BugFilters } from '@/types'

const defaultFilters: BugFilters = {
  status: '', priority: '', severity: '',
  projectId: '', assigneeId: '', reporterId: '', search: '',
  page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc',
}

interface UIState {
  newBugOpen: boolean
  openNewBug:  () => void
  closeNewBug: () => void
  filters: BugFilters
  setFilters:   (f: Partial<BugFilters>) => void
  resetFilters: () => void
}

export const useUIStore = create<UIState>((set) => ({
  newBugOpen:  false,
  openNewBug:  () => set({ newBugOpen: true }),
  closeNewBug: () => set({ newBugOpen: false }),
  filters: defaultFilters,
  setFilters:   (f) => set(s => ({ filters: { ...s.filters, ...f, page: f.page ?? 1 } })),
  resetFilters: () => set({ filters: defaultFilters }),
}))
