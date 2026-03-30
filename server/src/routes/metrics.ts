import type { Request, Response } from 'express'
import { Router } from 'express'
import { db } from '../db/index.js'
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

interface ObjectiveRow {
  id: string
  title: string
  category: string
  path: string
  value: number
  unit: string
}

interface NewsletterRateItem {
  name: string
  sent: number
  click: number
  open: number
  rate: {
    click: number
    open: number
  }
}

interface NewsletterRateResponse {
  success: boolean
  data?: {
    date: {
      from: string
      to: string
    }
    results: NewsletterRateItem[]
  }
  error: unknown
  timestamp: string
}

interface NewsletterStatsItem {
  id: number
  day: string
  name: string
  campaign_id: number
  sent: number
  click: number
  open: number
  add_subs: number
  del_subs: number
}

interface NewsletterStatsResponse {
  success: boolean
  data: NewsletterStatsItem[]
  error?: unknown
  timestamp?: string
}

interface MetricSummary {
  category: string
  key: string
  title: string
  unit: string
  goal: number
  current: number
}

interface NewsletterAggregates {
  openRateFraction: number
  clickRateFraction: number
  subscribersTotal: number
  subscribersActive: number
}

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

interface SiteAggregates {
  uniqueUsers: number
  pageviews: number
  articlesPublished: number
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

async function getNewsletterAggregates(start: string, end: string): Promise<NewsletterAggregates | null> {
  const ratePath = `/api/v1/newsletter/rate?from_date=${start}&to_date=${end}`
  const statsPath = `/api/v1/newsletter/stats?from_date=${start}&to_date=${end}`

  const [rateResp, statsResp] = await Promise.all([
    fetchJson<NewsletterRateResponse>(ratePath),
    fetchJson<NewsletterStatsResponse>(statsPath),
  ])

  const rows = rateResp?.data?.results
  if (!Array.isArray(rows) || rows.length === 0) {
    return null
  }

  let totalSent = 0
  let totalOpen = 0
  let totalClick = 0

  for (const r of rows) {
    totalSent += r.sent
    totalOpen += r.open
    totalClick += r.click
  }

  const openRateFractionRaw = totalSent > 0 ? totalOpen / totalSent : 0
  const clickRateFractionRaw = totalSent > 0 ? totalClick / totalSent : 0
  const openRateFraction = Math.min(openRateFractionRaw, 1)
  const clickRateFraction = Math.min(clickRateFractionRaw, 1)

  let subscribersTotal = 0
  let subscribersActive = 0

  const statsRows = statsResp?.data
  if (Array.isArray(statsRows) && statsRows.length > 0) {
    let addSubs = 0
    let delSubs = 0
    for (const r of statsRows) {
      addSubs += r.add_subs
      delSubs += r.del_subs
    }
    subscribersTotal = addSubs
    subscribersActive = Math.max(subscribersTotal - delSubs, 0)
  }

  return { openRateFraction, clickRateFraction, subscribersTotal, subscribersActive }
}

async function getSiteAggregates(start: string, end: string): Promise<SiteAggregates | null> {
  const path = `/api/v1/site/stats?from_date=${start}&to_date=${end}`
  const resp = await fetchJson<SiteStatsResponse>(path)
  if (!resp?.success || !resp.data) {
    return null
  }

  const total = resp.data.total
  if (!total) {
    return null
  }

  const articlesPublished = total.count_url
  const pageviews = total.pageview
  const uniqueUsers = 0

  return {
    uniqueUsers,
    pageviews,
    articlesPublished,
  }
}

async function handleSummary(_req: Request, res: Response) {
  try {
    const { start, end } = getDateRange()

    const objectives = db
      .prepare(
        'SELECT id, title, category, path, value, unit FROM objectives ORDER BY category, id'
      )
      .all() as ObjectiveRow[]

    let newsletterAgg: NewsletterAggregates | null = null
    let siteAgg: SiteAggregates | null = null
    try {
      newsletterAgg = await getNewsletterAggregates(start, end)
    } catch (e) {
      console.error('Error fetching newsletter stats from data API:', e)
    }

    try {
      siteAgg = await getSiteAggregates(start, end)
    } catch (e) {
      console.error('Error fetching site stats from data API:', e)
    }

    const result: MetricSummary[] = objectives.map((obj) => {
      let current = 0

      if (obj.category === 'newsletter' && newsletterAgg) {
        switch (obj.id) {
          case 'newsletter-open-rate':
            current = newsletterAgg.openRateFraction
            break
          case 'newsletter-click-rate':
            current = newsletterAgg.clickRateFraction
            break
          case 'newsletter-subscribers-total':
            current = newsletterAgg.subscribersTotal
            break
          case 'newsletter-subscribers-active':
            current = newsletterAgg.subscribersActive
            break
          default:
            current = 0
        }
      } else if (obj.category === 'siti' && siteAgg) {
        switch (obj.id) {
          case 'articles-unique-users':
            current = siteAgg.uniqueUsers
            break
          case 'articles-pageviews':
            current = siteAgg.pageviews
            break
          case 'articles-published-count':
            current = siteAgg.articlesPublished
            break
          default:
            current = 0
        }
      }

      return {
        category: obj.category,
        key: obj.id,
        title: obj.title,
        unit: obj.unit,
        goal: obj.value,
        current,
      }
    })

    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
}

router.get('/summary', handleSummary)
router.get('/summary2', handleSummary)

export default router

