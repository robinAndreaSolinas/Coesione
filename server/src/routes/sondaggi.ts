import type { Request, Response } from 'express'
import { Router } from 'express'
import { DATA_API_BASE_URL } from '../config.js'

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

interface SondaggiGroupItem {
  id: number
  participants_count: number
  source_url?: string
}

interface SondaggiGroupsResponse {
  success: boolean
  data?: SondaggiGroupItem[] | null
  error?: unknown
  timestamp?: string
}

interface SondaggiQuizPayload {
  count_response?: number
  count_quiz?: number
}

interface SondaggiQuizResponse {
  success: boolean
  data?: SondaggiQuizPayload | null
  error?: unknown
  timestamp?: string
}

export interface SondaggiStatsPayload {
  surveysCount: number
  totalResponses: number
  completionRate: number
  averageResponses: number
}

const router = Router()

async function fetchJson<T>(pathWithQuery: string): Promise<T> {
  const url = `${DATA_API_BASE_URL}${pathWithQuery}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Data API error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data as T
}

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [groupsResp, quizResp] = await Promise.all([
      fetchJson<SondaggiGroupsResponse>('/api/v1/sondaggi/groups'),
      fetchJson<SondaggiQuizResponse>('/api/v1/sondaggi/quiz'),
    ])

    if (!groupsResp?.success || !groupsResp.data) {
      res.status(502).json({ error: 'Risposta non valida dal data API' })
      return
    }

    const rows = Array.isArray(groupsResp.data) ? groupsResp.data : []
    const uniqueSurveyIds = new Set<number>()
    const uniqueSourceUrls = new Set<string>()
    for (const row of rows) {
      uniqueSurveyIds.add(row.id)
      if (typeof row.source_url === 'string' && row.source_url.trim().length > 0) {
        uniqueSourceUrls.add(row.source_url.trim())
      }
    }
    const quizCount = Number(quizResp?.data?.count_quiz ?? 0)
    const quizResponses = Number(quizResp?.data?.count_response ?? 0)

    const surveysCount = uniqueSurveyIds.size + (Number.isFinite(quizCount) ? quizCount : 0)
    const totalResponses = uniqueSourceUrls.size + (Number.isFinite(quizResponses) ? quizResponses : 0)
    const averageResponses = surveysCount > 0 ? totalResponses / surveysCount : 0

    const payload: SondaggiStatsPayload = {
      surveysCount,
      totalResponses,
      completionRate: 0,
      averageResponses,
    }

    res.json(payload)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router

