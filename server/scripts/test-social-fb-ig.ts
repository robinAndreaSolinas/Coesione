/**
 * Diagnostica calcoli social — Facebook e Instagram.
 * Uso: npm run test:social-fb-ig
 */
import {
  averagePostReach,
  fetchSocialPlatforms,
  fetchSocialPostCount,
  fetchSocialSummary,
  platformEngagementRatePercent,
  platformInteractions,
  rawReach,
  summaryFromPlatforms,
  toPlatformPoint,
  unwrapApiPayload,
  type SocialAggregate,
} from '../src/lib/socialData.js'
import { DATA_API_BASE_URL } from '../src/config.js'

declare const fetch: (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>

async function fetchStats(platform: string): Promise<SocialAggregate | null> {
  const res = await fetch(`${DATA_API_BASE_URL}/api/v1/social/${platform}/stats`)
  if (!res.ok) throw new Error(`${platform} stats: ${res.status}`)
  return unwrapApiPayload<SocialAggregate>(await res.json())
}

function pct(n: number): string {
  return `${n.toFixed(4)}%`
}

function line(label: string, value: unknown): void {
  console.log(`  ${label.padEnd(32)} ${value}`)
}

async function testFacebook(raw: SocialAggregate | null, postsCount: number) {
  console.log('\n=== FACEBOOK ===')
  if (!raw) {
    console.log('  (nessun dato API)')
    return
  }

  const point = toPlatformPoint(raw, postsCount, 'facebook')
  const postsInStats = Array.isArray(raw.posts) ? raw.posts.length : 0
  const sumPostReach = (raw.posts ?? []).reduce((s, p) => s + (p.reach ?? 0), 0)

  line('Post count (post/count)', postsCount)
  line('Post in stats[].posts', postsInStats)
  line('total_reach API', raw.total_reach)
  line('total_engagements API', raw.total_engagements)
  line('total_reactions API', raw.total_reactions)
  line('engagement_rate API', raw.engagement_rate != null ? pct(raw.engagement_rate * 100) : 'n/d')
  line('Somma reach post', sumPostReach)
  line('→ interactions (calc)', platformInteractions(raw))
  line('→ ER piattaforma (calc)', pct(platformEngagementRatePercent(raw)))
  line('→ reachTotal (denom. ER)', point.reachTotal)
  line('→ reach display UI', point.reach)
  line('Incluso in ER totale?', point.reachTotal > 0 ? 'SÌ' : 'NO (reach=0, interazioni escluse dal numeratore ER)')
}

async function testInstagram(raw: SocialAggregate | null, postsCount: number) {
  console.log('\n=== INSTAGRAM ===')
  if (!raw) {
    console.log('  (nessun dato API)')
    return
  }

  const point = toPlatformPoint(raw, postsCount, 'instagram')
  const postsInStats = Array.isArray(raw.posts) ? raw.posts.length : 0
  const sumPostReach = (raw.posts ?? []).reduce((s, p) => s + (p.reach ?? 0), 0)
  const avgFromArray = averagePostReach(raw)
  const avgFromTotal = postsCount > 0 ? rawReach(raw) / postsCount : 0

  line('Post count (post/count)', postsCount)
  line('Post in stats[].posts', postsInStats)
  line('total_reach API', raw.total_reach)
  line('total_engagements API', raw.total_engagements)
  line('engagement_rate API', raw.engagement_rate != null ? pct(raw.engagement_rate * 100) : 'n/d')
  line('Somma reach post[]', sumPostReach)
  line('Reach media (solo array post)', avgFromArray.toFixed(2))
  line('Reach media (total_reach/postCount)', avgFromTotal.toFixed(2))
  line('→ reach display UI', point.reach.toFixed(2))
  line('→ interactions (calc)', platformInteractions(raw))
  line('→ ER piattaforma (calc)', pct(platformEngagementRatePercent(raw)))
  line('Verifica ER', `${platformInteractions(raw)} / ${rawReach(raw)} × 100 = ${pct(platformEngagementRatePercent(raw))}`)
  line('NOTA ER vs reach media', `ER usa total_reach (${rawReach(raw)}), non reach media (${point.reach.toFixed(0)})`)
}

async function testSummary() {
  console.log('\n=== TOTALE (FB + IG + X + TT, no YT/Other) ===')
  const [platforms, postsMap, summary] = await Promise.all([
    fetchSocialPlatforms(),
    fetchSocialPostCount(),
    fetchSocialSummary(),
  ])

  const points = [platforms.facebook, platforms.instagram, platforms.x, platforms.tiktok]
  const recomputed = summaryFromPlatforms(points)

  for (const [name, p] of [
    ['Facebook', platforms.facebook],
    ['Instagram', platforms.instagram],
    ['X', platforms.x],
    ['TikTok', platforms.tiktok],
  ] as const) {
    console.log(`\n  ${name}:`)
    line('interactions', p.interactions)
    line('reach display', p.reach.toFixed(2))
    line('reachTotal (raw)', p.reachTotal)
    line('ER %', pct(p.engagementRatePercent))
    line('in ER totale', p.reachTotal > 0 ? 'sì' : 'no')
  }

  console.log('\n  Aggregato summary:')
  line('interactionsTotal (tutte)', summary.interactionsTotal)
  line('reachTotal card (display)', summary.reachTotal.toFixed(2))
  line('ER totale %', pct(summary.engagementRateTotalPercent))
  line('Match recomputed', recomputed.engagementRateTotalPercent === summary.engagementRateTotalPercent ? 'OK' : 'MISMATCH')

  const forEr = points.filter((p) => p.reachTotal > 0)
  const interEr = forEr.reduce((s, p) => s + p.interactions, 0)
  const reachEr = forEr.reduce((s, p) => s + p.reachTotal, 0)
  line('ER formula', `${interEr} / ${reachEr} × 100 = ${pct((interEr / reachEr) * 100)}`)
  line('ATTENZIONE', 'Reach card ≠ denominatore ER (IG/TT usano media, ER usa total_reach raw)')
}

async function main() {
  console.log(`Data API: ${DATA_API_BASE_URL}`)
  const [fbRaw, igRaw, postsMap] = await Promise.all([
    fetchStats('facebook'),
    fetchStats('instagram'),
    fetchSocialPostCount(),
  ])

  await testFacebook(fbRaw, postsMap.facebook ?? 0)
  await testInstagram(igRaw, postsMap.instagram ?? 0)
  await testSummary()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
