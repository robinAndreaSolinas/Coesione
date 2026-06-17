/** Arrotonda per visualizzazione (max 2 decimali). */
export function roundMetricDisplay(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function formatDisplayValue(value: number, unit: string, decimals = 2): string {
  const v = roundMetricDisplay(value, decimals)
  if (unit === '%') return `${v}%`
  if (unit === 'K') return `${v}K`
  if (unit === 'M') return `${v}M`
  if (unit === '-') return String(v)
  return String(v)
}
