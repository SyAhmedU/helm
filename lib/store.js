// Collection store: Upstash Redis REST when env vars are set, else flat JSON file.
// Each collection is stored as one JSON array under key helm:<name>.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json')

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
export const usingRedis = Boolean(REDIS_URL && REDIS_TOKEN)

export const COLLECTIONS = [
  'institutions', 'batches', 'users',
  'questions', 'assessments', 'configured_assessments',
  'courses', 'course_modules', 'learning_units',
  'administrations', 'attempts',
  'tags', 'images', 'logs',
]

async function redisCmd(...args) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!res.ok) throw new Error(`redis ${args[0]} failed: ${res.status}`)
  const data = await res.json()
  return data.result
}

let fileCache = null
function fileLoad() {
  if (fileCache) return fileCache
  try { fileCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch { fileCache = {} }
  return fileCache
}
function fileSave() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
  fs.writeFileSync(DB_FILE, JSON.stringify(fileCache))
}

export async function getCollection(name) {
  if (usingRedis) {
    const raw = await redisCmd('GET', `helm:${name}`)
    return raw ? JSON.parse(raw) : []
  }
  const db = fileLoad()
  return db[name] || []
}

export async function setCollection(name, rows) {
  if (usingRedis) {
    await redisCmd('SET', `helm:${name}`, JSON.stringify(rows))
    return
  }
  const db = fileLoad()
  db[name] = rows
  fileSave()
}

// Sequential human-readable ids like question236, batch1547, admin362 — mirrors
// the real portal's id style (visible in its list rows, e.g. `college5`).
export async function nextId(prefix) {
  if (usingRedis) {
    const n = await redisCmd('INCR', `helm:seq:${prefix}`)
    return `${prefix}${n}`
  }
  const db = fileLoad()
  db.__seq = db.__seq || {}
  db.__seq[prefix] = (db.__seq[prefix] || 0) + 1
  fileSave()
  return `${prefix}${db.__seq[prefix]}`
}
