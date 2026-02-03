import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import { JWT_SECRET } from '../middleware/auth.js'
import type { JwtPayload } from '../middleware/auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email e password richiesti' })
    return
  }
  const row = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email) as
    | { id: string; name: string; email: string; password_hash: string; role: string }
    | undefined
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ error: 'Credenziali non valide' })
    return
  }
  const payload: JwtPayload = { userId: row.id, email: row.email, role: row.role }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  res.json({
    token,
    user: { id: row.id, name: row.name, email: row.email, role: row.role, active: true },
  })
})

router.get('/me', requireAuth, (req, res) => {
  const { userId } = (req as { user: JwtPayload }).user
  const row = db.prepare('SELECT id, name, email, active, role FROM users WHERE id = ?').get(userId) as
    | { id: string; name: string; email: string; active: number; role: string }
    | undefined
  if (!row) {
    res.status(404).json({ error: 'Utente non trovato' })
    return
  }
  res.json({
    id: row.id,
    name: row.name,
    email: row.email,
    active: !!row.active,
    role: row.role,
  })
})

router.patch('/me', requireAuth, (req, res) => {
  const { userId } = (req as { user: JwtPayload }).user
  const { name, email, currentPassword, newPassword } = req.body
  const row = db.prepare('SELECT id, name, email, password_hash FROM users WHERE id = ?').get(userId) as
    | { id: string; name: string; email: string; password_hash: string }
    | undefined
  if (!row) {
    res.status(404).json({ error: 'Utente non trovato' })
    return
  }
  const updates: string[] = []
  const values: unknown[] = []
  if (name !== undefined && typeof name === 'string' && name.trim()) {
    updates.push('name = ?')
    values.push(name.trim())
  }
  if (email !== undefined && typeof email === 'string' && email.trim()) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim(), userId)
    if (existing) {
      res.status(409).json({ error: 'Email già in uso' })
      return
    }
    updates.push('email = ?')
    values.push(email.trim())
  }
  if (newPassword !== undefined && typeof newPassword === 'string' && newPassword.length >= 6) {
    if (!currentPassword || typeof currentPassword !== 'string') {
      res.status(400).json({ error: 'Password attuale richiesta per cambiarla' })
      return
    }
    if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
      res.status(401).json({ error: 'Password attuale non corretta' })
      return
    }
    updates.push('password_hash = ?')
    values.push(bcrypt.hashSync(newPassword, 10))
  }
  if (updates.length) {
    values.push(userId)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }
  const updated = db.prepare('SELECT id, name, email, active, role FROM users WHERE id = ?').get(userId) as {
    id: string
    name: string
    email: string
    active: number
    role: string
  }
  res.json({ ...updated, active: !!updated.active })
})

router.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

export default router
