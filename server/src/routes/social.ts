import type { Request, Response } from 'express'
import { Router } from 'express'
import {
  fetchSocialDashboard,
  fetchSocialPlatforms,
  fetchSocialPostCount,
  fetchSocialSummary,
  platformPostsCount,
  totalPostsCount,
} from '../lib/socialData.js'

const router = Router()

router.get('/post-count', async (_req: Request, res: Response) => {
  try {
    const data = await fetchSocialPostCount()
    res.json({
      success: true,
      data: {
        ...data,
        // Alias espliciti per la dashboard Social
        postsCount: totalPostsCount(data),
        facebook: platformPostsCount(data, 'facebook'),
        instagram: platformPostsCount(data, 'instagram'),
        x: platformPostsCount(data, 'x'),
        tiktok: platformPostsCount(data, 'tiktok'),
      },
    })
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : 'Errore',
    })
  }
})

/** Unica risposta per /social: summary + platforms + post count allineati. */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const { summary, platforms, postsMap } = await fetchSocialDashboard()
    res.json({
      success: true,
      data: {
        summary,
        platforms,
        postCount: {
          ...postsMap,
          postsCount: totalPostsCount(postsMap),
        },
      },
    })
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : 'Errore',
    })
  }
})

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
