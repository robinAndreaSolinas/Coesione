import { DATA_API_BASE_URL } from '../config.js'

declare const fetch: (
  url: string,
  options?: { signal?: AbortSignal },
) => Promise<{
  ok: boolean
  status: number
  statusText: string
  json(): Promise<unknown>
}>

export interface SiteStatsCountData {
  total_count_url?: number
  total_pageview?: number
  by_source?: Array<{ source?: string; count_url?: number }>
}

type ApiEnvelope<T> = {
  success?: boolean
  data?: T | null
}

export function safeNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

export function unwrapApiPayload<T>(json: unknown): T | null {
  if (json == null) return null
  if (typeof json === 'object' && json !== null && 'success' in json) {
    const env = json as ApiEnvelope<T>
    if (env.success === false) return null
    return (env.data ?? null) as T | null
  }
  return json as T
}

export type SiteCountAggregates = {
  totalCountUrl: number
  totalPageview: number
  avgPageviewsPerArticle: number
  /** Articoli digitali (web) — conteggio API */
  articlesDigitalCount: number
  /** Articoli stampati — placeholder finché non fornito */
  articlesPrintedCount: number
  /** Stampati + digitali */
  articlesPublishedCount: number
}

export async function fetchSiteStatsCount(
  baseUrl: string = DATA_API_BASE_URL,
  timeoutMs = 15000,
): Promise<SiteCountAggregates> {
  const url = `${baseUrl}/api/v1/site/stats/count`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Data API error: ${res.status} ${res.statusText}`)
    }
    const json = await res.json()
    const data = unwrapApiPayload<SiteStatsCountData>(json)
    const articlesDigitalCount = safeNumber(data?.total_count_url)
    const articlesPrintedCount = 0
    const articlesPublishedCount = articlesPrintedCount + articlesDigitalCount
    const totalPageview = safeNumber(data?.total_pageview)
    const avgPageviewsPerArticle =
      articlesPublishedCount > 0 ? totalPageview / articlesPublishedCount : 0
    return {
      totalCountUrl: articlesDigitalCount,
      totalPageview,
      avgPageviewsPerArticle,
      articlesDigitalCount,
      articlesPrintedCount,
      articlesPublishedCount,
    }
  } finally {
    clearTimeout(timeout)
  }
}
