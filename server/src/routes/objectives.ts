import type { Request, Response, NextFunction } from 'express'
import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function checkEditorOrAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Non autenticato' })
    return
  }
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
  const userId = req.user?.userId
  const userRow = userId ? db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } : null
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
