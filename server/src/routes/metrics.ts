import type { Request, Response } from 'express'
import { Router } from 'express'
import { db } from '../db/index.js'
import { DATA_API_BASE_URL, getDefaultStartDate, getDefaultEndDate } from '../config.js'
import {
  currentForSocialObjective,
  fetchSocialPlatforms,
  fetchSocialSummary,
} from '../lib/socialData.js'
import { fetchSondaggiAggregates } from '../lib/sondaggiData.js'
import { fetchNewsletterCountSent } from '../lib/newsletterData.js'

declare const fetch: (
  url: string,
  options?: {
    method?: string
    headers?: Record<string, string>
    signal?: AbortSignal
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
  sentCount: number
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
  articlesPrinted: number
  articlesDigital: number
}

interface SiteStatsBySourceEntry {
  publish_date: string
  count_url: number
  pageview: number
}

interface SiteSourceItem {
  source: string
  total_count_url: number
  total_pageview: number
  by_date: SiteStatsBySourceEntry[]
}

interface SiteStatsBySourceData {
  total: SiteTotalStats
  sources: SiteSourceItem[]
}

interface SiteStatsBySourceResponse {
  success: boolean
  data?: SiteStatsBySourceData
  error?: unknown
  timestamp?: string
}

interface SondaggiAggregates {
  surveysCount: number
  participantsCount: number
  totalResponses: number
  engagementRatePercent: number
}

interface VideoAggregates {
  audience: number
  minutesWatched: number
  completionRateFraction: number
  audiovisualCount: number
}

interface RawVideoStat {
  date: string
  stream: number
  watched_seconds: number
  vth?: number
  view_through_rate?: number
}

interface SiteUniqueUserResponse {
  success: boolean
  data?: unknown
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

async function getNewsletterAggregates(start: string, end: string): Promise<NewsletterAggregates | null> {
  const ratePath = `/api/v1/newsletter/rate?from_date=${start}&to_date=${end}`
  const statsPath = `/api/v1/newsletter/stats?from_date=${start}&to_date=${end}`

  const [rateResp, statsResp, sentCount] = await Promise.all([
    fetchJson<NewsletterRateResponse>(ratePath),
    fetchJson<NewsletterStatsResponse>(statsPath),
    fetchNewsletterCountSent(DATA_API_BASE_URL),
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

  return { openRateFraction, clickRateFraction, subscribersTotal, subscribersActive, sentCount }
}

async function getSiteAggregates(start: string, end: string): Promise<SiteAggregates | null> {
  const statsPath = `/api/v1/site/stats?from_date=${start}&to_date=${end}`
  const bySourcePath = `/api/v1/site/stats/by-source?from_date=${start}&to_date=${end}`

  const [statsResp, bySourceResp] = await Promise.all([
    fetchJson<SiteStatsResponse>(statsPath),
    fetchJson<SiteStatsBySourceResponse>(bySourcePath),
  ])

  if (!statsResp?.success || !statsResp.data) {
    return null
  }

  const total = statsResp.data.total
  if (!total) {
    return null
  }

  const articlesPublished = total.count_url
  const pageviews = total.pageview

  let articlesPrinted = 0
  let articlesDigital = 0

  if (bySourceResp?.success && bySourceResp.data && Array.isArray(bySourceResp.data.sources)) {
    for (const src of bySourceResp.data.sources) {
      if (src.source === 'carta') {
        articlesPrinted += src.total_count_url
      } else {
        articlesDigital += src.total_count_url
      }
    }
  }

  let uniqueUsers = 0
  try {
    const uniquePath = `/api/v1/site/unique-user?from_date=${start}&to_date=${end}`
    const uniqueResp = await fetchJson<SiteUniqueUserResponse>(uniquePath)
    if (uniqueResp?.success && uniqueResp.data) {
      const outerData = uniqueResp.data as {
        success?: boolean
        data?: { month_avg?: number }
      }
      const inner = outerData?.data
      if (inner && inner.month_avg != null) {
        uniqueUsers = Number(inner.month_avg) || 0
      }
    }
  } catch (e) {
    console.error('Error fetching site unique users from data API:', e)
    uniqueUsers = 0
  }

  return {
    uniqueUsers,
    pageviews,
    articlesPublished,
    articlesPrinted,
    articlesDigital,
  }
}

async function getSondaggiAggregates(): Promise<SondaggiAggregates | null> {
  return fetchSondaggiAggregates(DATA_API_BASE_URL)
}

async function getSocialAggregates(): Promise<{
  summary: Awaited<ReturnType<typeof fetchSocialSummary>>
  platforms: Awaited<ReturnType<typeof fetchSocialPlatforms>>
} | null> {
  try {
    const [summary, platforms] = await Promise.all([fetchSocialSummary(), fetchSocialPlatforms()])
    return { summary, platforms }
  } catch (e) {
    console.error('Error fetching social aggregates:', e)
    return null
  }
}

async function getVideoAggregates(start: string, end: string): Promise<VideoAggregates | null> {
  const path = `/api/v1/video/stats?from_date=${start}&to_date=${end}`
  const resp = await fetchJson<
    | { audience: number; minutesWatched: number; vthAvg: number; audiovisualCount?: number }
    | { success?: boolean; data?: RawVideoStat[] | null }
  >(path)

  if (!resp) {
    return null
  }

  const toNum = (v: unknown): number => {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }

  // Caso 1: endpoint già aggregato (compatibilità)
  if ('audience' in resp && 'minutesWatched' in resp && 'vthAvg' in resp) {
    const countResp = await fetchJson<number>('/api/v1/video/count').catch(() => 0)
    return {
      audience: toNum(resp.audience),
      minutesWatched: toNum(resp.minutesWatched),
      completionRateFraction: toNum(resp.vthAvg),
      audiovisualCount: toNum(resp.audiovisualCount) || toNum(countResp),
    }
  }

  // Caso 2: payload raw Data API { success, data: [...] }
  const rows = Array.isArray(resp.data) ? resp.data : []
  let totalStreams = 0
  let totalWatchedSeconds = 0
  let vthSum = 0
  let vthCount = 0
  for (const r of rows) {
    totalStreams += toNum(r.stream)
    totalWatchedSeconds += toNum(r.watched_seconds)
    const vth =
      typeof r.view_through_rate === 'number'
        ? r.view_through_rate
        : typeof r.vth === 'number'
          ? r.vth
          : NaN
    if (Number.isFinite(vth)) {
      vthSum += vth
      vthCount += 1
    }
  }
  const countResp = await fetchJson<number>('/api/v1/video/count').catch(() => 0)

  return {
    audience: totalStreams,
    minutesWatched: totalWatchedSeconds / 60,
    completionRateFraction: vthCount > 0 ? vthSum / vthCount : 0,
    audiovisualCount: toNum(countResp),
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
    let sondaggiAgg: SondaggiAggregates | null = null
    let socialData: Awaited<ReturnType<typeof getSocialAggregates>> = null
    let videoAgg: VideoAggregates | null = null
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

    try {
      sondaggiAgg = await getSondaggiAggregates()
    } catch (e) {
      console.error('Error fetching sondaggi stats from data API:', e)
    }

    try {
      socialData = await getSocialAggregates()
    } catch (e) {
      console.error('Error fetching social stats from data API:', e)
    }

    try {
      videoAgg = await getVideoAggregates(start, end)
    } catch (e) {
      console.error('Error fetching video stats from data API:', e)
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
          case 'newsletter-subscribers-active':
            current = newsletterAgg.subscribersActive
            break
          case 'newsletter-sent':
            current = newsletterAgg.sentCount
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
            current =
              siteAgg.articlesPublished > 0
                ? siteAgg.pageviews / siteAgg.articlesPublished
                : 0
            break
          case 'articles-published-count':
            current = siteAgg.articlesPublished
            break
          case 'articles-printed-count':
            current = siteAgg.articlesPrinted
            break
          case 'articles-digital-count':
            current = siteAgg.articlesDigital
            break
          default:
            current = 0
        }
      } else if (obj.category === 'sondaggi' && sondaggiAgg) {
        switch (obj.id) {
          case 'surveys-count':
            current = sondaggiAgg.surveysCount
            break
          case 'surveys-total-responses':
            current = sondaggiAgg.totalResponses
            break
          case 'surveys-participants-count':
            current = sondaggiAgg.participantsCount
            break
          case 'sondaggi-engagement-rate':
            current = sondaggiAgg.engagementRatePercent / 100
            break
          default:
            current = 0
        }
      } else if (obj.category === 'social' && socialData) {
        const mapped = currentForSocialObjective(obj.id, socialData.summary, socialData.platforms)
        if (mapped !== null) {
          current = mapped
        }
      } else if (obj.category === 'video' && videoAgg) {
        switch (obj.id) {
          case 'video-audiovisual-count':
            current = videoAgg.audiovisualCount
            break
          case 'video-audience':
            current = videoAgg.audience
            break
          case 'video-minutes-watched':
            current = videoAgg.minutesWatched
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

export default router

