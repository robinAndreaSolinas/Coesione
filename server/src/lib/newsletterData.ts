declare const fetch: (
  url: string,
  options?: { signal?: AbortSignal }
) => Promise<{
  ok: boolean
  status: number
  statusText: string
  json(): Promise<unknown>
}>

export interface NewsletterCountResponse {
  total_nl?: number
  count_sent?: number
  data?: unknown[]
}

function safeNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function fetchNewsletterCountSent(
  baseUrl: string,
  timeoutMs = 15000,
): Promise<number> {
  const url = `${baseUrl}/api/v1/newsletter/count`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Data API error: ${res.status} ${res.statusText}`)
    }
    const json = (await res.json()) as NewsletterCountResponse
    return safeNumber(json.count_sent)
  } finally {
    clearTimeout(timeout)
  }
}
