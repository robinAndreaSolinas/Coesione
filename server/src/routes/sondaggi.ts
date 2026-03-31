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

interface LogoraStats {
  cohesion_sources: number
  total_groups: number
  total_messages: number
  total_participants: number
  total_consultations: number
  total_proposals: number
  total_votes: number
}

interface LogoraStatsResponse {
  success: boolean
  data?: LogoraStats | null
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
    const resp = await fetchJson<LogoraStatsResponse>('/api/v1/sondaggi/stats')

    if (!resp?.success || !resp.data) {
      res.status(502).json({ error: 'Risposta non valida dal data API' })
      return
    }

    const stats = resp.data

    const surveysCount = stats.total_consultations || stats.total_groups || 0
    const totalResponses = stats.total_votes || stats.total_messages || 0
    const completionRateFraction =
      stats.total_participants > 0 ? Math.min(totalResponses / stats.total_participants, 1) : 0
    const averageResponses = surveysCount > 0 ? totalResponses / surveysCount : 0

    const payload: SondaggiStatsPayload = {
      surveysCount,
      totalResponses,
      completionRate: completionRateFraction,
      averageResponses,
    }

    res.json(payload)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router

