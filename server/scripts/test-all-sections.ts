/**
 * Test di tutte le sezioni dati (newsletter, social, siti, video, sondaggi).
 * 1. Parser sugli envelope reali dell'API.
 * 2. Fetch contro un server locale con le stesse forme.
 * 3. Probe live su DATA_API_BASE_URL.
 *
 * Uso: npx tsx scripts/test-all-sections.ts
 */
import http from 'node:http'
import { readFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { monthAvgFromUniqueUsers, numberFromApiPayload } from '../src/lib/apiPayload.js'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function testParsers(): void {
  assert(numberFromApiPayload(12) === 12, 'video count nudo')
  assert(numberFromApiPayload({ success: true, data: 12 }) === 12, 'video count in data')
  assert(numberFromApiPayload({ data: { video_count: 9 } }) === 9, 'video_count annidato')
  assert(monthAvgFromUniqueUsers({ success: true, data: { month_avg: 40 } }) === 40, 'utenti un livello')
  assert(
    monthAvgFromUniqueUsers({
      success: true,
      data: { success: true, data: { month_avg: 55, by_date: [] } },
    }) === 55,
    'utenti doppio envelope',
  )
  console.log('PASS parser')
}

async function listen(server: http.Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  return (server.address() as AddressInfo).port
}

async function testFetchers(): Promise<void> {
  const server = http.createServer((req, res) => {
    const url = req.url ?? ''
    const send = (body: unknown) => {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(body))
    }
    if (url.startsWith('/api/v1/newsletter/gradimento')) {
      send({ success: true, data: { responses: 56, total_votes: 224, average: 3.34, rate: 83.48, target_rate: 70, target_achieved: true } })
      return
    }
    if (url.startsWith('/api/v1/newsletter/count')) {
      send({ total_nl: 12, count_sent: 12, data: [{ day: '2026-01-01', sent: 100, open: 40, click: 5 }] })
      return
    }
    if (url.startsWith('/api/v1/social/post/count')) {
      send({ all: 506, facebook: 159, instagram: 141, x: 122, tiktok: 84, youtube: 72, other: 11, total: 589, unique_count: 586 })
      return
    }
    if (url.includes('/stats') && url.includes('/social/')) {
      send({ success: true, data: { total_reach: 1000, total_engagements: 50, total_interaction: 50 } })
      return
    }
    if (url.startsWith('/api/v1/site/stats/count')) {
      send({ success: true, data: { total_count_url: 80, total_pageview: 240000 } })
      return
    }
    if (url.startsWith('/api/v1/site/unique-user')) {
      send({ success: true, data: { success: true, data: { month_avg: 1200, by_date: [] } } })
      return
    }
    if (url.startsWith('/api/v1/video/count')) {
      send(15)
      return
    }
    if (url.startsWith('/api/v1/video/stats')) {
      send({
        success: true,
        data: [{ date: '2026-01-01', stream: 400, watched_seconds: 12000, vth: 0.4 }],
      })
      return
    }
    if (url.startsWith('/api/v1/sondaggi/quiz')) {
      send({ success: true, data: { count_user: 200, count_response: 80, count_quiz: 4, quiz_ids: ['a'] } })
      return
    }
    if (url.startsWith('/api/v1/sondaggi/survey')) {
      send({
        success: true,
        data: { satisfaction: { score: 4.2, responses: 10 }, regional_development: { rate: 80, average: 4, responses: 10 } },
      })
      return
    }
    res.statusCode = 404
    res.end('missing ' + url)
  })

  const port = await listen(server)
  const base = `http://127.0.0.1:${port}`
  process.env.DATA_API_BASE_URL = base
  process.env.REDIS_URL = ''

  const { fetchNewsletterGradimento, fetchNewsletterCountSent } = await import('../src/lib/newsletterData.js')
  const { fetchSocialDashboard } = await import('../src/lib/socialData.js')
  const { fetchSiteStatsCount } = await import('../src/lib/siteData.js')
  const { fetchSondaggiAggregates, fetchSondaggiSurveyAggregates } = await import('../src/lib/sondaggiData.js')
  const { fetchDataApiJson } = await import('../src/lib/dataApi.js')
  const { monthAvgFromUniqueUsers: monthAvg, numberFromApiPayload: asNumber } = await import('../src/lib/apiPayload.js')

  const gradimento = await fetchNewsletterGradimento(base)
  assert(gradimento?.rate === 83.48, `gradimento ${JSON.stringify(gradimento)}`)
  const sent = await fetchNewsletterCountSent(base)
  assert(sent === 12, `newsletter count ${sent}`)

  const social = await fetchSocialDashboard()
  assert(social.summary.postsCount === 506, `social posts ${social.summary.postsCount}`)
  assert(social.platforms.facebook.postsCount === 159, 'facebook posts')
  assert(social.platforms.instagram.postsCount === 141, 'instagram posts')
  assert(social.platforms.facebook.interactions === 50, `facebook interactions ${social.platforms.facebook.interactions}`)

  const site = await fetchSiteStatsCount(base)
  assert(site.articlesDigitalCount === 80, `articoli ${site.articlesDigitalCount}`)
  assert(site.totalPageview === 240000, 'pageview')

  const unique = await fetchDataApiJson(`${base}/api/v1/site/unique-user?from_date=2025-08-01&to_date=2026-09-29`)
  assert(monthAvg(unique) === 1200, `unique users ${monthAvg(unique)}`)

  const videoCount = asNumber(await fetchDataApiJson(`${base}/api/v1/video/count`))
  assert(videoCount === 15, `video count ${videoCount}`)
  const videoStats = await fetchDataApiJson(`${base}/api/v1/video/stats?from_date=2025-08-01&to_date=2026-09-29`) as {
    success: boolean
    data: Array<{ stream: number }>
  }
  assert(videoStats.success && videoStats.data[0]?.stream === 400, 'video stats')

  const quiz = await fetchSondaggiAggregates(base)
  assert(quiz?.surveysCount === 4 && quiz.participantsCount === 200, `quiz ${JSON.stringify(quiz)}`)
  const survey = await fetchSondaggiSurveyAggregates(base)
  assert(survey?.satisfactionScore === 4.2, `survey ${JSON.stringify(survey)}`)

  server.close()
  console.log('PASS fetch newsletter, social, siti, video, sondaggi')
}

