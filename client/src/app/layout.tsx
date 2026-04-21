import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: { default: 'BugHive', template: '%s | BugHive' },
  description: 'Professional bug tracking for modern teams',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-1 text-ink-1">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const key = 'bughive-theme'
    const stored = localStorage.getItem(key)
    const theme = stored || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  } catch {}
})()`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
