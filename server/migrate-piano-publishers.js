#!/usr/bin/env node

/**
 * Script di migrazione: sposta i publisher Piano ESP da piano-publishers.json a api-keys.json
 * Uso: node migrate-piano-publishers.js
 */

import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')
const PUBLISHERS_FILE = path.join(DATA_DIR, 'piano-publishers.json')
const KEYS_FILE = path.join(DATA_DIR, 'api-keys.json')

function loadPublishers() {
  try {
    const raw = fs.readFileSync(PUBLISHERS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data.publishers) ? data.publishers : []
  } catch {
    return []
  }
}

function loadApiKeys() {
  try {
    const raw = fs.readFileSync(KEYS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data.keys) ? data.keys : []
  } catch {
    return []
  }
}

function saveApiKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify({ keys }, null, 2), 'utf-8')
}

const publishers = loadPublishers()
if (publishers.length === 0) {
  console.log('Nessun publisher da migrare.')
  process.exit(0)
}

const apiKeys = loadApiKeys()
let migrated = 0

for (const pub of publishers) {
  const existingKey = apiKeys.find(
    (k) =>
      k.type === 'piano_esp' &&
      typeof k.key === 'object' &&
      k.key !== null &&
      k.key.siteId === pub.siteId &&
      k.key.baseUrl === pub.baseUrl
  )

  if (existingKey) {
    console.log(`⚠️  Publisher "${pub.name}" già presente in api-keys.json, saltato`)
    continue
  }

  const newKey = {
    hash: `migrated_${pub.id}`,
    name: pub.name,
    source: 'Piano.io',
    type: 'piano_esp',
    key: {
      siteId: pub.siteId,
      apiKey: pub.apiKey,
      baseUrl: pub.baseUrl,
    },
    createdAt: pub.createdAt || Date.now(),
  }

  apiKeys.push(newKey)
  migrated++
  console.log(`✅ Migrato: ${pub.name} (${pub.siteId})`)
}

if (migrated > 0) {
  saveApiKeys(apiKeys)
  console.log(`\n✅ Migrazione completata: ${migrated} publisher migrati`)
  console.log(`\n⚠️  Ricorda di:`)
  console.log(`   1. Verificare che le API key siano corrette`)
  console.log(`   2. Eliminare manualmente piano-publishers.json se tutto è ok`)
} else {
  console.log('\nNessun publisher migrato.')
}
