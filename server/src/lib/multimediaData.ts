import type { SocialPlatformPoint } from './socialData.js'

export type MultimediaErInputs = {
  /** Social: interazioni su piattaforme con reach > 0 */
  socialInteractions: number
  socialReach: number
  socialPostsCount: number
  /** Video: completion rate (0–1) e peso audience/stream */
  videoCompletionRate: number
  videoAudience: number
  videoCount: number
  /** Articoli: media pageview per articolo vs target 3000 */
  avgPageviewsPerArticle: number
  articlesPublishedCount: number
  pageviewsTargetPerArticle?: number
}

export function socialErComponents(platformPoints: SocialPlatformPoint[]): {
  interactions: number
  reach: number
  postsCount: number
  engagementRateFraction: number
} {
  const forEr = platformPoints.filter((p) => p.reachTotal > 0)
  const interactions = forEr.reduce((s, p) => s + p.interactions, 0)
  const reach = forEr.reduce((s, p) => s + p.reachTotal, 0)
  const postsCount = platformPoints.reduce((s, p) => s + p.postsCount, 0)
  const engagementRateFraction = reach > 0 ? interactions / reach : 0
  return { interactions, reach, postsCount, engagementRateFraction }
}

/**
 * ER multimedia WP2: media ponderata per volume di contenuti
 * (articoli + video + social post).
 */
export function multimediaEngagementRateFraction(input: MultimediaErInputs): number {
  const pageviewTarget = input.pageviewsTargetPerArticle ?? 3000
  const channels: Array<{ er: number; weight: number }> = []

  if (input.socialReach > 0 && input.socialPostsCount > 0) {
    channels.push({
      er: input.socialInteractions / input.socialReach,
      weight: input.socialPostsCount,
    })
  }

  if (input.videoAudience > 0 && input.videoCount > 0 && input.videoCompletionRate > 0) {
    channels.push({
      er: input.videoCompletionRate,
      weight: input.videoCount,
    })
  }

  if (input.articlesPublishedCount > 0 && input.avgPageviewsPerArticle > 0) {
    channels.push({
      er: Math.min(input.avgPageviewsPerArticle / pageviewTarget, 1),
      weight: input.articlesPublishedCount,
    })
  }

  const totalWeight = channels.reduce((s, c) => s + c.weight, 0)
  if (totalWeight <= 0) return 0
  return channels.reduce((s, c) => s + c.er * c.weight, 0) / totalWeight
}

export function multimediaEngagementRatePercent(input: MultimediaErInputs): number {
  return multimediaEngagementRateFraction(input) * 100
}
