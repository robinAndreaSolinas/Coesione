/** Numero da un payload data API: intero nudo oppure envelope `{ data: n }`. */
export function numberFromApiPayload(payload: unknown): number {
  if (typeof payload === 'number' && Number.isFinite(payload)) return payload
  if (!payload || typeof payload !== 'object') return 0
  const record = payload as Record<string, unknown>
  for (const key of ['video_count', 'count', 'count_sent']) {
    if (typeof record[key] === 'number' && Number.isFinite(record[key])) return record[key]
  }
  const data = record.data
  if (typeof data === 'number' && Number.isFinite(data)) return data
  if (data && typeof data === 'object') {
    return numberFromApiPayload(data)
  }
  return 0
}

/** `month_avg` sia in `{ data: { month_avg } }` sia nel doppio envelope dell'API siti. */
export function monthAvgFromUniqueUsers(payload: unknown): number {
  const seen = new Set<unknown>()
  function walk(node: unknown, depth: number): number | null {
    if (!node || typeof node !== 'object' || depth > 5 || seen.has(node)) return null
    seen.add(node)
    const record = node as Record<string, unknown>
    if (typeof record.month_avg === 'number' && Number.isFinite(record.month_avg)) {
      return record.month_avg
    }
    if ('data' in record) {
      const inner = walk(record.data, depth + 1)
      if (inner != null) return inner
    }
    return null
  }
  return walk(payload, 0) ?? 0
}
