import { targetStatusFromValues } from '@/utils/targetStatus'

/**
 * Obiettivi che mostrano un bollino (verde/rosso) nella propria sezione.
 * Solo questi entrano nel dettaglio % per categoria e nel pie complessivo.
 */
const SECTION_BOLLINO_IDS = new Set<string>([
  // Social — 10 bollini (card con target su /social)
  'social-engagement-rate',
  'social-posts-count',
  'social-facebook-post-count',
  'social-instagram-engagement-rate',
  'social-instagram-reach',
  'social-instagram-post-count',
  'social-tiktok-engagement-rate',
  'social-tiktok-reach',
  'social-tiktok-post-count',
  'social-x-post-count',

  // Video — 2 bollini (minuti guardati non ha target in UI)
  'video-audiovisual-count',
  'video-audience',

  // Newsletter — 3 bollini (destinatari senza target, feedback placeholder)
  'newsletter-open-rate',
  'newsletter-click-rate',
  'newsletter-sent',

  // Siti — 4 bollini (stampati = placeholder senza current)
  'articles-unique-users',
  'articles-pageviews',
  'articles-published-count',
  'articles-digital-count',

  // Sondaggi — 4 bollini operativi (placeholder qualitativi esclusi se senza current)
  'surveys-count',
  'surveys-participants-count',
  'surveys-total-responses',
  'sondaggi-engagement-rate',
])

/** True se l'obiettivo ha un bollino target nella sua sezione. */
export function hasSectionBollino(id: string): boolean {
  return SECTION_BOLLINO_IDS.has(id)
}

/** Card visibili in overview Totale */
export function isVisibleOnTotale(id: string): boolean {
  if (id === 'multimedia-engagement-rate') return true
  if (id === 'newsletter-subscribers-active') return true
  return hasSectionBollino(id)
}

/**
 * Entra nel conteggio progress (pie + dettaglio categoria):
 * solo obiettivi con bollino in sezione.
 */
export function countsTowardTotaleProgress(id: string): boolean {
  return hasSectionBollino(id)
}

/** Stato bollino da current/goal (null = nessun bollino). */
export function bollinoStatus(
  current: number | null | undefined,
  goal: number | null | undefined,
) {
  return targetStatusFromValues(current, goal)
}
