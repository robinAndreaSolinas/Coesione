import { computed } from 'vue'
import { useMetrics } from './useMetrics'

const CATEGORY_LABELS: Record<string, string> = {
  social: 'Social',
  video: 'Video',
  newsletter: 'Newsletter',
  siti: 'Siti',
  sondaggi: 'Sondaggi',
}

export function useCategoryProgress() {
  const { metrics } = useMetrics()

  const progressByCategory = computed(() => {
    const categories = ['social', 'video', 'newsletter', 'siti', 'sondaggi'] as const
    return categories.map((cat) => {
      const rows = metrics.value.filter((m) => m.category === cat)
      const totalGoals = rows.length
      const reachedGoals = rows.filter((m) => m.goal > 0 && m.current >= m.goal).length
      const value = totalGoals > 0 ? Math.round((reachedGoals / totalGoals) * 100) : 0
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        value,
      }
    })
  })

  const overallGoalsStats = computed(() => {
    const rows = metrics.value
    const totalGoals = rows.length
    const reachedGoals = rows.filter((m) => m.goal > 0 && m.current >= m.goal).length
    const notReachedGoals = Math.max(totalGoals - reachedGoals, 0)
    const reachedPercent = totalGoals > 0 ? Math.round((reachedGoals / totalGoals) * 100) : 0
    return { totalGoals, reachedGoals, notReachedGoals, reachedPercent }
  })

  return { progressByCategory, overallGoalsStats }
}
