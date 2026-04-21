import mongoose, { Document, Schema, Model } from 'mongoose'
import { IUser } from './user.model'

export interface IProjectMember {
  user: mongoose.Types.ObjectId | IUser
  role: string
  joinedAt: Date
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string
  owner: mongoose.Types.ObjectId | IUser
  members: IProjectMember[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role:     { type: String, enum: ['ADMIN','PROJECT_MANAGER','DEVELOPER','QA','REPORTER'], default: 'DEVELOPER' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const projectSchema = new Schema<IProject>(
  {
    name:        { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, maxlength: 500 },
    owner:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members:     [projectMemberSchema],
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true },
)

projectSchema.index({ slug: 1 }, { unique: true })
projectSchema.index({ isActive: 1 })

projectSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as any
    r.id = r._id
    delete r._id
    delete r.__v
    return r
  },
})

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema)
