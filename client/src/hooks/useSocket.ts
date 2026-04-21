'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

let socketInstance: Socket | null = null

export function useSocket() {
  const token = useAuthStore(s => s.accessToken)
  const qc    = useQueryClient()
  const ref   = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return

    // Reuse existing socket if already connected
    if (socketInstance?.connected) {
      ref.current = socketInstance
      return
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.log('[Socket] connected:', socket.id)
    })

    // Real-time notification
    socket.on('notification', (notif: { title: string; message: string }) => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast(notif.message, {
        icon: '🔔',
        duration: 4000,
        style: {
          background: '#1a1a22',
          color: '#f0f0f5',
          border: '1px solid #2a2a38',
          borderRadius: '12px',
          fontSize: '13px',
        },
      })
    })

    // Bug updated in real-time (while viewing bug detail)
    socket.on('bug:updated', () => {
      qc.invalidateQueries({ queryKey: ['bugs'] })
    })

    socket.on('comment:added', () => {
      qc.invalidateQueries({ queryKey: ['bugs'] })
    })

    socket.on('disconnect', () => {
      console.log('[Socket] disconnected')
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket] error:', err.message)
    })

    socketInstance = socket
    ref.current    = socket

    return () => {
      // Don't disconnect on unmount — keep alive for the session
    }
  }, [token, qc])

  const joinBugRoom  = (bugId: string) => ref.current?.emit('bug:join', bugId)
  const leaveBugRoom = (bugId: string) => ref.current?.emit('bug:leave', bugId)

  return { socket: ref.current, joinBugRoom, leaveBugRoom }
}
