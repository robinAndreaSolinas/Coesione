import fs from 'node:fs'
import path from 'node:path'

/** Carica .env.local dalla root del progetto quando il server gira da `server/`. */
export function loadEnvFromProjectRoot(): void {
  const candidates = [
    path.join(process.cwd(), '../.env.local'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '../.env'),
    path.join(process.cwd(), '.env'),
  ]
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue
    const content = fs.readFileSync(file, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) {
        process.env[key] = val
      }
    }
  }
}
