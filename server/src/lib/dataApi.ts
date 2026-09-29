import net from 'node:net'
import { DATA_API_BASE_URL } from '../config.js'

/** Finestra di freschezza in secondi. Dopo, la risposta resta servita dalla cache e viene aggiornata in background. */
const FRESH_MS = Math.max(1, Number(process.env.DATA_API_CACHE_TTL_SECONDS ?? 300) || 300) * 1000
/** La chiave Redis vive più a lungo della finestra, così si può servire il dato vecchio senza attesa. */
const KEY_TTL_SECONDS = Math.max(60, Number(process.env.DATA_API_CACHE_KEY_TTL_SECONDS ?? 86_400))

type CacheEntry = { fetchedAt: number; body: unknown }

const inflight = new Map<string, Promise<unknown>>()

function cacheKey(url: string): string {
  return `coesione:data-api:${url}`
}

function encodeCommand(args: string[]): Buffer {
  const chunks: Buffer[] = [Buffer.from(`*${args.length}\r\n`)]
  for (const arg of args) {
    const bytes = Buffer.from(arg)
    chunks.push(Buffer.from(`$${bytes.length}\r\n`))
    chunks.push(bytes)
    chunks.push(Buffer.from('\r\n'))
  }
  return Buffer.concat(chunks)
}

type Parsed = { value: string | null; rest: Buffer }

function tryParse(buf: Buffer): Parsed | null {
  if (buf.length < 1) return null
  const type = String.fromCharCode(buf[0]!)
  const crlf = buf.indexOf('\r\n')
  if (crlf < 0) return null
  const head = buf.subarray(1, crlf).toString()
  if (type === '+' || type === ':') {
    return { value: head, rest: buf.subarray(crlf + 2) }
  }
  if (type === '-') {
    throw new Error(head)
  }
  if (type === '$') {
    const len = Number(head)
    if (len < 0) return { value: null, rest: buf.subarray(crlf + 2) }
    const start = crlf + 2
    if (buf.length < start + len + 2) return null
    return {
      value: buf.subarray(start, start + len).toString(),
      rest: buf.subarray(start + len + 2),
    }
  }
  throw new Error(`Risposta Redis non supportata: ${type}`)
}

class RedisCache {
  private socket: net.Socket | null = null
  private buffer = Buffer.alloc(0)
  private pending: Array<{ resolve: (v: string | null) => void; reject: (e: Error) => void }> = []
  private connectPromise: Promise<boolean> | null = null
  private disabledUntil = 0

  private url(): URL | null {
    const raw = process.env.REDIS_URL?.trim()
    if (!raw) return null
    try {
      return new URL(raw)
    } catch {
      return null
    }
  }

  private failAll(error: Error): void {
    const queued = this.pending
    this.pending = []
    this.buffer = Buffer.alloc(0)
    this.socket?.destroy()
    this.socket = null
    this.disabledUntil = Date.now() + 15_000
    for (const item of queued) item.reject(error)
  }

  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk])
    try {
      while (this.pending.length > 0) {
        const parsed = tryParse(this.buffer)
        if (!parsed) return
        this.buffer = parsed.rest
        const item = this.pending.shift()
        item?.resolve(parsed.value)
      }
    } catch (error) {
      this.failAll(error instanceof Error ? error : new Error(String(error)))
    }
  }

  private async ensure(): Promise<boolean> {
    if (Date.now() < this.disabledUntil) return false
    const target = this.url()
    if (!target) return false
    if (this.socket && !this.socket.destroyed) return true
    if (this.connectPromise) return this.connectPromise

    this.connectPromise = new Promise<boolean>((resolve) => {
      const socket = net.connect({
        host: target.hostname,
        port: Number(target.port || 6379),
      })
      const timer = setTimeout(() => {
        socket.destroy()
        this.disabledUntil = Date.now() + 15_000
        resolve(false)
      }, 800)
      socket.once('connect', () => {
        clearTimeout(timer)
        this.socket = socket
        socket.on('data', (chunk) => this.onData(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        socket.on('error', (error) => this.failAll(error))
        socket.on('close', () => {
          if (this.socket === socket) this.socket = null
        })
        resolve(true)
      })
      socket.once('error', () => {
        clearTimeout(timer)
        this.disabledUntil = Date.now() + 15_000
        resolve(false)
      })
    }).finally(() => {
      this.connectPromise = null
    })

    return this.connectPromise
  }

  async command(args: string[]): Promise<string | null> {
    const ok = await this.ensure()
    if (!ok || !this.socket) return null
    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject })
      this.socket?.write(encodeCommand(args))
    })
  }
}

const redis = new RedisCache()

/** True se nel JSON c'è almeno un numero > 0. Gli zeri non si mettono in Redis. */
export function hasPositiveNumber(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0
  if (typeof value === 'string') {
    const n = Number(value)
    return value.trim() !== '' && Number.isFinite(n) && n > 0
  }
  if (Array.isArray(value)) return value.some((item) => hasPositiveNumber(item))
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((item) => hasPositiveNumber(item))
  }
  return false
}

async function readCache(url: string): Promise<CacheEntry | null> {
  try {
    const key = cacheKey(url)
    const raw = await redis.command(['GET', key])
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed || typeof parsed.fetchedAt !== 'number' || !('body' in parsed)) return null
    if (!hasPositiveNumber(parsed.body)) {
      await redis.command(['DEL', key])
      return null
    }
    return parsed
  } catch {
    return null
  }
}

async function writeCache(url: string, body: unknown): Promise<void> {
  const key = cacheKey(url)
  try {
    if (!hasPositiveNumber(body)) {
      await redis.command(['DEL', key])
      return
    }
    const payload = JSON.stringify({ fetchedAt: Date.now(), body })
    await redis.command(['SET', key, payload, 'EX', String(KEY_TTL_SECONDS)])
  } catch {
    // La risposta live resta valida anche se Redis non accetta la scrittura.
  }
}

async function fetchLive(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Data API error: ${res.status} ${res.statusText}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

function refresh(url: string, timeoutMs: number): Promise<unknown> {
  const existing = inflight.get(url)
  if (existing) return existing
  const job = fetchLive(url, timeoutMs)
    .then(async (body) => {
      await writeCache(url, body)
      return body
    })
    .finally(() => {
      inflight.delete(url)
    })
  inflight.set(url, job)
  return job
}

/**
 * GET verso il data API.
 * Se Redis ha un valore fresco lo restituisce subito.
 * Se è scaduto lo restituisce subito e lo aggiorna in background.
 */
export async function fetchDataApiJson(url: string, timeoutMs = 20000): Promise<unknown> {
  const cached = await readCache(url)
  if (cached && Date.now() - cached.fetchedAt < FRESH_MS) {
    return cached.body
  }
  if (cached) {
    void refresh(url, timeoutMs).catch((error) => {
      console.error('Refresh cache data API fallito:', url, error)
    })
    return cached.body
  }
  return refresh(url, timeoutMs)
}

export function dataApiUrl(pathWithQuery: string, baseUrl = DATA_API_BASE_URL): string {
  if (pathWithQuery.startsWith('http://') || pathWithQuery.startsWith('https://')) return pathWithQuery
  return `${baseUrl}${pathWithQuery}`
}
