import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { JwtPayload } from '../middleware/auth.js'

const router = Router()

function checkEditorOrAdmin(req: { user: JwtPayload }, res: { status: (n: number) => { json: (o: object) => void } }, next: () => void) {
  const { userId } = req.user
  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined
  if (!row || !['Admin', 'Editor'].includes(row.role)) {
    res.status(403).json({ error: 'Solo Admin e Editor possono modificare gli obiettivi' })
    return
  }
  next()
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT id, title, category, path, value, unit FROM objectives ORDER BY category, id').all() as Array<{
    id: string
    title: string
    category: string
    path: string
    value: number
    unit: string
  }>
  res.json(rows)
})

router.put('/:id', requireAuth, checkEditorOrAdmin, (req, res) => {
  const { id } = req.params
  const { value, unit } = req.body
  const { userId } = (req as { user: JwtPayload }).user
  const userRow = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string }
  const isAdmin = userRow?.role === 'Admin'

  const row = db.prepare('SELECT id, unit FROM objectives WHERE id = ?').get(id) as { id: string; unit: string } | undefined
  if (!row) {
    res.status(404).json({ error: 'Obiettivo non trovato' })
    return
  }
  const numValue = typeof value === 'number' ? value : parseFloat(String(value))
  const strUnit = isAdmin && typeof unit === 'string' ? unit : row.unit
  if (isNaN(numValue)) {
    res.status(400).json({ error: 'Valore non valido' })
    return
  }
  db.prepare('UPDATE objectives SET value = ?, unit = ? WHERE id = ?').run(numValue, strUnit, id)
  const updated = db.prepare('SELECT id, title, category, path, value, unit FROM objectives WHERE id = ?').get(id) as {
    id: string
    title: string
    category: string
    path: string
    value: number
    unit: string
  }
  res.json(updated)
})

export default router
