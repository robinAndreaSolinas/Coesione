/** Card visibili in overview Totale */
export function isVisibleOnTotale(id: string): boolean {
  if (id === 'social-comments') return false
  if (id === 'social-interactions') return false
  if (id === 'social-reach') return false
  if (id === 'surveys-average-responses') return false
  if (id === 'newsletter-feedback-positive') return false
  if (id === 'sondaggi-regional-development-understanding') return false
  if (id === 'sondaggi-cohesion-advocacy') return false
  if (id === 'sondaggi-satisfaction-rate') return false
  if (id === 'social-instagram-reach' || id === 'social-tiktok-reach') return true
  if (/^social-(facebook|instagram|x|tiktok)-/.test(id)) return false
  return true
}

/** Obiettivi informativi o senza target nel conteggio progress */
export function countsTowardTotaleProgress(id: string): boolean {
  if (id === 'newsletter-subscribers-active') return false
  if (id === 'newsletter-feedback-positive') return false
  if (id === 'sondaggi-regional-development-understanding') return false
  if (id === 'sondaggi-cohesion-advocacy') return false
  if (id === 'sondaggi-satisfaction-rate') return false
  return isVisibleOnTotale(id)
}
