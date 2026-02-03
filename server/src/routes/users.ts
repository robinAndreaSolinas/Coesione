import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { JwtPayload } from '../middleware/auth.js'

const router = Router()

function checkAdmin(req: { user: JwtPayload }, res: { status: (n: number) => { json: (o: object) => void } }, next: () => void) {
  const { userId } = req.user
  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined
  if (row?.role !== 'Admin') {
    res.status(403).json({ error: 'Solo gli admin possono gestire gli utenti' })
    return
  }
  next()
}

router.get('/', requireAuth, (req, res) => {
  const { userId } = (req as { user: JwtPayload }).user
  const me = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined
  if (me?.role !== 'Admin') {
    res.status(403).json({ error: 'Accesso negato' })
    return
  }
  const rows = db.prepare('SELECT id, name, email, active, role FROM users ORDER BY name').all() as Array<{
    id: string
    name: string
    email: string
    active: number
    role: string
  }>
  res.json(rows.map((r) => ({ ...r, active: !!r.active })))
})

router.post('/', requireAuth, checkAdmin, (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nome, email e password richiesti' })
    return
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'Email già in uso' })
    return
  }
  const id = Date.now().toString()
  const hash = bcrypt.hashSync(password, 10)
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, active, role) VALUES (?, ?, ?, ?, 1, ?)'
  ).run(id, name, email, hash, role || 'Viewer')
  const row = db.prepare('SELECT id, name, email, active, role FROM users WHERE id = ?').get(id) as {
    id: string
    name: string
    email: string
    active: number
    role: string
  }
  res.status(201).json({ ...row, active: !!row.active })
})

router.put('/:id', requireAuth, checkAdmin, (req, res) => {
  const { id } = req.params
  const { name, email, active, role, password } = req.body
  const row = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
  if (!row) {
    res.status(404).json({ error: 'Utente non trovato' })
    return
  }
  const updates: string[] = []
  const values: unknown[] = []
  if (name !== undefined) {
    updates.push('name = ?')
    values.push(name)
  }
  if (email !== undefined) {
    updates.push('email = ?')
    values.push(email)
  }
  if (active !== undefined) {
    updates.push('active = ?')
    values.push(active ? 1 : 0)
  }
  if (role !== undefined) {
    updates.push('role = ?')
    values.push(role)
  }
  if (password !== undefined && password !== '') {
    updates.push('password_hash = ?')
    values.push(bcrypt.hashSync(password, 10))
  }
  if (updates.length) {
    values.push(id)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }
  const updated = db.prepare('SELECT id, name, email, active, role FROM users WHERE id = ?').get(id) as {
    id: string
    name: string
    email: string
    active: number
    role: string
  }
  res.json({ ...updated, active: !!updated.active })
})

router.delete('/:id', requireAuth, checkAdmin, (req, res) => {
  const { id } = req.params
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Utente non trovato' })
    return
  }
  res.status(204).send()
})

export default router
