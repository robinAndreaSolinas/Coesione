import type { Request, Response, NextFunction } from 'express'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import * as publishers from '../lib/piano-publishers.js'

const router = Router()

function checkAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Non autenticato' })
    return
  }
  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined
  if (row?.role !== 'Admin') {
    res.status(403).json({ error: 'Solo gli Admin possono gestire i publisher' })
    return
  }
  next()
}

router.get('/', requireAuth, checkAdmin, (_req, res) => {
  const list = publishers.listPublishers()
  res.json(list.map((p) => ({ id: p.id, name: p.name, siteId: p.siteId, baseUrl: p.baseUrl, createdAt: p.createdAt })))
})

router.post('/', requireAuth, checkAdmin, (req, res) => {
  const { name, siteId, apiKey, baseUrl } = req.body
  if (!name || !siteId || !apiKey || !baseUrl) {
    res.status(400).json({ error: 'Nome, siteId, apiKey e baseUrl richiesti' })
    return
  }
  const validUrls = ['https://api-esp.piano.io', 'https://api-esp-eu.piano.io', 'http://sandbox-api-esp.piano.io']
  if (!validUrls.includes(baseUrl)) {
    res.status(400).json({ error: 'baseUrl non valido' })
    return
  }
  try {
    const publisher = publishers.addPublisher(name, siteId, apiKey, baseUrl)
    res.status(201).json({ id: publisher.id, name: publisher.name, siteId: publisher.siteId, baseUrl: publisher.baseUrl, createdAt: publisher.createdAt })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

router.put('/:id', requireAuth, checkAdmin, (req, res) => {
  const { id } = req.params
  const { name, siteId, apiKey, baseUrl } = req.body
  const data: {
    name?: string
    siteId?: string
    apiKey?: string
    baseUrl?: publishers.PianoPublisher['baseUrl']
  } = {}
  if (name !== undefined) data.name = name
  if (siteId !== undefined) data.siteId = siteId
  if (apiKey !== undefined) data.apiKey = apiKey
  if (baseUrl !== undefined) {
    const validUrls: publishers.PianoPublisher['baseUrl'][] = [
      'https://api-esp.piano.io',
      'https://api-esp-eu.piano.io',
      'http://sandbox-api-esp.piano.io',
    ]
    if (!validUrls.includes(baseUrl)) {
      res.status(400).json({ error: 'baseUrl non valido' })
      return
    }
    data.baseUrl = baseUrl
  }
  try {
    const updated = publishers.updatePublisher(id, data)
    if (!updated) {
      res.status(404).json({ error: 'Publisher non trovato' })
      return
    }
    res.json({ id: updated.id, name: updated.name, siteId: updated.siteId, baseUrl: updated.baseUrl, createdAt: updated.createdAt })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

router.delete('/:id', requireAuth, checkAdmin, (req, res) => {
  const { id } = req.params
  if (!publishers.deletePublisher(id)) {
    res.status(404).json({ error: 'Publisher non trovato' })
    return
  }
  res.status(204).send()
})

export default router
