import type { Request, Response } from 'express'
import { Router } from 'express'
import {
  fetchSocialPlatforms,
  fetchSocialPostCount,
  fetchSocialSummary,
} from '../lib/socialData.js'

const router = Router()

router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const data = await fetchSocialSummary()
    res.json({ success: true, data })
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : 'Errore',
    })
  }
})

router.get('/platforms', async (_req: Request, res: Response) => {
  try {
    const data = await fetchSocialPlatforms()
    res.json({ success: true, data })
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : 'Errore',
    })
  }
})

export default router
