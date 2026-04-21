'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button type="button" onClick={toggleTheme} className="btn btn-ghost btn-icon" aria-label="Toggle theme">
      <Icon size={16} />
    </button>
  )
}

