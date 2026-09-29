import { fetchDataApiJson } from './dataApi.js'

declare const fetch: (
  url: string,
  options?: { signal?: AbortSignal }
) => Promise<{
  ok: boolean
  status: number
  statusText: string
  json(): Promise<unknown>
}>

export interface NewsletterCountRow {
  id?: number
  day: string
  name?: string
  campaign_id?: number
  sent?: number
  open?: number
  click?: number
  add_subs?: number
  del_subs?: number
}

export interface NewsletterCountResponse {
  total_nl?: number
  count_sent?: number
  data?: NewsletterCountRow[]
}

export interface NewsletterDayTotals {
  sent: number
  open: number
  click: number
}

export interface NewsletterCampaignRow {
  sendDate: string
  sent: number
  open: number
  click: number
  openRate: number
  clickRate: number
}

/** Risposta GET /api/v1/newsletter/gradimento */
export interface NewsletterGradimento {
  responses: number
  totalVotes: number
  average: number
  /** Percentuale 0–100 (es. 83.48). Target dashboard: 70%. */
  rate: number
  targetRate: number
  targetAchieved: boolean
}

/** Giorni di invio ravvicinati (es. ritardi di una testata) appartengono alla stessa campagna. */
const SEND_CLUSTER_GAP_DAYS = 7

function safeNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function dayDiff(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a)
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

function ratePercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Number(Math.min((numerator / denominator) * 100, 100).toFixed(1))
}

export async function fetchNewsletterCountPayload(
  baseUrl: string,
  timeoutMs = 15000,
): Promise<NewsletterCountResponse> {
  const url = `${baseUrl}/api/v1/newsletter/count`
  return (await fetchDataApiJson(url, timeoutMs)) as NewsletterCountResponse
}

export async function fetchNewsletterCountSent(
  baseUrl: string,
  timeoutMs = 15000,
): Promise<number> {
  const json = await fetchNewsletterCountPayload(baseUrl, timeoutMs)
  return safeNumber(json.count_sent)
}

type GradimentoEnvelope = {
  success?: boolean
  data?: {
    responses?: number
    total_votes?: number
    average?: number
    rate?: number
    target_rate?: number
    target_achieved?: boolean
  } | null
}

/** Survey gradimento newsletter. `rate` è già in percentuale (es. 83.48). */
export async function fetchNewsletterGradimento(
  baseUrl: string,
  timeoutMs = 15000,
): Promise<NewsletterGradimento | null> {
  const url = `${baseUrl}/api/v1/newsletter/gradimento`
  try {
    const json = (await fetchDataApiJson(url, timeoutMs)) as GradimentoEnvelope | GradimentoEnvelope['data']
    const data =
      json && typeof json === 'object' && 'data' in json && json.data && typeof json.data === 'object'
        ? json.data
        : (json as GradimentoEnvelope['data'])
    if (!data || typeof data !== 'object' || data.rate == null) return null
    return {
      responses: safeNumber(data.responses),
      totalVotes: safeNumber(data.total_votes),
      average: safeNumber(data.average),
      rate: safeNumber(data.rate),
      targetRate: safeNumber(data.target_rate) || 70,
      targetAchieved: Boolean(data.target_achieved),
    }
  } catch {
    return null
  }
}

/**
 * Individua i picchi di invio (date campagna) partendo dai giorni presenti in /newsletter/count.
 * Giorni consecutivi entro SEND_CLUSTER_GAP_DAYS vengono uniti; la data campagna è il giorno
 * con più invii nel cluster.
 */
export function detectSendPeakDates(
  countRows: NewsletterCountRow[],
  byDay: Map<string, NewsletterDayTotals>,
): string[] {
  const candidateDays = [...new Set(countRows.map((r) => r.day).filter(Boolean))].sort()
  if (candidateDays.length === 0) return []

  const clusters: string[][] = []
  for (const day of candidateDays) {
    const last = clusters[clusters.length - 1]
    if (!last) {
      clusters.push([day])
      continue
    }
    const prev = last[last.length - 1]
    if (dayDiff(prev, day) <= SEND_CLUSTER_GAP_DAYS) {
      last.push(day)
    } else {
      clusters.push([day])
    }
  }

  return clusters.map((cluster) => {
    return cluster.reduce((best, day) => {
      const bestSent = byDay.get(best)?.sent ?? 0
      const daySent = byDay.get(day)?.sent ?? 0
      return daySent > bestSent ? day : best
    })
  })
}

/**
 * Per ogni picco di invio aggrega sent/open/click dal giorno picco fino al picco successivo (escluso).
 * Open/click rate = open/sent e click/sent sul periodo.
 */
export function buildCampaignRowsFromDaily(
  byDay: Map<string, NewsletterDayTotals>,
  peakDates: string[],
): NewsletterCampaignRow[] {
  const peaks = [...peakDates].sort()
  return peaks.map((sendDate, index) => {
    const endExclusive = peaks[index + 1] ?? '9999-99-99'
    let sent = 0
    let open = 0
    let click = 0
    for (const [day, totals] of byDay.entries()) {
      if (day >= sendDate && day < endExclusive) {
        sent += totals.sent
        open += totals.open
        click += totals.click
      }
    }
    return {
      sendDate,
      sent,
      open,
      click,
      openRate: ratePercent(open, sent),
      clickRate: ratePercent(click, sent),
    }
  })
}
