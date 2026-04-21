'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries:   { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  }))

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgb(var(--surface-3) / 1)',
              color: 'rgb(var(--ink-1) / 1)',
              border: '1px solid rgb(var(--border) / 1)',
              borderRadius: '12px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: 'rgb(var(--success) / 1)', secondary: 'rgb(var(--surface-3) / 1)' } },
            error:   { iconTheme: { primary: 'rgb(var(--danger) / 1)', secondary: 'rgb(var(--surface-3) / 1)' } },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
