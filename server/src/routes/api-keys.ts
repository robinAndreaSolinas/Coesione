import type { Request, Response, NextFunction } from 'express'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import * as apiKeys from '../lib/api-keys.js'
import type { ApiKeyType } from '../lib/api-keys.js'

const router = Router()

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
})

function checkAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Non autenticato' })
    return
  }
  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined
  if (row?.role !== 'Admin') {
    res.status(403).json({ error: 'Solo gli Admin possono gestire le API key' })
    return
  }
  next()
}

router.get('/', requireAuth, checkAdmin, (_req, res) => {
  const keys = apiKeys.listApiKeys()
  res.json(keys.map((k) => ({ hash: k.hash, name: k.name, source: k.source, type: k.type, createdAt: k.createdAt })))
})

router.post('/', requireAuth, checkAdmin, (req, res) => {
  const { name, source, type, key } = req.body
  if (!name || !source || key === undefined || key === null) {
    res.status(400).json({ error: 'Nome, fonte e key richiesti' })
    return
  }
  const validTypes: ApiKeyType[] = ['jwt', 'api_key', 'secret_client', 'token_json', 'piano_esp']
  const t: ApiKeyType = validTypes.includes(type) ? type : 'api_key'
  try {
    const entry = apiKeys.addApiKey(name, source.trim(), t, key)
    res.status(201).json({ hash: entry.hash, name: entry.name, source: entry.source, type: entry.type, createdAt: entry.createdAt })
  } catch (e) {
    res.status(409).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

router.put('/:hash', requireAuth, checkAdmin, (req, res) => {
  const { hash } = req.params
  const { name, source, type, key } = req.body
  const data: { name?: string; source?: string; type?: ApiKeyType; key?: string | Record<string, unknown> } = {}
  if (name !== undefined) data.name = name
  if (source !== undefined) data.source = source
    if (type !== undefined && ['jwt', 'api_key', 'secret_client', 'token_json', 'piano_esp'].includes(type)) data.type = type as ApiKeyType
  if (key !== undefined && key !== null) data.key = key
  try {
    const updated = apiKeys.updateApiKey(hash, data)
    if (!updated) {
      res.status(404).json({ error: 'API key non trovata' })
      return
    }
    res.json({ hash: updated.hash, name: updated.name, source: updated.source, type: updated.type, createdAt: updated.createdAt })
  } catch (e) {
    res.status(409).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

router.delete('/:hash', requireAuth, checkAdmin, (req, res) => {
  const { hash } = req.params
  if (!apiKeys.deleteApiKey(hash)) {
    res.status(404).json({ error: 'API key non trovata' })
    return
  }
  res.status(204).send()
})

export default router
