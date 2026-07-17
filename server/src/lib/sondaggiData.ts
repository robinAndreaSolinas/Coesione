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

export interface SondaggiSurveyPayload {
  satisfaction?: {
    responses?: number
    score?: number
  }
  regional_development?: {
    responses?: number
    average?: number
    rate?: number
    by_sheet?: Record<string, number>
  }
  target_average?: number
  target_achieved?: boolean
}

export interface SondaggiSurveyResponse {
  success: boolean
  data?: SondaggiSurveyPayload | null
  error?: unknown
  timestamp?: string
}

export interface SondaggiSurveyAggregates {
  /** Score 1–5 satisfaction structured dialogues */
  satisfactionScore: number
  satisfactionResponses: number
  /** Percentuale (0–100) improved understanding Regional Development */
  regionalDevelopmentRatePercent: number
  regionalDevelopmentAverage: number
  regionalDevelopmentResponses: number
  /** Media score 1–5 per foglio (chiavi API grezze, es. GdG) */
  regionalDevelopmentBySheet: Record<string, number>
  targetAverage: number
}

export function surveyAggregatesFromPayload(
  data: SondaggiSurveyPayload | null | undefined,
): SondaggiSurveyAggregates {
  const rawBySheet = data?.regional_development?.by_sheet
  const bySheet: Record<string, number> = {}
  if (rawBySheet && typeof rawBySheet === 'object') {
    for (const [key, value] of Object.entries(rawBySheet)) {
      bySheet[key] = safeNumber(value)
    }
  }

  return {
    satisfactionScore: safeNumber(data?.satisfaction?.score),
    satisfactionResponses: safeNumber(data?.satisfaction?.responses),
    regionalDevelopmentRatePercent: safeNumber(data?.regional_development?.rate),
    regionalDevelopmentAverage: safeNumber(data?.regional_development?.average),
    regionalDevelopmentResponses: safeNumber(data?.regional_development?.responses),
    regionalDevelopmentBySheet: bySheet,
    targetAverage: safeNumber(data?.target_average),
  }
}

export async function fetchSondaggiSurveyAggregates(
  baseUrl: string,
): Promise<SondaggiSurveyAggregates | null> {
  const resp = await fetchJson<SondaggiSurveyResponse>(baseUrl, '/api/v1/sondaggi/survey')
  if (!resp?.success || !resp.data) {
    return null
  }
  return surveyAggregatesFromPayload(resp.data)
}
