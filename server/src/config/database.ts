import mongoose from 'mongoose'
import { logger } from '../utils/logger'

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bughive'

  mongoose.set('strictQuery', true)

  mongoose.connection.on('connected', () => logger.info('✅ MongoDB connected'))
  mongoose.connection.on('error',     (err) => logger.error('MongoDB error:', err))
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', err)
    process.exit(1)
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
}

export default mongoose
