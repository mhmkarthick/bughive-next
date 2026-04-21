import { Request, Response } from 'express'
import { Project } from '../models/project.model'
import { Bug } from '../models/bug.model'
import { User } from '../models/user.model'
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response'
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors'
import { parsePagination } from '../utils/helpers'

export const listProjects = async (req: Request, res: Response) => {
  const { page, limit, search } = req.query as Record<string, string>
  const { page: p, limit: l, skip } = parsePagination(page, limit, 50)

  const filter: Record<string, unknown> = { isActive: true }
  if (search) filter.name = { $regex: search, $options: 'i' }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .skip(skip).limit(l).sort({ createdAt: -1 }).lean(),
    Project.countDocuments(filter),
  ])

  // Add bug count
  const withCounts = await Promise.all(projects.map(async (proj) => ({
    ...proj,
    bugCount: await Bug.countDocuments({ project: proj._id }),
  })))

  return sendPaginated(res, withCounts, total, p, l)
}

export const getProject = async (req: Request, res: Response) => {
  const { id } = req.params
  const project = await Project.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }] })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar role')
    .lean()
  if (!project) throw new NotFoundError('Project not found')
  const bugCount = await Bug.countDocuments({ project: project._id })
  return sendSuccess(res, { ...project, bugCount })
}

export const createProject = async (req: Request, res: Response) => {
  const { name, description } = req.body
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  if (await Project.findOne({ slug })) throw new ConflictError('Project with this name already exists')

  const project = await Project.create({
    name, slug, description,
    owner: req.user!.userId,
    members: [{ user: req.user!.userId, role: req.user!.role, joinedAt: new Date() }],
  })
  await project.populate('owner', 'name email avatar')
  return sendCreated(res, project, 'Project created')
}

export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params
  const project = await Project.findById(id)
  if (!project) throw new NotFoundError('Project not found')
  if (String(project.owner) !== req.user!.userId && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('Not project owner')
  }
  const { name, description } = req.body
  if (name)        project.name        = name
  if (description !== undefined) project.description = description
  await project.save()
  await project.populate('owner', 'name email avatar')
  return sendSuccess(res, project, 'Project updated')
}

export const addMember = async (req: Request, res: Response) => {
  const { id } = req.params
  const { userId, role = 'DEVELOPER' } = req.body

  const [project, user] = await Promise.all([
    Project.findById(id),
    User.findById(userId),
  ])
  if (!project) throw new NotFoundError('Project not found')
  if (!user)    throw new NotFoundError('User not found')

  const alreadyMember = project.members.some(m => String(m.user) === userId)
  if (alreadyMember) throw new ConflictError('User is already a member')

  project.members.push({ user: userId as any, role, joinedAt: new Date() })
  await project.save()
  await project.populate('members.user', 'name email avatar')

  return sendCreated(res, project.members.at(-1), 'Member added')
}

export const removeMember = async (req: Request, res: Response) => {
  const { id, userId } = req.params
  const project = await Project.findById(id)
  if (!project) throw new NotFoundError('Project not found')
  project.members = project.members.filter(m => String(m.user) !== userId)
  await project.save()
  return sendSuccess(res, null, 'Member removed')
}
