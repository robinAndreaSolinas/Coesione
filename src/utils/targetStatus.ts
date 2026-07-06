export type TargetStatus = 'above' | 'below'

export function targetStatusFromValues(
  current: number | null | undefined,
  goal: number | null | undefined,
): TargetStatus | null {
  if (current == null || goal == null || !Number.isFinite(current) || !Number.isFinite(goal)) {
    return null
  }
  if (goal <= 0) return null
  return current >= goal ? 'above' : 'below'
}
