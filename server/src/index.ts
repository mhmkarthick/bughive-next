import 'express-async-errors'
import http from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

dotenv.config()

import { connectDB } from './config/database'
import { initSocket } from './socket'
import { errorHandler, notFound } from './middleware'
import { logger } from './utils/logger'
import {
  authRouter,
  usersRouter,
  projectsRouter,
  bugsRouter,
  notificationsRouter,
  dashboardRouter,
} from './routes'

// ─────────────────────────────────────────────────────────────

const app = express()
const server = http.createServer(app)

// ─── Security ────────────────────────────────────────────────
app.use(helmet())

// ✅ FIXED CORS (VERY IMPORTANT)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://bughive-next-client.vercel.app', // 🔥 your frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
}))

// ─── Middleware ─────────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use(morgan('combined', {
  stream: {
    write: (msg) => logger.http(msg.trim())
  }
}))

// ─── Health + Root (for Railway) ─────────────────────────────
app.get('/', (_req, res) => {
  res.send('🚀 BugHive API is running')
})

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// ─── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/bugs', bugsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/dashboard', dashboardRouter)

// ─── Error Handling ─────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000

async function bootstrap() {
  try {
    await connectDB()
    logger.info('✅ MongoDB connected')
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error)
    // do not exit → allow server to run
  }

  initSocket(server)

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(
      `🚀 BugHive API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`
    )
  })
}

bootstrap()

export { app, server }