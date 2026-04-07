import type { Request, Response } from 'express'
import { Router } from 'express'
import { DATA_API_BASE_URL, getDefaultStartDate, getDefaultEndDate } from '../config.js'

declare const fetch: (
  url: string,
  options?: {
    method?: string
    headers?: Record<string, string>
  }
) => Promise<{
  ok: boolean
  status: number
  statusText: string
  json(): Promise<unknown>
}>

interface RawVideoStat {
  date: string
  stream: number
  estimated_earings: number
  vth?: number
  view_through_rate?: number
  watched_seconds: number
}

interface RawVideoStatsResponse {
  success: boolean
  data: RawVideoStat[]
  error?: unknown
  timestamp?: string
}

export interface VideoDailyPoint {
  date: string
  stream: number
  vth: number
  watchedSeconds: number
}

export interface VideoStatsPayload {
  audience: number
  minutesWatched: number
  vthAvg: number
  audiovisualCount: number
  daily: VideoDailyPoint[]
}

const router = Router()

function getDateRange(): { start: string; end: string } {
  const start = getDefaultStartDate()
  const end = getDefaultEndDate()
  return { start, end }
}

async function fetchJson<T>(pathWithQuery: string): Promise<T> {
  const url = `${DATA_API_BASE_URL}${pathWithQuery}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Data API error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data as T
}

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const { start, end } = getDateRange()
    const path = `/api/v1/video/stats?from_date=${start}&to_date=${end}`
    const resp = await fetchJson<RawVideoStatsResponse>(path)
    const audiovisualCount = await fetchJson<number>('/api/v1/video/count').catch(() => 0)

    if (!resp.success || !Array.isArray(resp.data)) {
      res.status(502).json({ error: 'Risposta non valida dal data API' })
      return
    }

    const rows = [...resp.data].sort((a, b) => a.date.localeCompare(b.date))

    let totalStreams = 0
    let totalWatchedSeconds = 0
    let vthSum = 0
    let vthCount = 0

    const daily: VideoDailyPoint[] = rows.map((r) => {
      const vthValue =
        typeof r.view_through_rate === 'number'
          ? r.view_through_rate
          : typeof r.vth === 'number'
            ? r.vth
            : 0
      totalStreams += r.stream
      totalWatchedSeconds += r.watched_seconds
      if (Number.isFinite(vthValue)) {
        vthSum += vthValue
        vthCount += 1
      }
      
      return {
        date: r.date,
        stream: r.stream,
        vth: vthValue,
        watchedSeconds: r.watched_seconds,
      }
    })

    const minutesWatched = totalWatchedSeconds / 60
    const vthAvg = vthCount > 0 ? vthSum / vthCount : 0

    const payload: VideoStatsPayload = {
      audience: totalStreams,
      minutesWatched,
      vthAvg,
      audiovisualCount: Number(audiovisualCount) || 0,
      daily,
    }

    res.json(payload)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router

