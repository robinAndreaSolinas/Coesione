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

interface SiteTotalStats {
  days: number
  count_url: number
  pageview: number
}

interface SiteStatsByDate {
  publish_date: string
  count_url: number
  pageview: number
}

interface SiteStatsResponse {
  success: boolean
  data: {
    total: SiteTotalStats
    by_date: SiteStatsByDate[]
  }
  error?: unknown
  timestamp?: string
}

interface SiteMetricsPayload {
  uniqueUsers: number
  pageviews: number
  articlesPublished: number
  daily: SiteStatsByDate[]
}

interface SiteUniqueUserByDate {
  eventDate: string
  uug: number
}

interface SiteUniqueUserResponse {
  success: boolean
  data?: {
    month_avg?: number
    by_date?: SiteUniqueUserByDate[]
  }
  error?: unknown
  timestamp?: string
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

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const { start, end } = getDateRange()
    const path = `/api/v1/site/stats?from_date=${start}&to_date=${end}`
    const resp = await fetchJson<SiteStatsResponse>(path)

    if (!resp.success || !resp.data || !resp.data.total) {
      res.status(502).json({ error: 'Risposta non valida dal data API' })
      return
    }

    const total = resp.data.total
    const daily = Array.isArray(resp.data.by_date) ? resp.data.by_date : []

    const payload: SiteMetricsPayload = {
      uniqueUsers: 0,
      pageviews: total.pageview,
      articlesPublished: total.count_url,
      daily,
    }

    res.json(payload)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

// Media mensile e andamento utenti unici.
// Source: `GET /api/v1/site/unique-user` (FastAPI/Data API).
router.get('/unique-user', async (_req: Request, res: Response) => {
  try {
    const { start, end } = getDateRange()
    const path = `/api/v1/site/unique-user?from_date=${start}&to_date=${end}`
    const resp = await fetchJson<SiteUniqueUserResponse>(path)

    if (!resp?.success) {
      res.status(502).json({ error: 'Risposta non valida dal data API' })
      return
    }

    res.json(resp)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router

