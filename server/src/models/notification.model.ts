import mongoose, { Document, Schema, Model } from 'mongoose'

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType =
  | 'BUG_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED'
  | 'PRIORITY_CHANGED' | 'BUG_RESOLVED' | 'MENTION'

export interface INotification extends Document {
  receiver: mongoose.Types.ObjectId
  triggeredBy?: mongoose.Types.ObjectId
  bug?: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  readAt?: Date
  createdAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    receiver:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    bug:         { type: Schema.Types.ObjectId, ref: 'Bug' },
    type:        { type: String, enum: ['BUG_ASSIGNED','STATUS_CHANGED','COMMENT_ADDED','PRIORITY_CHANGED','BUG_RESOLVED','MENTION'], required: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false, index: true },
    readAt:  { type: Date },
  },
  { timestamps: true },
)

notificationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as any
    r.id = r._id
    delete r._id
    delete r.__v
    return r
  },
})

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema)

// ─── RefreshToken ─────────────────────────────────────────────────────────────
export interface IRefreshToken extends Document {
  token: string
  user: mongoose.Types.ObjectId
  expiresAt: Date
  createdAt: Date
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token:     { type: String, required: true, unique: true, index: true },
    user:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

// Auto-delete expired tokens via MongoDB TTL index
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshToken: Model<IRefreshToken> =
  mongoose.models.RefreshToken ||
  mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema)
