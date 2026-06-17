import type { Request, Response } from 'express'
import { Router } from 'express'
import { DATA_API_BASE_URL } from '../config.js'
import { fetchSondaggiAggregates } from '../lib/sondaggiData.js'

export type SondaggiStatsPayload = {
  surveysCount: number
  participantsCount: number
  totalResponses: number
  engagementRatePercent: number
}

const router = Router()

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const agg = await fetchSondaggiAggregates(DATA_API_BASE_URL)
    if (!agg) {
      res.status(502).json({ error: 'Risposta non valida dal data API' })
      return
    }

    const payload: SondaggiStatsPayload = {
      surveysCount: agg.surveysCount,
      participantsCount: agg.participantsCount,
      totalResponses: agg.totalResponses,
      engagementRatePercent: agg.engagementRatePercent,
    }

    res.json(payload)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router
