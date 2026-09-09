import type { Request, Response } from 'express'
import { Router } from 'express'
import { DATA_API_BASE_URL, getDefaultStartDate, getDefaultEndDate } from '../config.js'
import {
  buildCampaignRowsFromDaily,
  detectSendPeakDates,
  fetchNewsletterCountPayload,
  fetchNewsletterCountSent,
  type NewsletterDayTotals,
} from '../lib/newsletterData.js'

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

function aggregateStatsByDay(rows: NewsletterStatsItem[]): {
  byDay: Map<string, NewsletterDayTotals & { addSubs: number; delSubs: number }>
  totalSent: number
  totalOpen: number
  totalClick: number
  totalAddSubs: number
  totalDelSubs: number
} {
  const byDay = new Map<string, NewsletterDayTotals & { addSubs: number; delSubs: number }>()
  let totalSent = 0
  let totalOpen = 0
  let totalClick = 0
  let totalAddSubs = 0
  let totalDelSubs = 0

  for (const r of rows) {
    totalSent += r.sent
    totalOpen += r.open
    totalClick += r.click
    totalAddSubs += r.add_subs
    totalDelSubs += r.del_subs

    const current = byDay.get(r.day) ?? { sent: 0, open: 0, click: 0, addSubs: 0, delSubs: 0 }
    current.sent += r.sent
    current.open += r.open
    current.click += r.click
    current.addSubs += r.add_subs
    current.delSubs += r.del_subs
    byDay.set(r.day, current)
  }

  return { byDay, totalSent, totalOpen, totalClick, totalAddSubs, totalDelSubs }
}

async function getNewsletterStats(start: string, end: string): Promise<{
  openRate: number
  clickRate: number
  subscribersTotal: number
  subscribersActive: number
  sentTotal: number
  daily: {
    day: string
    sent: number
    open: number
    click: number
    openRate: number
    clickRate: number
    subscribersTotal: number
  }[]
  campaigns: ReturnType<typeof buildCampaignRowsFromDaily>
}> {
  const path = `/api/v1/newsletter/stats?from_date=${start}&to_date=${end}`
  const [resp, countPayload] = await Promise.all([
    fetchJson<NewsletterStatsResponse>(path),
    fetchNewsletterCountPayload(DATA_API_BASE_URL).catch(() => null),
  ])
  const sentTotal = countPayload ? Number(countPayload.count_sent) || 0 : await fetchNewsletterCountSent(DATA_API_BASE_URL)
  const rows = resp?.data
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      openRate: 0,
      clickRate: 0,
      subscribersTotal: 0,
      subscribersActive: 0,
      sentTotal,
      daily: [],
      campaigns: [],
    }
  }

  const { byDay, totalSent, totalOpen, totalClick, totalAddSubs, totalDelSubs } =
    aggregateStatsByDay(rows)

  const openRateFractionRaw = totalSent > 0 ? totalOpen / totalSent : 0
  const clickRateFractionRaw = totalSent > 0 ? totalClick / totalSent : 0
  const openRateFraction = Math.min(openRateFractionRaw, 1)
  const clickRateFraction = Math.min(clickRateFractionRaw, 1)

  const subscribersTotal = totalAddSubs
  const subscribersActive = Math.max(subscribersTotal - totalDelSubs, 0)

  const sortedDays = Array.from(byDay.entries()).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  let cumulativeSubs = 0
  const daily = sortedDays.map(([day, v]) => {
    cumulativeSubs += v.addSubs - v.delSubs
    const dayOpenRateRaw = v.sent > 0 ? (v.open / v.sent) * 100 : 0
    const dayClickRateRaw = v.sent > 0 ? (v.click / v.sent) * 100 : 0
    return {
      day,
      sent: v.sent,
      open: v.open,
      click: v.click,
      openRate: Number(Math.min(dayOpenRateRaw, 100).toFixed(1)),
      clickRate: Number(Math.min(dayClickRateRaw, 100).toFixed(1)),
      subscribersTotal: cumulativeSubs,
    }
  })

  const dayTotals = new Map<string, NewsletterDayTotals>()
  for (const [day, v] of byDay.entries()) {
    dayTotals.set(day, { sent: v.sent, open: v.open, click: v.click })
  }
  const peaks = detectSendPeakDates(countPayload?.data ?? [], dayTotals)
  const campaigns = buildCampaignRowsFromDaily(dayTotals, peaks)

  return {
    openRate: Number((openRateFraction * 100).toFixed(1)),
    clickRate: Number((clickRateFraction * 100).toFixed(1)),
    subscribersTotal,
    subscribersActive,
    sentTotal,
    daily,
    campaigns,
  }
}

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const { start, end } = getDateRange()
    const { daily, campaigns, ...summary } = await getNewsletterStats(start, end)
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

router.get('/campaigns', async (_req: Request, res: Response) => {
  try {
    const { start, end } = getDateRange()
    const { campaigns, openRate, clickRate } = await getNewsletterStats(start, end)
    res.json({ campaigns, openRate, clickRate })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router
