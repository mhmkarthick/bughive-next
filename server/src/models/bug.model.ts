import mongoose, { Document, Schema, Model } from 'mongoose'

export type BugStatus   = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED' | 'REOPENED'
export type Priority    = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type Severity    = 'BLOCKER' | 'MAJOR' | 'MINOR' | 'TRIVIAL'

export interface IComment {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  content: string
  isEdited: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IAttachment {
  _id: mongoose.Types.ObjectId
  uploadedBy: mongoose.Types.ObjectId
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  publicId?: string
  createdAt: Date
}

export interface IActivityLog {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  action: string
  oldValue?: string
  newValue?: string
  createdAt: Date
}

export interface IBug extends Document {
  _id: mongoose.Types.ObjectId
  bugId: string
  title: string
  description: string
  stepsToReproduce?: string
  expectedBehavior?: string
  actualBehavior?: string
  environment?: string
  browser?: string
  os?: string
  version?: string
  status: BugStatus
  priority: Priority
  severity: Severity
  project: mongoose.Types.ObjectId
  reporter: mongoose.Types.ObjectId
  assignee?: mongoose.Types.ObjectId | null
  tags: string[]
  comments: IComment[]
  attachments: IAttachment[]
  activityLog: IActivityLog[]
  dueDate?: Date
  resolvedAt?: Date
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const commentSchema = new Schema<IComment>(
  {
    user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content:  { type: String, required: true, trim: true },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const attachmentSchema = new Schema<IAttachment>(
  {
    uploadedBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filename:     { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType:     { type: String, required: true },
    size:         { type: Number, required: true },
    url:          { type: String, required: true },
    publicId:     { type: String },
    createdAt:    { type: Date, default: Date.now },
  },
  { _id: true },
)

const activitySchema = new Schema<IActivityLog>(
  {
    user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action:   { type: String, required: true },
    oldValue: { type: String },
    newValue: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const bugSchema = new Schema<IBug>(
  {
    bugId:            { type: String, required: true, unique: true },
    title:            { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
    description:      { type: String, required: true, minlength: 10 },
    stepsToReproduce: { type: String },
    expectedBehavior: { type: String },
    actualBehavior:   { type: String },
    environment:      { type: String },
    browser:          { type: String },
    os:               { type: String },
    version:          { type: String },
    status:   { type: String, enum: ['OPEN','IN_PROGRESS','IN_REVIEW','RESOLVED','CLOSED','REOPENED'], default: 'OPEN' },
    priority: { type: String, enum: ['CRITICAL','HIGH','MEDIUM','LOW'], default: 'MEDIUM' },
    severity: { type: String, enum: ['BLOCKER','MAJOR','MINOR','TRIVIAL'], default: 'MAJOR' },
    project:    { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    reporter:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignee:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
    tags:       [{ type: String, lowercase: true, trim: true }],
    comments:   [commentSchema],
    attachments:[attachmentSchema],
    activityLog:[activitySchema],
    dueDate:    { type: Date },
    resolvedAt: { type: Date },
    closedAt:   { type: Date },
  },
  { timestamps: true },
)

// Indexes for fast queries
bugSchema.index({ project: 1, status: 1 })
bugSchema.index({ assignee: 1 })
bugSchema.index({ reporter: 1 })
bugSchema.index({ priority: 1 })
bugSchema.index({ tags: 1 })
bugSchema.index({ bugId: 1 }, { unique: true })
bugSchema.index({ title: 'text', description: 'text' }) // full-text search

bugSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as any
    r.id = r._id
    delete r._id
    delete r.__v
    return r
  },
})

export const Bug: Model<IBug> =
  mongoose.models.Bug || mongoose.model<IBug>('Bug', bugSchema)
