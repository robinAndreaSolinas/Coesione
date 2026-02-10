import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')
const KEYS_FILE = path.join(DATA_DIR, 'api-keys.json')

export type ApiKeyType = 'jwt' | 'api_key' | 'secret_client' | 'token_json' | 'piano_esp'

export type ApiKeyValue = string | Record<string, unknown>

export interface ApiKeyEntry {
  hash: string
  name: string
  source: string
  type: ApiKeyType
  key: ApiKeyValue
  createdAt: number
}

function computeHash(key: ApiKeyValue): string {
  const content = typeof key === 'string' ? key : JSON.stringify(key)
  return crypto.createHash('sha256').update(content).digest('hex')
}

function loadKeysRaw(): Record<string, unknown>[] {
  ensureDataDir()
  try {
    const raw = fs.readFileSync(KEYS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data.keys) ? data.keys : []
  } catch {
    return []
  }
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

const DEFAULT_TYPE: ApiKeyType = 'api_key'

function loadKeys(): ApiKeyEntry[] {
  const arr = loadKeysRaw()
  let needsSave = false
  const result = arr.map((k: Record<string, unknown>) => {
    const type = k.type && ['jwt', 'api_key', 'secret_client', 'token_json', 'piano_esp'].includes(k.type as string)
      ? (k.type as ApiKeyType)
      : DEFAULT_TYPE
    let key: ApiKeyValue = k.key as ApiKeyValue
    if (typeof key === 'string' && (type === 'secret_client' || type === 'token_json' || type === 'piano_esp')) {
      try {
        key = JSON.parse(key) as Record<string, unknown>
      } catch {
        /* keep as string */
      }
    }
    const hash = typeof k.hash === 'string' ? k.hash : (needsSave = true, computeHash(key))
    if (k.id !== undefined) needsSave = true
    const createdAt = toTimestamp(k.createdAt)
    if (typeof k.createdAt === 'string') needsSave = true
    const source = typeof k.source === 'string' ? k.source : ''
    if (k.source === undefined) needsSave = true
    return { hash, name: k.name, source, type, key, createdAt } as ApiKeyEntry
  })
  if (needsSave) saveKeys(result)
  return result
}

function toTimestamp(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') return new Date(v).getTime()
  return Date.now()
}

function saveKeys(keys: ApiKeyEntry[]) {
  ensureDataDir()
  const toSave = keys.map((k) => ({
    hash: k.hash,
    name: k.name,
    source: k.source || '',
    type: k.type,
    key: k.key,
    createdAt: typeof k.createdAt === 'number' ? k.createdAt : new Date(k.createdAt).getTime(),
  }))
  fs.writeFileSync(KEYS_FILE, JSON.stringify({ keys: toSave }, null, 2), 'utf-8')
}

export function listApiKeys(): ApiKeyEntry[] {
  return loadKeys()
}

function normalizeKey(type: ApiKeyType, key: string | Record<string, unknown>): ApiKeyValue {
  if (type === 'secret_client' || type === 'token_json' || type === 'piano_esp') {
    if (typeof key === 'object' && key !== null) return key
    if (typeof key === 'string') {
      try {
        return JSON.parse(key) as Record<string, unknown>
      } catch {
        return key
      }
    }
  }
  return typeof key === 'string' ? key : JSON.stringify(key)
}

export function addApiKey(name: string, source: string, type: ApiKeyType, key: string | Record<string, unknown>): ApiKeyEntry {
  const keys = loadKeys()
  const normalizedKey = normalizeKey(type, key)
  const hash = computeHash(normalizedKey)
  if (keys.some((k) => k.hash === hash)) {
    throw new Error('Chiave già esistente')
  }
  const entry: ApiKeyEntry = {
    hash,
    name: name.trim(),
    source: source.trim(),
    type,
    key: normalizedKey,
    createdAt: Date.now(),
  }
  keys.push(entry)
  saveKeys(keys)
  return entry
}

export function updateApiKey(hash: string, data: { name?: string; source?: string; type?: ApiKeyType; key?: string | Record<string, unknown> }): ApiKeyEntry | null {
  const keys = loadKeys()
  const idx = keys.findIndex((k) => k.hash === hash)
  if (idx < 0) return null
  if (data.name !== undefined) keys[idx].name = data.name.trim()
  if (data.source !== undefined) keys[idx].source = data.source.trim()
  if (data.type !== undefined) keys[idx].type = data.type
  if (data.key !== undefined) {
    const newKey = normalizeKey(keys[idx].type, data.key)
    const newHash = computeHash(newKey)
    if (keys.some((k, i) => i !== idx && k.hash === newHash)) {
      throw new Error('Chiave già esistente')
    }
    keys[idx].key = newKey
    keys[idx].hash = newHash
  }
  saveKeys(keys)
  return keys[idx]
}

export function deleteApiKey(hash: string): boolean {
  const keys = loadKeys()
  const filtered = keys.filter((k) => k.hash !== hash)
  if (filtered.length === keys.length) return false
  saveKeys(filtered)
  return true
}
