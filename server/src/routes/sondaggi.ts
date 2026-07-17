import type { Request, Response } from 'express'
import { Router } from 'express'
import { DATA_API_BASE_URL } from '../config.js'
import { fetchSondaggiAggregates, fetchSondaggiSurveyAggregates } from '../lib/sondaggiData.js'

export type SondaggiStatsPayload = {
  surveysCount: number
  participantsCount: number
  totalResponses: number
  engagementRatePercent: number
  satisfactionScore: number | null
  satisfactionResponses: number
  regionalDevelopmentRatePercent: number | null
  regionalDevelopmentAverage: number
  regionalDevelopmentResponses: number
  regionalDevelopmentBySheet: Record<string, number>
}

const router = Router()

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [agg, surveyAgg] = await Promise.all([
      fetchSondaggiAggregates(DATA_API_BASE_URL),
      fetchSondaggiSurveyAggregates(DATA_API_BASE_URL).catch(() => null),
    ])
    if (!agg) {
      res.status(502).json({ error: 'Risposta non valida dal data API' })
      return
    }

    const payload: SondaggiStatsPayload = {
      surveysCount: agg.surveysCount,
      participantsCount: agg.participantsCount,
      totalResponses: agg.totalResponses,
      engagementRatePercent: agg.engagementRatePercent,
      satisfactionScore: surveyAgg ? surveyAgg.satisfactionScore : null,
      satisfactionResponses: surveyAgg?.satisfactionResponses ?? 0,
      regionalDevelopmentRatePercent: surveyAgg ? surveyAgg.regionalDevelopmentRatePercent : null,
      regionalDevelopmentAverage: surveyAgg?.regionalDevelopmentAverage ?? 0,
      regionalDevelopmentResponses: surveyAgg?.regionalDevelopmentResponses ?? 0,
      regionalDevelopmentBySheet: surveyAgg?.regionalDevelopmentBySheet ?? {},
    }

    res.json(payload)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router
