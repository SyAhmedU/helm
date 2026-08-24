import express from 'express'
import { getCollection, setCollection, nextId, usingRedis } from './lib/store.js'
import { signToken, authRequired, requireRole, ADMIN_ROLES, hashPassword, checkPassword, findUserByEmail, ROLES } from './lib/auth.js'
import { seedIfEmpty } from './lib/seed.js'

const app = express()
app.use(express.json({ limit: '4mb' }))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use((req, res, next) => {
  if (process.env.VERCEL && !usingRedis && req.path !== '/api/health')
    return res.status(503).json({ error: 'Storage not configured — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.' })
  next()
})

let seeded = false
app.use(async (req, res, next) => {
  if (!seeded) { await seedIfEmpty(); seeded = true }
  next()
})

app.get('/api/health', (req, res) => res.json({ ok: true, storage: usingRedis ? 'redis' : 'file' }))

function publicUser(u) { const { password, ...rest } = u; return rest }

async function log(event, req, extra = {}) {
  const logs = await getCollection('logs')
  logs.push({ id: `log${logs.length + 1}`, event, userId: req.user?.id || null, at: new Date().toISOString(), ...extra })
  if (logs.length > 5000) logs.splice(0, logs.length - 5000)
  await setCollection('logs', logs)
}

// ---------------- auth ----------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  const user = await findUserByEmail(email)
  if (!user || !checkPassword(password, user.password)) return res.status(401).json({ error: 'Invalid email or password' })
  await log('login', { user: { id: user.id } }, { role: user.role })
  res.json({ token: signToken(user), user: publicUser(user) })
})

app.get('/api/auth/me', authRequired, async (req, res) => {
  const users = await getCollection('users')
  const user = users.find(u => u.id === req.user.id)
  if (!user) return res.status(401).json({ error: 'Unknown user' })
  res.json({ user: publicUser(user) })
})

// Every route below this line requires a signed-in staff account.
app.use('/api', authRequired)

// ---------------- generic CRUD ----------------
async function freshId(prefix, rows) {
  let id
  do { id = await nextId(prefix) } while (rows.some(r => r.id === id))
  return id
}

const CRUD = {
  institutions: { prefix: 'college', required: ['name'] },
  batches: { prefix: 'batch', required: ['name', 'year', 'institutionId'] },
  users: { prefix: 'user', required: ['name', 'email', 'role'] },
  questions: { prefix: 'question', required: ['type', 'difficulty'] },
  assessments: { prefix: 'assessment', required: ['title'] },
  configured_assessments: { prefix: 'config_assessment', required: ['assessmentId'] },
  courses: { prefix: 'course', required: ['name'] },
  course_modules: { prefix: 'module', required: ['name', 'courseId'] },
  learning_units: { prefix: 'unit', required: ['name', 'type', 'courseId', 'moduleId'] },
  administrations: { prefix: 'admin', required: ['type', 'audienceType'] },
  tags: { prefix: 'tag', required: ['name'] },
}

for (const [name, cfg] of Object.entries(CRUD)) {
  app.get(`/api/${name}`, async (req, res) => {
    let rows = await getCollection(name)
    if (name === 'users') rows = rows.map(publicUser)
    res.json(rows)
  })

  app.post(`/api/${name}`, async (req, res) => {
    const body = req.body || {}
    for (const f of cfg.required) if (body[f] == null || body[f] === '') return res.status(400).json({ error: `Required field '${f}' is missing or empty` })
    // Privilege escalation guard: only a Super Admin may create another admin-tier account.
    if (name === 'users' && ADMIN_ROLES.includes(body.role) && req.user.role !== 'Super Admin')
      return res.status(403).json({ error: 'Only a Super Admin can create an admin-tier account' })
    const rows = await getCollection(name)
    const row = { ...body, id: await freshId(cfg.prefix, rows), createdAt: new Date().toISOString() }
    if (name === 'users') {
      if (rows.some(u => u.email?.toLowerCase() === row.email.toLowerCase())) return res.status(400).json({ error: 'Email already exists' })
      row.password = hashPassword(body.password || 'student123')
    }
    if (name === 'configured_assessments' && row.enableProtectorCode && !row.protectorCode) row.protectorCode = String(Math.floor(100000 + Math.random() * 900000))
    if (name === 'course_modules' || name === 'learning_units') {
      const siblings = rows.filter(r => r.moduleId === row.moduleId && r.courseId === row.courseId)
      if (row.order == null) row.order = siblings.length + 1
    }
    rows.push(row)
    await setCollection(name, rows)
    await log(`${name}.create`, req, { id: row.id })
    res.status(201).json(name === 'users' ? publicUser(row) : row)
  })

  app.put(`/api/${name}/:id`, async (req, res) => {
    const rows = await getCollection(name)
    const i = rows.findIndex(r => r.id === req.params.id)
    if (i < 0) return res.status(404).json({ error: 'Not found' })
    // Privilege escalation guard: only a Super Admin may promote an account to
    // an admin-tier role, or edit an account that already holds one.
    if (name === 'users' && req.user.role !== 'Super Admin' && (ADMIN_ROLES.includes(req.body?.role) || ADMIN_ROLES.includes(rows[i].role)))
      return res.status(403).json({ error: 'Only a Super Admin can modify an admin-tier account' })
    const patch = { ...req.body }
    delete patch.id
    if (name === 'users') { if (patch.password) patch.password = hashPassword(patch.password); else delete patch.password }
    rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() }
    await setCollection(name, rows)
    await log(`${name}.update`, req, { id: req.params.id })
    res.json(name === 'users' ? publicUser(rows[i]) : rows[i])
  })

  app.delete(`/api/${name}/:id`, async (req, res) => {
    const rows = await getCollection(name)
    const target = rows.find(r => r.id === req.params.id)
    if (!target) return res.status(404).json({ error: 'Not found' })
    if (name === 'users' && ADMIN_ROLES.includes(target.role) && req.user.role !== 'Super Admin')
      return res.status(403).json({ error: 'Only a Super Admin can remove an admin-tier account' })
    await setCollection(name, rows.filter(r => r.id !== req.params.id))
    await log(`${name}.delete`, req, { id: req.params.id })
    res.json({ ok: true })
  })
}

