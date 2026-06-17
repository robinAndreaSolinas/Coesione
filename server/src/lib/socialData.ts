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

/** Risposta GET /api/v1/social/post/count */
export type SocialPostCount = {
  all?: number
  facebook?: number
  instagram?: number
  x?: number
  tiktok?: number
  youtube?: number
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

export function platformPostsCount(
  postsMap: SocialPostCount,
  platform: SocialPlatformKey,
): number {
  switch (platform) {
    case 'facebook':
      return safeNumber(postsMap.facebook)
    case 'instagram':
      return safeNumber(postsMap.instagram)
    case 'x':
      return safeNumber(postsMap.x)
    case 'tiktok':
      return safeNumber(postsMap.tiktok)
    default:
      return 0
  }
}

/** Totale post in dashboard: campo `all` da post/count (include youtube/other). */
export function totalPostsCount(postsMap: SocialPostCount): number {
  const all = safeNumber(postsMap.all)
  if (all > 0) return all
  return (
    platformPostsCount(postsMap, 'facebook') +
    platformPostsCount(postsMap, 'instagram') +
    platformPostsCount(postsMap, 'x') +
    platformPostsCount(postsMap, 'tiktok') +
    safeNumber(postsMap.other) +
    safeNumber(postsMap.youtube)
  )
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

export async function fetchSocialPostCount(timeoutMs = 15000): Promise<SocialPostCount> {
  const raw = await fetchDataApiSafe('/api/v1/social/post/count', timeoutMs)
  const payload = unwrapApiPayload<SocialPostCount | number>(raw)
  if (typeof payload === 'number') {
    return { all: safeNumber(payload) }
  }
  return payload && typeof payload === 'object' ? payload : {}
}

const PLATFORM_STATS_PATH: Record<SocialPlatformKey, string> = {
  facebook: '/api/v1/social/facebook/stats',
  instagram: '/api/v1/social/instagram/stats',
  x: '/api/v1/social/x/stats',
  tiktok: '/api/v1/social/tiktok/stats',
}

export async function fetchSocialPlatforms(timeoutMs = 15000): Promise<SocialPlatformsData> {
  const [fbRaw, xRaw, igRaw, ttRaw, postsMap] = await Promise.all([
    fetchDataApiSafe(PLATFORM_STATS_PATH.facebook, timeoutMs),
    fetchDataApiSafe(PLATFORM_STATS_PATH.x, timeoutMs),
    fetchDataApiSafe(PLATFORM_STATS_PATH.instagram, timeoutMs),
    fetchDataApiSafe(PLATFORM_STATS_PATH.tiktok, timeoutMs),
    fetchSocialPostCount(timeoutMs),
  ])

  const fb = unwrapApiPayload<SocialAggregate>(fbRaw)
  const x = unwrapApiPayload<SocialAggregate>(xRaw)
  const ig = unwrapApiPayload<SocialAggregate>(igRaw)
  const tt = unwrapApiPayload<SocialAggregate>(ttRaw)

  return {
    facebook: toPlatformPoint(fb, platformPostsCount(postsMap, 'facebook'), 'facebook'),
    instagram: toPlatformPoint(ig, platformPostsCount(postsMap, 'instagram'), 'instagram'),
    x: toPlatformPoint(x, platformPostsCount(postsMap, 'x'), 'x'),
    tiktok: toPlatformPoint(tt, platformPostsCount(postsMap, 'tiktok'), 'tiktok'),
  }
}

export async function fetchSocialSummary(timeoutMs = 15000): Promise<SocialSummaryData> {
  const [platforms, postsMap] = await Promise.all([
    fetchSocialPlatforms(timeoutMs),
    fetchSocialPostCount(timeoutMs),
  ])

  return summaryFromPlatforms(platforms, totalPostsCount(postsMap))
}

const PLATFORM_PREFIX: Record<string, SocialPlatformKey> = {
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
