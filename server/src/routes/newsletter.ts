import type { Request, Response } from 'express'
import { Router } from 'express'
import * as apiKeys from '../lib/api-keys.js'
import * as pianoApi from '../lib/piano-api.js'
import type { PianoPublisher } from '../lib/piano-api.js'

const router = Router()

function getDateRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 1)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

function getPianoPublishers(): PianoPublisher[] {
  const keys = apiKeys.listApiKeys()
  const publishers: PianoPublisher[] = []
  for (const key of keys) {
    if (key.type === 'piano_esp' && typeof key.key === 'object' && key.key !== null) {
      const espKey = key.key as { siteId?: string; apiKey?: string; baseUrl?: string }
      if (espKey.siteId && espKey.apiKey && espKey.baseUrl) {
        const validBaseUrls: PianoPublisher['baseUrl'][] = [
          'https://api-esp.piano.io',
          'https://api-esp-eu.piano.io',
          'http://sandbox-api-esp.piano.io',
        ]
        if (validBaseUrls.includes(espKey.baseUrl as PianoPublisher['baseUrl'])) {
          publishers.push({
            id: key.hash,
            name: key.name,
            siteId: espKey.siteId,
            apiKey: espKey.apiKey,
            baseUrl: espKey.baseUrl as PianoPublisher['baseUrl'],
          })
        }
      }
    }
  }
  return publishers
}

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const allPublishers = getPianoPublishers()
    if (allPublishers.length === 0) {
      return res.json({ openRate: 0, clickRate: 0, subscribersTotal: 0, subscribersActive: 0 })
    }

    const { start, end } = getDateRange()
    let totalSent = 0
    let totalOpened = 0
    let totalClicked = 0
    let totalSubscribers = 0
    let totalActive = 0

    for (const publisher of allPublishers) {
      try {
        const metrics = await pianoApi.getPublisherMetrics(publisher, start, end)
        totalSubscribers += metrics.subscribersTotal
        totalActive += metrics.subscribersActive

        const campaigns = await pianoApi.getActiveCampaigns(publisher)
        if (campaigns.length > 0) {
          const campaignIds = campaigns.map((c) => c.Id)
          const stats = await pianoApi.getCampaignStats(publisher, campaignIds, start, end)
          totalSent += stats.deliverability.totalsForSelectedTime.sent
          totalOpened += stats.performance.totalsForSelectedTime.open
          totalClicked += stats.performance.totalsForSelectedTime.click
        }
      } catch (e) {
        console.error(`Error fetching metrics for publisher ${publisher.name} (${publisher.id}):`, e)
      }
    }

    const openRate = totalSent > 0 ? totalOpened / totalSent : 0
    const clickRate = totalSent > 0 ? totalClicked / totalSent : 0

    res.json({
      openRate: Math.round(openRate * 10000) / 100,
      clickRate: Math.round(clickRate * 10000) / 100,
      subscribersTotal: totalSubscribers,
      subscribersActive: totalActive,
    })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router
