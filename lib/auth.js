import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { getCollection } from './store.js'

const SECRET = process.env.JWT_SECRET || 'helm-dev-secret-change-me'
export const ROLES = ['Super Admin', 'Sub Admin', 'Coordinator', 'Author']

export function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(8).toString('hex')
  const hash = crypto.scryptSync(String(pw), salt, 32).toString('hex')
  return `${salt}:${hash}`
}
export function checkPassword(pw, stored) {
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), crypto.scryptSync(String(pw), salt, 32))
  } catch { return false }
}

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, SECRET, { expiresIn: '12h' })
}

export function authRequired(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  try { req.user = jwt.verify(token, SECRET); next() }
  catch { res.status(401).json({ error: 'Unauthorized' }) }
}

export async function findUserByEmail(identifier) {
  const users = await getCollection('users')
  const id = String(identifier || '').toLowerCase().trim()
  return users.find(u => u.email && u.email.toLowerCase() === id)
}
