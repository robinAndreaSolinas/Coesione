import './types/express.js'
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import pagesRoutes from './routes/pages.js'
import objectivesRoutes from './routes/objectives.js'
import apiKeysRoutes from './routes/api-keys.js'
import newsletterRoutes from './routes/newsletter.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const staticDir = process.env.STATIC_DIR || path.join(process.cwd(), 'static')

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', usersRoutes)
app.use('/api/v1/pages', pagesRoutes)
app.use('/api/v1/objectives', objectivesRoutes)
app.use('/api/v1/api-keys', apiKeysRoutes)
app.use('/api/v1/newsletter', newsletterRoutes)

app.get('/api/v1/health', (_req, res) => res.json({ ok: true }))

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})