app.get('/api/attempts', async (req, res) => res.json(await getCollection('attempts')))
// The audit trail is Super-Admin-only — it's a record of who did what, not
// something every Author/Coordinator account should be able to read.
app.get('/api/logs', requireRole('Super Admin'), async (req, res) => {
  const logs = await getCollection('logs')
  res.json(logs.slice(-500).reverse())
})

// ---------------- dashboard rollup ----------------
// Everything the real portal makes you assemble in your head by visiting six
// separate collection pages — computed server-side, once, from the same data.
app.get('/api/dashboard', async (req, res) => {
  const [institutions, batches, users, questions, assessments, configured, courses, modules, units, administrations, attempts] = await Promise.all(
    ['institutions', 'batches', 'users', 'questions', 'assessments', 'configured_assessments', 'courses', 'course_modules', 'learning_units', 'administrations', 'attempts'].map(getCollection)
  )
  const students = users.filter(u => u.role === 'Student')
  const now = Date.now()
  const today0 = new Date(); today0.setHours(0, 0, 0, 0)

  const batchesNoStudents = batches.filter(b => !batches.some(x => x.parentBatchId === b.id) && !students.some(s => (s.batchIds || []).includes(b.id)))
  const questionsNoRationale = questions.filter(q => q.type === 'MCQ' && !q.rationale)
  const draftCourses = courses.filter(c => c.status !== 'Published')
  const configNoResultSetting = configured.filter(c => !c.resultPublishingType)

  const attemptsToday = attempts.filter(a => new Date(a.startedAt) >= today0)
  const violations = attempts.filter(a => a.status === 'Hard Submitted')
  const scores = attempts.filter(a => a.totalScore > 0).map(a => Math.round((a.obtainedScore / a.totalScore) * 100))
  const avgScorePct = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null
  const passRate = scores.length ? Math.round((scores.filter(s => s >= 50).length / scores.length) * 100) : null

  const liveAdmins = administrations.filter(a => a.status === 'Live')
  const scheduledAdmins = administrations.filter(a => a.status === 'Scheduled')

  res.json({
    counts: { institutions: institutions.length, batches: batches.length, students: students.length, staff: users.length - students.length, questions: questions.length, assessments: assessments.length, courses: courses.length, administrations: administrations.length, attempts: attempts.length },
    activity: { attemptsToday: attemptsToday.length, liveAdministrations: liveAdmins.length, scheduledAdministrations: scheduledAdmins.length, avgScorePct, passRate, violations: violations.length },
    attention: [
      ...batchesNoStudents.map(b => ({ kind: 'batch_empty', label: `${b.name} has no students enrolled`, id: b.id })),
      ...questionsNoRationale.slice(0, 10).map(q => ({ kind: 'question_no_rationale', label: `${q.title} — MCQ missing a rationale`, id: q.id })),
      ...draftCourses.map(c => ({ kind: 'course_draft', label: `${c.name} is still in Draft`, id: c.id })),
      ...configNoResultSetting.map(c => ({ kind: 'config_incomplete', label: `Configured assessment ${c.id} has no result-publishing setting`, id: c.id })),
    ],
    scoreDistribution: (() => {
      const buckets = [0, 0, 0, 0, 0] // 0-20,21-40,41-60,61-80,81-100
      for (const s of scores) buckets[Math.min(4, Math.floor(s / 20))]++
      return buckets
    })(),
    institutionsBreakdown: institutions.map(inst => {
      const bs = batches.filter(b => b.institutionId === inst.id)
      const st = students.filter(s => s.institutionId === inst.id)
      return { id: inst.id, name: inst.name, batches: bs.length, students: st.length }
    }),
  })
})

export default app
