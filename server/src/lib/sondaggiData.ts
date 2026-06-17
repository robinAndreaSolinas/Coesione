declare const fetch: (
  url: string,
  options?: {
    method?: string
    headers?: Record<string, string>
  }
) => Promise<{
  ok: boolean
  status: number
  statusText: string
  json(): Promise<unknown>
}>

export interface SondaggiQuizPayload {
  count_user?: number
  count_response?: number
  count_quiz?: number
  quiz_ids?: string[]
}

export interface SondaggiQuizResponse {
  success: boolean
  data?: SondaggiQuizPayload | null
  error?: unknown
  timestamp?: string
}

export interface SondaggiAggregates {
  surveysCount: number
  participantsCount: number
  totalResponses: number
  /** Risposte / utenti unici (count_user) × 100 */
  engagementRatePercent: number
}

function safeNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function fetchJson<T>(baseUrl: string, pathWithQuery: string): Promise<T> {
  const url = `${baseUrl}${pathWithQuery}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Data API error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data as T
}

export function aggregatesFromQuizPayload(data: SondaggiQuizPayload | null | undefined): SondaggiAggregates {
  const participantsCount = safeNumber(data?.count_user)
  const totalResponses = safeNumber(data?.count_response)
  const surveysCount = safeNumber(data?.count_quiz)
  const engagementRatePercent =
    participantsCount > 0 ? (totalResponses / participantsCount) * 100 : 0

  return {
    surveysCount,
    participantsCount,
    totalResponses,
    engagementRatePercent,
  }
}

export async function fetchSondaggiAggregates(baseUrl: string): Promise<SondaggiAggregates | null> {
  const resp = await fetchJson<SondaggiQuizResponse>(baseUrl, '/api/v1/sondaggi/quiz')
  if (!resp?.success || !resp.data) {
    return null
  }
  return aggregatesFromQuizPayload(resp.data)
}
