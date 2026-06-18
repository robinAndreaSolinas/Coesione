import type { Request, Response } from 'express'
import { Router } from 'express'
import { DATA_API_BASE_URL, getDefaultStartDate, getDefaultEndDate } from '../config.js'
import { fetchSiteStatsCount } from '../lib/siteData.js'

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

interface SiteMetricsPayload {
  uniqueUsers: number
  pageviews: number
  articlesDigitalCount: number
  articlesPrintedCount: number
  articlesPublishedCount: number
}

interface SiteUniqueUserByDate {
  eventDate: string
  uug: number
}

interface SiteUniqueUserResponseRaw {
  success: boolean
  data?: {
    success?: boolean
    data?: {
      month_avg?: number
      by_date?: SiteUniqueUserByDate[]
    }
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
    const uniquePath = `/api/v1/site/unique-user?from_date=${start}&to_date=${end}`

    const [countAgg, uniqueResp] = await Promise.all([
      fetchSiteStatsCount(),
      fetchJson<SiteUniqueUserResponseRaw>(uniquePath),
    ])

    let uniqueUsers = 0
    const uniqueOuter = uniqueResp?.data
    const uniqueInner = uniqueOuter?.data
    if (uniqueInner && uniqueInner.month_avg != null) {
      uniqueUsers = Number(uniqueInner.month_avg) || 0
    }

    const payload: SiteMetricsPayload = {
      uniqueUsers,
      pageviews: countAgg.totalPageview,
      articlesDigitalCount: countAgg.articlesDigitalCount,
      articlesPrintedCount: countAgg.articlesPrintedCount,
      articlesPublishedCount: countAgg.articlesPublishedCount,
    }

    res.json(payload)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

router.get('/stats/count', async (_req: Request, res: Response) => {
  try {
    const agg = await fetchSiteStatsCount()
    res.json({
      success: true,
      data: {
        total_count_url: agg.articlesDigitalCount,
        total_pageview: agg.totalPageview,
        articles_published_count: agg.articlesPublishedCount,
      },
    })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

router.get('/unique-user', async (_req: Request, res: Response) => {
  try {
    const { start, end } = getDateRange()
    const path = `/api/v1/site/unique-user?from_date=${start}&to_date=${end}`
    const resp = await fetchJson<SiteUniqueUserResponseRaw>(path)

    if (!resp?.success || !resp.data) {
      res.status(502).json({ error: 'Risposta non valida dal data API' })
      return
    }
    const inner = resp.data.data ?? {}

    res.json({
      success: true,
      data: inner,
      timestamp: resp.timestamp,
    })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router
