import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')
const PUBLISHERS_FILE = path.join(DATA_DIR, 'piano-publishers.json')

export interface PianoPublisher {
  id: string
  name: string
  siteId: string
  apiKey: string
  baseUrl: 'https://api-esp.piano.io' | 'https://api-esp-eu.piano.io' | 'http://sandbox-api-esp.piano.io'
  createdAt: number
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadPublishers(): PianoPublisher[] {
  ensureDataDir()
  try {
    const raw = fs.readFileSync(PUBLISHERS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data.publishers) ? data.publishers : []
  } catch {
    return []
  }
}

function savePublishers(publishers: PianoPublisher[]) {
  ensureDataDir()
  fs.writeFileSync(PUBLISHERS_FILE, JSON.stringify({ publishers }, null, 2), 'utf-8')
}

export function listPublishers(): PianoPublisher[] {
  return loadPublishers()
}

export function addPublisher(name: string, siteId: string, apiKey: string, baseUrl: PianoPublisher['baseUrl']): PianoPublisher {
  const publishers = loadPublishers()
  const id = Date.now().toString()
  const publisher: PianoPublisher = {
    id,
    name: name.trim(),
    siteId: siteId.trim(),
    apiKey: apiKey.trim(),
    baseUrl,
    createdAt: Date.now(),
  }
  publishers.push(publisher)
  savePublishers(publishers)
  return publisher
}

export function updatePublisher(id: string, data: { name?: string; siteId?: string; apiKey?: string; baseUrl?: PianoPublisher['baseUrl'] }): PianoPublisher | null {
  const publishers = loadPublishers()
  const idx = publishers.findIndex((p) => p.id === id)
  if (idx < 0) return null
  if (data.name !== undefined) publishers[idx].name = data.name.trim()
  if (data.siteId !== undefined) publishers[idx].siteId = data.siteId.trim()
  if (data.apiKey !== undefined) publishers[idx].apiKey = data.apiKey.trim()
  if (data.baseUrl !== undefined) publishers[idx].baseUrl = data.baseUrl
  savePublishers(publishers)
  return publishers[idx]
}

export function deletePublisher(id: string): boolean {
  const publishers = loadPublishers()
  const filtered = publishers.filter((p) => p.id !== id)
  if (filtered.length === publishers.length) return false
  savePublishers(filtered)
  return true
}
