import type { Request, Response } from 'express'
import { Router } from 'express'
import { DATA_API_BASE_URL, getDefaultStartDate, getDefaultEndDate } from '../config.js'
import { warn } from 'node:console'

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

async function getNewsletterStats(start: string, end: string): Promise<{
  openRate: number
  clickRate: number
  subscribersTotal: number
  subscribersActive: number
  daily: {
    day: string
    openRate: number
    clickRate: number
    subscribersTotal: number
  }[]
}> {
  const path = `/api/v1/newsletter/stats?from_date=${start}&to_date=${end}`
  const resp = await fetchJson<NewsletterStatsResponse>(path)
  const rows = resp?.data
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      openRate: 0,
      clickRate: 0,
      subscribersTotal: 0,
      subscribersActive: 0,
      daily: [],
    }
  }

  // Aggregato complessivo
  let totalSent = 0
  let totalOpen = 0
  let totalClick = 0
  let totalAddSubs = 0
  let totalDelSubs = 0

  // Aggregazione per giorno
  const byDay = new Map<string, { sent: number; open: number; click: number; addSubs: number; delSubs: number }>()

  for (const r of rows) {
    totalSent += r.sent
    totalOpen += r.open
    totalClick += r.click
    totalAddSubs += r.add_subs
    totalDelSubs += r.del_subs

    const key = r.day
    const current = byDay.get(key) ?? { sent: 0, open: 0, click: 0, addSubs: 0, delSubs: 0 }
    current.sent += r.sent
    current.open += r.open
    current.click += r.click
    current.addSubs += r.add_subs
    current.delSubs += r.del_subs
    byDay.set(key, current)
  }

  const openRateFractionRaw = totalSent > 0 ? totalOpen / totalSent : 0
  const clickRateFractionRaw = totalSent > 0 ? totalClick / totalSent : 0
  const openRateFraction = Math.min(openRateFractionRaw, 1)
  const clickRateFraction = Math.min(clickRateFractionRaw, 1)

  const subscribersTotal = totalAddSubs
  const subscribersActive = Math.max(subscribersTotal - totalDelSubs, 0)

  // Serie giornaliera (crescita iscritti e performance)
  const sortedDays = Array.from(byDay.entries()).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  let cumulativeSubs = 0
  const daily = sortedDays.map(([day, v]) => {
    cumulativeSubs += v.addSubs - v.delSubs
    const dayOpenRateRaw = v.sent > 0 ? (v.open / v.sent) * 100 : 0
    const dayClickRateRaw = v.sent > 0 ? (v.click / v.sent) * 100 : 0
    const dayOpenRate = Math.min(dayOpenRateRaw, 100)
    const dayClickRate = Math.min(dayClickRateRaw, 100)
    return {
      day,
      openRate: Number(dayOpenRate.toFixed(1)),
      clickRate: Number(dayClickRate.toFixed(1)),
      subscribersTotal: cumulativeSubs,
    }
  })

  return {
    openRate: Number((openRateFraction * 100).toFixed(1)),
    clickRate: Number((clickRateFraction * 100).toFixed(1)),
    subscribersTotal,
    subscribersActive,
    daily,
  }
}

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const { start, end } = getDateRange()
    const { daily, ...summary } = await getNewsletterStats(start, end)
    res.json(summary)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

router.get('/metrics/daily', async (_req: Request, res: Response) => {
  try {
    const { start, end } = getDateRange()
    const { daily } = await getNewsletterStats(start, end)
    res.json(daily)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router
