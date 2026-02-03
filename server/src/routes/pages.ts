import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { JwtPayload } from '../middleware/auth.js'

const router = Router()

function checkAdmin(req: { user: JwtPayload }, res: { status: (n: number) => { json: (o: object) => void } }, next: () => void) {
  const { userId } = req.user
  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined
  if (row?.role !== 'Admin') {
    res.status(403).json({ error: 'Solo gli admin possono modificare la visibilità' })
    return
  }
  next()
}

router.get('/visibility', (_req, res) => {
  const rows = db.prepare('SELECT page_key, is_public, is_visible_for_users FROM page_visibility').all() as Array<{
    page_key: string
    is_public: number
    is_visible_for_users: number
  }>
  const map: Record<string, { isPublic: boolean; isVisibleForUsers: boolean }> = {}
  for (const r of rows) {
    map[r.page_key] = { isPublic: !!r.is_public, isVisibleForUsers: !!r.is_visible_for_users }
  }
  res.json(map)
})

router.get('/visibility/:pageKey', (req, res) => {
  const { pageKey } = req.params
  const row = db.prepare('SELECT is_public, is_visible_for_users FROM page_visibility WHERE page_key = ?').get(pageKey) as
    | { is_public: number; is_visible_for_users: number }
    | undefined
  if (!row) {
    res.json({ isPublic: false, isVisibleForUsers: true })
    return
  }
  res.json({ isPublic: !!row.is_public, isVisibleForUsers: !!row.is_visible_for_users })
})

router.put('/visibility/:pageKey', requireAuth, checkAdmin, (req, res) => {
  const { pageKey } = req.params
  const { isPublic, isVisibleForUsers } = req.body
  db.prepare(
    `INSERT INTO page_visibility (page_key, is_public, is_visible_for_users)
     VALUES (?, ?, ?)
     ON CONFLICT(page_key) DO UPDATE SET
       is_public = excluded.is_public,
       is_visible_for_users = excluded.is_visible_for_users`
  ).run(pageKey, isPublic ? 1 : 0, isVisibleForUsers !== false ? 1 : 0)
  const row = db.prepare('SELECT is_public, is_visible_for_users FROM page_visibility WHERE page_key = ?').get(pageKey) as {
    is_public: number
    is_visible_for_users: number
  }
  res.json({ isPublic: !!row.is_public, isVisibleForUsers: !!row.is_visible_for_users })
})

export default router
