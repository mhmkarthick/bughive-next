import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User } from './models/user.model'
import { Project } from './models/project.model'
import { Bug } from './models/bug.model'

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bughive')
  console.log('🌱 Seeding database...')

  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Bug.deleteMany({})])

  const hash = await bcrypt.hash('Password123!', 12)

  const [admin, pm, dev1, dev2, qa] = await User.insertMany([
    { name: 'Arun Kumar',   email: 'admin@bughive.io', passwordHash: hash, role: 'ADMIN' },
    { name: 'Priya Sharma', email: 'pm@bughive.io',    passwordHash: hash, role: 'PROJECT_MANAGER' },
    { name: 'Dev Menon',    email: 'dev1@bughive.io',  passwordHash: hash, role: 'DEVELOPER' },
    { name: 'Kavya R',      email: 'dev2@bughive.io',  passwordHash: hash, role: 'DEVELOPER' },
    { name: 'Ravi Nair',    email: 'qa@bughive.io',    passwordHash: hash, role: 'QA' },
  ])

  const [frontend, backend, mobile, devops] = await Project.insertMany([
    { name: 'Frontend Portal', slug: 'frontend-portal', description: 'Customer-facing web app', owner: pm._id,    members: [{ user: pm._id, role: 'PROJECT_MANAGER' }, { user: dev1._id, role: 'DEVELOPER' }, { user: qa._id, role: 'QA' }] },
    { name: 'Backend API',     slug: 'backend-api',     description: 'REST API services',       owner: pm._id,    members: [{ user: pm._id, role: 'PROJECT_MANAGER' }, { user: dev2._id, role: 'DEVELOPER' }] },
    { name: 'Mobile App',      slug: 'mobile-app',      description: 'iOS & Android app',       owner: pm._id,    members: [{ user: dev1._id, role: 'DEVELOPER' }] },
    { name: 'DevOps',          slug: 'devops',          description: 'Infrastructure & CI/CD',  owner: admin._id, members: [{ user: admin._id, role: 'ADMIN' }] },
  ])

  await Bug.insertMany([
    { bugId:'FP-001', title:'Login page crashes on Safari 16',           description:'Users on Safari 16 see a white screen after entering credentials. Affects ~30% of users.', status:'OPEN',        priority:'CRITICAL', severity:'BLOCKER', project:frontend._id, reporter:qa._id,    assignee:dev1._id, tags:['auth','safari'] },
    { bugId:'FP-002', title:'Dashboard chart not loading for new users',  description:'New accounts (< 7 days) see an empty state instead of the onboarding chart.',             status:'IN_PROGRESS', priority:'HIGH',     severity:'MAJOR',   project:frontend._id, reporter:pm._id,    assignee:dev2._id, tags:['dashboard','charts'] },
    { bugId:'BE-001', title:'API rate limiting returns wrong HTTP status', description:'Rate limiting middleware returns 500 instead of 429 when the limit is exceeded.',          status:'IN_REVIEW',   priority:'HIGH',     severity:'MAJOR',   project:backend._id,  reporter:dev1._id,  assignee:dev1._id, tags:['api','rate-limit'] },
    { bugId:'BE-002', title:'Email notifications not sent on status change', description:'Email queue shows enqueued jobs but they fail silently.',                               status:'OPEN',        priority:'MEDIUM',   severity:'MAJOR',   project:backend._id,  reporter:dev2._id,  assignee:null,     tags:['email'] },
    { bugId:'FP-003', title:'Typo in onboarding step 3',                  description:'Text reads "Wellcome" instead of "Welcome".',                                             status:'RESOLVED',    priority:'LOW',      severity:'TRIVIAL', project:frontend._id, reporter:qa._id,    assignee:dev2._id, tags:['copy','ui'] },
    { bugId:'MO-001', title:'App freezes on Android 14 photo upload',     description:'App freezes when uploading profile photo from Android 14 camera.',                        status:'OPEN',        priority:'CRITICAL', severity:'BLOCKER', project:mobile._id,   reporter:qa._id,    assignee:dev1._id, tags:['android','upload'] },
    { bugId:'DO-001', title:'CI pipeline fails on Node 20',               description:'Tests timeout ~20% of the time on Node 20 runners.',                                      status:'IN_PROGRESS', priority:'MEDIUM',   severity:'MINOR',   project:devops._id,   reporter:dev1._id,  assignee:admin._id, tags:['ci','node'] },
    { bugId:'FP-004', title:'Search pagination resets on filter change',   description:'Page indicator stays at 3 when filter applied.',                                          status:'CLOSED',      priority:'LOW',      severity:'MINOR',   project:frontend._id, reporter:pm._id,    assignee:dev2._id, tags:['search','pagination'] },
  ])

  console.log('✅ Seed complete!')
  console.log('\n👤 Test accounts (password: Password123!):')
  console.log('  Admin:   admin@bughive.io')
  console.log('  PM:      pm@bughive.io')
  console.log('  Dev:     dev1@bughive.io / dev2@bughive.io')
  console.log('  QA:      qa@bughive.io')

  await mongoose.disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
