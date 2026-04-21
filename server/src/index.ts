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
import { errorHandler, notFound } from './middleware/index'
import { logger } from './utils/logger'
import {
  authRouter, usersRouter, projectsRouter,
  bugsRouter, notificationsRouter, dashboardRouter,
} from './routes/index'

const app    = express()
const server = http.createServer(app)

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}))
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true, legacyHeaders: false,
}))

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan('combined', { stream: { write: m => logger.http(m.trim()) } }))

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRouter)
app.use('/api/users',         usersRouter)
app.use('/api/projects',      projectsRouter)
app.use('/api/bugs',          bugsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/dashboard',     dashboardRouter)

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

async function bootstrap() {
  await connectDB()
  initSocket(server)
  server.listen(PORT, () =>
    logger.info(`⬡ BugHive API running on :${PORT} [${process.env.NODE_ENV || 'development'}]`))
}

bootstrap()
export { app, server }
