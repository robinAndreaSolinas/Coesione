import type { Request, Response } from 'express'
import { Router } from 'express'
import { db } from '../db/index.js'
import { DATA_API_BASE_URL, getDefaultStartDate, getDefaultEndDate } from '../config.js'

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
  totalResponses: number
  completionRateFraction: number
  averageResponses: number
}

interface SocialAggregates {
  engagementRatePercent: number
  viewsTotal: number
  audienceTotal: number
  sharesTotal: number
  commentsTotal: number
  postsCount: number
}

interface VideoAggregates {
  audience: number
  minutesWatched: number
  completionRateFraction: number
  audiovisualCount: number
}

interface LogoraStats {
  cohesion_sources: number
  total_groups: number
  total_messages: number
  total_participants: number
  total_consultations: number
  total_proposals: number
  total_votes: number
}

interface LogoraStatsResponse {
  success: boolean
  data?: LogoraStats | null
  error?: unknown
  timestamp?: string
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
  const path = `/api/v1/sondaggi/stats`
  const resp = await fetchJson<LogoraStatsResponse>(path)
  if (!resp?.success || !resp.data) {
    return null
  }

  const stats = resp.data

  const surveysCount = stats.total_consultations || stats.total_groups || 0
  const totalResponses = stats.total_votes || stats.total_messages || 0
  const completionRateFraction =
    stats.total_participants > 0 ? Math.min(totalResponses / stats.total_participants, 1) : 0
  const averageResponses = surveysCount > 0 ? totalResponses / surveysCount : 0

  return {
    surveysCount,
    totalResponses,
    completionRateFraction,
    averageResponses,
  }
}

async function getSocialAggregates(): Promise<SocialAggregates | null> {
  // Il Data API NON espone `/api/v1/social/summary`, quindi calcoliamo qui
  // gli aggregati usando le rotte social raw.
  type SocialAggregate = {
    total_engagements?: number
    total_reach?: number
    total_views?: number
    total_shares?: number
    total_comments?: number
  }

  const safeNumber = (v: unknown): number => {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }

  const denomForAudience = (a: SocialAggregate): number => {
    const reach = safeNumber(a.total_reach)
    if (reach > 0) return reach
    return safeNumber(a.total_views)
  }

  type ApiResponse<T> = {
    success?: boolean
    data?: T | null
  }

  const timeoutMs = 15000
  const fetchJsonWithTimeout = async <T,>(path: string): Promise<T | null> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const url = `${DATA_API_BASE_URL}${path}`
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) return null
      const json = (await res.json()) as ApiResponse<T>
      return json?.success ? (json.data as T | null) : null
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }

  const [fb, yt, ig, other] = await Promise.all([
    fetchJsonWithTimeout<SocialAggregate>('/api/v1/social/facebook/stats'),
    fetchJsonWithTimeout<SocialAggregate>('/api/v1/social/youtube/stats'),
    fetchJsonWithTimeout<SocialAggregate>('/api/v1/social/instagram/stats'),
    fetchJsonWithTimeout<SocialAggregate>('/api/v1/social/other/stats'),
  ])

  const fetchNumberWithTimeout = async (path: string): Promise<number> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const url = `${DATA_API_BASE_URL}${path}`
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) return 0
      const n = await res.json()
      return safeNumber(n)
    } catch {
      return 0
    } finally {
      clearTimeout(timeout)
    }
  }

  const postsCount = await fetchNumberWithTimeout('/api/v1/social/post/count')

  const all = [fb, yt, ig, other].filter(Boolean) as SocialAggregate[]
  if (all.length === 0) {
    return {
      engagementRatePercent: 0,
      viewsTotal: 0,
      audienceTotal: 0,
      sharesTotal: 0,
      commentsTotal: 0,
      postsCount,
    }
  }

  let interactionsTotal = 0
  let viewsTotal = 0
  let audienceTotal = 0
  let sharesTotal = 0
  let commentsTotal = 0

  for (const a of all) {
    interactionsTotal += safeNumber(a.total_engagements)
    viewsTotal += safeNumber(a.total_views)
    audienceTotal += denomForAudience(a)
    sharesTotal += safeNumber(a.total_shares)
    commentsTotal += safeNumber(a.total_comments)
  }

  const engagementRateTotalPercent = audienceTotal > 0 ? (interactionsTotal / audienceTotal) * 100 : 0

  return {
    engagementRatePercent: engagementRateTotalPercent,
    viewsTotal,
    audienceTotal,
    sharesTotal,
    commentsTotal,
    postsCount,
  }
}

async function getVideoAggregates(start: string, end: string): Promise<VideoAggregates | null> {
  const path = `/api/v1/video/stats?from_date=${start}&to_date=${end}`
  const resp = await fetchJson<{ audience: number; minutesWatched: number; vthAvg: number; audiovisualCount?: number }>(path)

  if (!resp) {
    return null
  }

  return {
    audience: Number(resp.audience) || 0,
    minutesWatched: Number(resp.minutesWatched) || 0,
    completionRateFraction: Number(resp.vthAvg) || 0,
    audiovisualCount: Number(resp.audiovisualCount) || 0,
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
    let socialAgg: SocialAggregates | null = null
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
      socialAgg = await getSocialAggregates()
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
          case 'surveys-average-responses':
            current = sondaggiAgg.averageResponses
            break
          default:
            current = 0
        }
      } else if (obj.category === 'social' && socialAgg) {
        switch (obj.id) {
          case 'social-posts-count':
            current = socialAgg.postsCount
            break
          case 'social-engagement-rate':
            // obiettivo memorizzato come frazione (0–1), API restituisce percentuale
            current = (socialAgg.engagementRatePercent || 0) / 100
            break
          case 'social-views':
            current = socialAgg.viewsTotal
            break
          case 'social-audience':
            current = socialAgg.audienceTotal
            break
          case 'social-shares':
            current = socialAgg.sharesTotal
            break
          case 'social-comments':
            current = socialAgg.commentsTotal
            break
          case 'social-reach':
            current = socialAgg.audienceTotal
            break
          default:
            current = 0
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
          case 'video-completion-rate':
            current = videoAgg.completionRateFraction
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

