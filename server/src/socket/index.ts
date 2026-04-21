import { Server as HttpServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import { verifyAccessToken } from '../utils/jwt'
import { logger } from '../utils/logger'

let io: SocketServer | null = null

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  })

  // Auth middleware for socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const payload = verifyAccessToken(token)
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user
    logger.info(`Socket connected: ${user.email}`)

    // Join personal room for targeted notifications
    socket.join(`user:${user.userId}`)

    // Join bug room when viewing a specific bug
    socket.on('bug:join', (bugId: string) => {
      socket.join(`bug:${bugId}`)
      logger.debug(`${user.email} joined bug room: ${bugId}`)
    })

    socket.on('bug:leave', (bugId: string) => {
      socket.leave(`bug:${bugId}`)
    })

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user.email}`)
    })
  })

  return io
}

export function getIO(): SocketServer | null {
  return io
}
