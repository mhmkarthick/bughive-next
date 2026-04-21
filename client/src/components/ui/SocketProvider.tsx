'use client'
import { useSocket } from '@/hooks/useSocket'

/**
 * Mount this once inside the dashboard layout.
 * It initialises the Socket.io connection and listens for
 * real-time notifications without rendering any UI.
 */
export function SocketProvider() {
  useSocket()
  return null
}
