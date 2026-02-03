const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const BACKEND = 'http://server:3001'
const DIST = path.join(__dirname, 'dist')

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
}

function serveStatic(url, res) {
  const file = path.join(DIST, url === '/' ? 'index.html' : url.split('?')[0])
  const safe = path.resolve(file)
  if (!safe.startsWith(path.resolve(DIST))) {
    res.writeHead(403).end()
    return
  }
  if (!fs.existsSync(safe) || !fs.statSync(safe).isFile()) {
    const fallback = path.join(DIST, 'index.html')
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(fs.readFileSync(fallback))
    return
  }
  const ext = path.extname(safe)
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' })
  res.end(fs.readFileSync(safe))
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api')) {
    const url = `${BACKEND}${req.url}`
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', async () => {
      try {
        const body = req.method !== 'GET' && req.method !== 'HEAD' ? Buffer.concat(chunks) : undefined
        const headers = { ...req.headers, host: 'server:3001' }
        delete headers['content-length']
        const r = await fetch(url, { method: req.method, headers, body })
        const buf = await r.arrayBuffer()
        res.writeHead(r.status, Object.fromEntries(r.headers.entries()))
        res.end(Buffer.from(buf))
      } catch (e) {
        res.writeHead(502).end()
      }
    })
    return
  }
  serveStatic(req.url, res)
})

server.listen(3000, () => console.log('Listening on 3000'))