function liveBaseUrl(): string {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env.local')
  const text = readFileSync(file, 'utf8')
  const line = text.split('\n').find((row) => row.startsWith('DATA_API_BASE_URL='))
  const value = line?.slice('DATA_API_BASE_URL='.length).trim()
  if (!value) throw new Error('DATA_API_BASE_URL mancante in .env.local')
  return value
}

async function testLive(): Promise<void> {
  const base = liveBaseUrl()
  console.log('LIVE', base)
  const end = new Date().toISOString().slice(0, 10)
  const required = [
    '/api/v1/newsletter/gradimento',
    '/api/v1/newsletter/count',
    '/api/v1/social/post/count',
    '/api/v1/social/facebook/stats',
    '/api/v1/social/instagram/stats',
    '/api/v1/social/tiktok/stats',
    '/api/v1/social/x/stats',
    '/api/v1/site/stats/count',
    `/api/v1/site/unique-user?from_date=2025-08-01&to_date=${end}`,
    '/api/v1/video/count',
    `/api/v1/video/stats?from_date=2025-08-01&to_date=${end}`,
    '/api/v1/sondaggi/quiz',
  ]
  const failures: string[] = []
  const bodies = new Map<string, unknown>()
  for (const path of required) {
    try {
      const res = await fetch(`${base}${path}`)
      if (!res.ok) {
        failures.push(`${res.status} ${path}`)
        continue
      }
      bodies.set(path.split('?')[0] ?? path, await res.json())
      console.log('LIVE PASS', path.split('?')[0])
    } catch (error) {
      failures.push(`${path} ${error instanceof Error ? error.message : error}`)
    }
  }

  const gradimento = bodies.get('/api/v1/newsletter/gradimento') as { data?: { rate?: number } }
  const posts = bodies.get('/api/v1/social/post/count') as { all?: number }
  const site = bodies.get('/api/v1/site/stats/count') as { data?: { total_count_url?: number } }
  const videoCount = bodies.get('/api/v1/video/count')
  const quiz = bodies.get('/api/v1/sondaggi/quiz') as { data?: { count_quiz?: number } }
  if (!(gradimento?.data?.rate && gradimento.data.rate > 0)) failures.push('gradimento rate vuoto')
  if (!(posts?.all && posts.all > 0)) failures.push('social post count vuoto')
  if (!(site?.data?.total_count_url && site.data.total_count_url > 0)) failures.push('articoli vuoti')
  if (!(typeof videoCount === 'number' && videoCount > 0)) failures.push('video count vuoto')
  if (!(quiz?.data?.count_quiz && quiz.data.count_quiz > 0)) failures.push('quiz vuoto')

  // Rotta commentata in coesione-be (routers/sondaggi.py). Non blocca le altre sezioni.
  const survey = await fetch(`${base}/api/v1/sondaggi/survey`)
  console.log(survey.ok ? 'LIVE PASS /api/v1/sondaggi/survey' : `LIVE SKIP /api/v1/sondaggi/survey (${survey.status}, endpoint disattivato)`)

  if (failures.length > 0) {
    throw new Error('API live non ok:\n' + failures.join('\n'))
  }
}

async function main(): Promise<void> {
  testParsers()
  await testFetchers()
  await testLive()
  console.log('TUTTI I TEST OK')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
