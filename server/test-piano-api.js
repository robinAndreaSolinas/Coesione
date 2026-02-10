#!/usr/bin/env node

/**
 * Script di test per l'integrazione Piano ESP API
 * Uso: node test-piano-api.js
 */

import * as publishers from './src/lib/piano-publishers.js'
import * as pianoApi from './src/lib/piano-api.js'

const TEST_PUBLISHER = {
  name: 'Test Publisher',
  siteId: process.env.PIANO_SITE_ID || '557',
  apiKey: process.env.PIANO_API_KEY || '',
  baseUrl: (process.env.PIANO_BASE_URL || 'https://api-esp.piano.io'),
}

async function testPublishers() {
  console.log('🧪 Test Piano ESP API Integration\n')
  console.log('=' .repeat(50))

  // Test 1: Lista publisher
  console.log('\n📋 Test 1: Lista publisher')
  const allPublishers = publishers.listPublishers()
  console.log(`Trovati ${allPublishers.length} publisher:`)
  allPublishers.forEach((p) => {
    console.log(`  - ${p.name} (${p.siteId}) - ${p.baseUrl}`)
  })

  if (allPublishers.length === 0) {
    console.log('\n⚠️  Nessun publisher configurato.')
    console.log('   Aggiungi un publisher tramite:')
    console.log('   1. UI: /admin/api-management')
    console.log('   2. API: POST /api/v1/publishers')
    console.log('   3. Questo script (vedi sotto)')
    return
  }

  // Test 2: Test API Piano ESP per ogni publisher
  console.log('\n📊 Test 2: Chiamate API Piano ESP')
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 1)
  const dateStart = start.toISOString().split('T')[0]
  const dateEnd = end.toISOString().split('T')[0]

  console.log(`Periodo: ${dateStart} → ${dateEnd}`)

  for (const publisher of allPublishers) {
    console.log(`\n  Publisher: ${publisher.name}`)
    try {
      // Test campagne attive
      console.log('    → Recupero campagne attive...')
      const campaigns = await pianoApi.getActiveCampaigns(publisher)
      console.log(`    ✅ Trovate ${campaigns.length} campagne attive`)

      if (campaigns.length > 0) {
        const campaignIds = campaigns.map((c) => c.Id)
        console.log(`    → Campagne: ${campaignIds.join(', ')}`)

        // Test statistiche campagne
        console.log('    → Recupero statistiche campagne...')
        const stats = await pianoApi.getCampaignStats(publisher, campaignIds, dateStart, dateEnd)
        console.log(`    ✅ Statistiche recuperate:`)
        console.log(`       Sent: ${stats.deliverability?.totalsForSelectedTime?.sent || 0}`)
        console.log(`       Opened: ${stats.performance?.totalsForSelectedTime?.open || 0}`)
        console.log(`       Clicked: ${stats.performance?.totalsForSelectedTime?.click || 0}`)

        // Test mailing lists
        console.log('    → Recupero mailing lists...')
        const sqIds = new Set()
        for (const campaignId of campaignIds) {
          const lists = await pianoApi.getCampaignMailingLists(publisher, campaignId)
          lists.forEach((list) => sqIds.add(list.SQ_ID))
        }
        console.log(`    ✅ Trovate ${sqIds.size} mailing lists uniche`)

        if (sqIds.size > 0) {
          // Test subscribers
          console.log('    → Recupero subscribers...')
          const subscribers = await pianoApi.getSubscribers(publisher, Array.from(sqIds))
          console.log(`    ✅ Subscribers:`)
          console.log(`       Totali: ${subscribers.total}`)
          console.log(`       Attivi: ${subscribers.active}`)
        }
      }

      // Test metriche aggregate
      console.log('    → Calcolo metriche aggregate...')
      const metrics = await pianoApi.getPublisherMetrics(publisher, dateStart, dateEnd)
      console.log(`    ✅ Metriche:`)
      console.log(`       Open Rate: ${metrics.openRate.toFixed(2)}%`)
      console.log(`       Click Rate: ${metrics.clickRate.toFixed(2)}%`)
      console.log(`       Subscribers Total: ${metrics.subscribersTotal}`)
      console.log(`       Subscribers Active: ${metrics.subscribersActive}`)
    } catch (error) {
      console.error(`    ❌ Errore: ${error.message}`)
      if (error.message.includes('401') || error.message.includes('403')) {
        console.error('       Verifica Site ID e API Key')
      }
    }
  }

  console.log('\n✅ Test completati!')
}

// Esegui test
testPublishers().catch((error) => {
  console.error('\n❌ Errore durante i test:', error)
  process.exit(1)
})
