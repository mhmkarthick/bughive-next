import mongoose, { Document, Schema, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'QA' | 'REPORTER'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  passwordHash: string
  role: Role
  avatar?: string
  isActive: boolean
  emailVerified: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    name:          { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:  { type: String, required: true },
    role:          { type: String, enum: ['ADMIN','PROJECT_MANAGER','DEVELOPER','QA','REPORTER'], default: 'REPORTER' },
    avatar:        { type: String },
    isActive:      { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt:   { type: Date },
  },
  { timestamps: true },
)

// Indexes
userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })

// Never expose passwordHash in JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as any
    r.id = r._id
    delete r._id
    delete r.__v
    delete r.passwordHash
    return r
  },
})

// Instance method
userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash)
}

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
