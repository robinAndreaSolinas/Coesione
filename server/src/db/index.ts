import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { runMigrations } from './schema.js'
import { seed } from './seed.js'

const dbDir = path.join(process.cwd(), 'data')
const dbPath = process.env.DB_PATH || path.join(dbDir, 'coesione.sqlite3')
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

export const db = new Database(dbPath)
runMigrations(db)
seed(db)
