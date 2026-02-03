import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'coesione-dev-secret-change-in-prod'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Token mancante' })
    return
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    ;(req as Request & { user: JwtPayload }).user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Token non valido' })
  }
}

export { JWT_SECRET }
