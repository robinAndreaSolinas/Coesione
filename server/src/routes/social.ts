import type { Request, Response } from 'express'
import { Router } from 'express'
import { DATA_API_BASE_URL } from '../config.js'

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

type ApiResponse<T> = {
  success: boolean
  data?: T | null
  error?: unknown
  timestamp?: string
}

type SocialAggregate = {
  total_engagements?: number
  total_interaction?: number
  total_reach?: number
  total_views?: number
  total_shares?: number
  total_comments?: number
  engagement_rate?: number
}

type SocialSummaryData = {
  interactionsTotal: number
  audienceTotal: number
  viewsTotal: number
  sharesTotal: number
  commentsTotal: number
  engagementRateTotalPercent: number
  postsCount: number
}

type SocialPlatformPoint = {
  reach: number
  engagementRatePercent: number
}

type SocialPlatformsData = {
  facebook: SocialPlatformPoint
  instagram: SocialPlatformPoint
  youtube: SocialPlatformPoint
  tiktok: SocialPlatformPoint
}

const router = Router()

async function fetchJson<T>(pathWithQuery: string, timeoutMs: number): Promise<T> {
  const url = `${DATA_API_BASE_URL}${pathWithQuery}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Data API error: ${res.status} ${res.statusText}`)
    }
    const data = await res.json()
    return data as T
  } finally {
    clearTimeout(timeout)
  }
}

function safeNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function denomForAudience(a: SocialAggregate): number {
  const reach = safeNumber(a.total_reach)
  if (reach > 0) return reach
  return safeNumber(a.total_views)
}

function toPlatformPoint(a: SocialAggregate | null): SocialPlatformPoint {
  if (!a) return { reach: 0, engagementRatePercent: 0 }
  const reach = denomForAudience(a)
  const engagements = safeNumber(a.total_engagements)
  const interaction = safeNumber(a.total_interaction)
  const engagementRatePercent =
    typeof a.engagement_rate === 'number'
      ? a.engagement_rate * 100
      : reach > 0
        ? (Math.max(engagements, interaction) / reach) * 100
        : 0
  return { reach, engagementRatePercent }
}

router.get('/summary', async (_req: Request, res: Response) => {
  const timeoutMs = 15000
  try {
    const [fbResp, ytResp, igResp, ttResp, postsCountRaw] = await Promise.all([
      fetchJson<ApiResponse<SocialAggregate>>('/api/v1/social/facebook/stats', timeoutMs).catch(() => null),
      fetchJson<ApiResponse<SocialAggregate>>('/api/v1/social/youtube/stats', timeoutMs).catch(() => null),
      fetchJson<ApiResponse<SocialAggregate>>('/api/v1/social/instagram/stats', timeoutMs).catch(() => null),
      fetchJson<ApiResponse<SocialAggregate>>('/api/v1/social/tiktok/stats', timeoutMs).catch(() => null),
      fetchJson<number>('/api/v1/social/post/count', timeoutMs).catch(() => 0),
    ])

    const fb = fbResp?.success ? (fbResp.data as SocialAggregate | null) : null
    const yt = ytResp?.success ? (ytResp.data as SocialAggregate | null) : null
    const ig = igResp?.success ? (igResp.data as SocialAggregate | null) : null
    const tt = ttResp?.success ? (ttResp.data as SocialAggregate | null) : null

    const all: SocialAggregate[] = [fb, yt, ig, tt].filter(Boolean) as SocialAggregate[]

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

    const engagementRateTotalPercent =
      audienceTotal > 0 ? (interactionsTotal / audienceTotal) * 100 : 0

    const data: SocialSummaryData = {
      interactionsTotal,
      audienceTotal,
      viewsTotal,
      sharesTotal,
      commentsTotal,
      engagementRateTotalPercent,
      postsCount: safeNumber(postsCountRaw),
    }

    res.json({ success: true, data } satisfies ApiResponse<SocialSummaryData>)
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : 'Errore',
    } satisfies ApiResponse<SocialSummaryData>)
  }
})

router.get('/platforms', async (_req: Request, res: Response) => {
  const timeoutMs = 15000
  try {
    const [fbResp, ytResp, igResp, ttResp] = await Promise.all([
      fetchJson<ApiResponse<SocialAggregate>>('/api/v1/social/facebook/stats', timeoutMs).catch(() => null),
      fetchJson<ApiResponse<SocialAggregate>>('/api/v1/social/youtube/stats', timeoutMs).catch(() => null),
      fetchJson<ApiResponse<SocialAggregate>>('/api/v1/social/instagram/stats', timeoutMs).catch(() => null),
      fetchJson<ApiResponse<SocialAggregate>>('/api/v1/social/tiktok/stats', timeoutMs).catch(() => null),
    ])

    const fb = fbResp?.success ? (fbResp.data as SocialAggregate | null) : null
    const yt = ytResp?.success ? (ytResp.data as SocialAggregate | null) : null
    const ig = igResp?.success ? (igResp.data as SocialAggregate | null) : null
    const tt = ttResp?.success ? (ttResp.data as SocialAggregate | null) : null

    const data: SocialPlatformsData = {
      facebook: toPlatformPoint(fb),
      instagram: toPlatformPoint(ig),
      youtube: toPlatformPoint(yt),
      tiktok: toPlatformPoint(tt),
    }
    res.json({ success: true, data } satisfies ApiResponse<SocialPlatformsData>)
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : 'Errore',
    } satisfies ApiResponse<SocialPlatformsData>)
  }
})

export default router

