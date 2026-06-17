import { DATA_API_BASE_URL } from '../config.js'

export type SocialPostEntry = {
  reach?: number
  engagement_rate?: number
}

export type SocialAggregate = {
  total_engagements?: number
  total_interaction?: number
  total_reach?: number
  total_views?: number
  total_shares?: number
  total_comments?: number
  engagement_rate?: number
  posts?: SocialPostEntry[]
}

export type SocialPostCount = {
  all?: number
  facebook?: number
  instagram?: number
  x?: number
  tiktok?: number
  other?: number
  message?: string
}

export type SocialPlatformKey = 'facebook' | 'instagram' | 'x' | 'tiktok'

export type SocialPlatformPoint = {
  /** Reach mostrata in UI (media post per IG/TikTok, totale altrove) */
  reach: number
  /** Reach totale API — denominatore per ER */
  reachTotal: number
  interactions: number
  engagementRatePercent: number
  postsCount: number
}

export type SocialPlatformsData = {
  facebook: SocialPlatformPoint
  instagram: SocialPlatformPoint
  x: SocialPlatformPoint
  tiktok: SocialPlatformPoint
}

export type SocialSummaryData = {
  interactionsTotal: number
  reachTotal: number
  sharesTotal: number
  commentsTotal: number
  engagementRateTotalPercent: number
  postsCount: number
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

export function rawReach(a: SocialAggregate): number {
  return safeNumber(a.total_reach)
}

/** Reach media sui singoli post (Instagram, TikTok). */
export function averagePostReach(a: SocialAggregate | null): number {
  if (!a) return 0
  if (!Array.isArray(a.posts) || a.posts.length === 0) return rawReach(a)
  let sum = 0
  let count = 0
  for (const post of a.posts) {
    const r = safeNumber(post.reach)
    if (r > 0) {
      sum += r
      count += 1
    }
  }
  return count > 0 ? sum / count : rawReach(a)
}

export function displayReach(a: SocialAggregate | null, platform: SocialPlatformKey): number {
  if (!a) return 0
  if (platform === 'instagram' || platform === 'tiktok') {
    return averagePostReach(a)
  }
  return rawReach(a)
}

export function platformInteractions(a: SocialAggregate | null): number {
  if (!a) return 0
  return Math.max(safeNumber(a.total_engagements), safeNumber(a.total_interaction))
}

export function platformEngagementRatePercent(a: SocialAggregate | null): number {
  if (!a) return 0
  const interactions = platformInteractions(a)
  const totalReach = rawReach(a)
  if (totalReach > 0) return (interactions / totalReach) * 100
  if (typeof a.engagement_rate === 'number') return a.engagement_rate * 100
  return 0
}

export function toPlatformPoint(
  a: SocialAggregate | null,
  postsCount: number,
  platform: SocialPlatformKey,
): SocialPlatformPoint {
  if (!a) {
    return { reach: 0, reachTotal: 0, interactions: 0, engagementRatePercent: 0, postsCount }
  }
  const reachTotal = rawReach(a)
  const reach = displayReach(a, platform)
  const interactions = platformInteractions(a)
  const engagementRatePercent = platformEngagementRatePercent(a)
  return { reach, reachTotal, interactions, engagementRatePercent, postsCount }
}

export function summaryFromPlatforms(
  platforms: SocialPlatformsData,
  postsCount: number,
): SocialSummaryData {
  const rows = [platforms.facebook, platforms.instagram, platforms.x, platforms.tiktok]
  const reachTotal = rows.reduce((s, p) => s + p.reach, 0)
  const reachSumForEr = rows.reduce((s, p) => s + p.reachTotal, 0)
  const interactionsTotal = rows.reduce((s, p) => s + p.interactions, 0)
  const engagementRateTotalPercent =
    reachSumForEr > 0 ? (interactionsTotal / reachSumForEr) * 100 : 0

  return {
    interactionsTotal,
    reachTotal,
    sharesTotal: 0,
    commentsTotal: 0,
    engagementRateTotalPercent,
    postsCount: safeNumber(postsCount),
  }
}

async function fetchDataApi(pathWithQuery: string, timeoutMs: number): Promise<unknown> {
  const url = `${DATA_API_BASE_URL}${pathWithQuery}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Data API error: ${res.status} ${res.statusText}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchDataApiSafe(pathWithQuery: string, timeoutMs: number): Promise<unknown | null> {
  try {
    return await fetchDataApi(pathWithQuery, timeoutMs)
  } catch {
    return null
  }
}

function xPostsCount(postsMap: SocialPostCount): number {
  const direct = safeNumber(postsMap.x)
  if (direct > 0) return direct
  return safeNumber(postsMap.other)
}

export async function fetchSocialPostCount(timeoutMs = 15000): Promise<SocialPostCount> {
  const raw = await fetchDataApiSafe('/api/v1/social/post/count', timeoutMs)
  const payload = unwrapApiPayload<SocialPostCount | number>(raw)
  if (typeof payload === 'number') {
    return { all: safeNumber(payload) }
  }
  return payload && typeof payload === 'object' ? payload : {}
}

export async function fetchSocialPlatforms(timeoutMs = 15000): Promise<SocialPlatformsData> {
  const [fbRaw, xRaw, igRaw, ttRaw, postsMap] = await Promise.all([
    fetchDataApiSafe('/api/v1/social/facebook/stats', timeoutMs),
    fetchDataApiSafe('/api/v1/social/x/stats', timeoutMs),
    fetchDataApiSafe('/api/v1/social/instagram/stats', timeoutMs),
    fetchDataApiSafe('/api/v1/social/tiktok/stats', timeoutMs),
    fetchSocialPostCount(timeoutMs),
  ])

  const fb = unwrapApiPayload<SocialAggregate>(fbRaw)
  const x = unwrapApiPayload<SocialAggregate>(xRaw)
  const ig = unwrapApiPayload<SocialAggregate>(igRaw)
  const tt = unwrapApiPayload<SocialAggregate>(ttRaw)

  return {
    facebook: toPlatformPoint(fb, safeNumber(postsMap.facebook), 'facebook'),
    instagram: toPlatformPoint(ig, safeNumber(postsMap.instagram), 'instagram'),
    x: toPlatformPoint(x, xPostsCount(postsMap), 'x'),
    tiktok: toPlatformPoint(tt, safeNumber(postsMap.tiktok), 'tiktok'),
  }
}

export async function fetchSocialSummary(timeoutMs = 15000): Promise<SocialSummaryData> {
  const [platforms, postsMap, fbRaw, xRaw, igRaw, ttRaw] = await Promise.all([
    fetchSocialPlatforms(timeoutMs),
    fetchSocialPostCount(timeoutMs),
    fetchDataApiSafe('/api/v1/social/facebook/stats', timeoutMs),
    fetchDataApiSafe('/api/v1/social/x/stats', timeoutMs),
    fetchDataApiSafe('/api/v1/social/instagram/stats', timeoutMs),
    fetchDataApiSafe('/api/v1/social/tiktok/stats', timeoutMs),
  ])

  const summary = summaryFromPlatforms(platforms, safeNumber(postsMap.all))

  const stats = [fbRaw, xRaw, igRaw, ttRaw]
    .map((r) => unwrapApiPayload<SocialAggregate>(r))
    .filter(Boolean) as SocialAggregate[]

  if (stats.length === 0) return summary

  let sharesSum = 0
  let commentsSum = 0
  for (const a of stats) {
    sharesSum += safeNumber(a.total_shares)
    commentsSum += safeNumber(a.total_comments)
  }
  const n = stats.length

  return {
    ...summary,
    sharesTotal: sharesSum / n,
    commentsTotal: commentsSum / n,
  }
}

const PLATFORM_PREFIX: Record<string, keyof SocialPlatformsData> = {
  facebook: 'facebook',
  instagram: 'instagram',
  x: 'x',
  tiktok: 'tiktok',
}

export function currentForSocialObjective(
  objectiveId: string,
  summary: SocialSummaryData,
  platforms: SocialPlatformsData,
): number | null {
  const platformMatch = objectiveId.match(
    /^social-(facebook|instagram|x|tiktok)-(engagement-rate|reach|post-count)$/
  )
  if (platformMatch) {
    const platformKey = PLATFORM_PREFIX[platformMatch[1]]
    const metric = platformMatch[2]
    const p = platforms[platformKey]
    if (metric === 'engagement-rate') return p.engagementRatePercent / 100
    if (metric === 'reach') return p.reach
    if (metric === 'post-count') return p.postsCount
    return 0
  }

  switch (objectiveId) {
    case 'social-posts-count':
      return summary.postsCount
    case 'social-engagement-rate':
      return summary.engagementRateTotalPercent / 100
    case 'social-interactions':
    case 'social-views':
      return summary.interactionsTotal
    case 'social-reach':
      return summary.reachTotal
    case 'social-shares':
      return summary.sharesTotal
    case 'social-comments':
      return summary.commentsTotal
    default:
      return null
  }
}
