import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMetrics } from './useMetrics'

import { isVisibleOnTotale, countsTowardTotaleProgress } from '@/utils/totaleObjectives'

export function useCategoryProgress() {
  const { t } = useI18n()
  const { metrics } = useMetrics()

  const progressByCategory = computed(() => {
    const categories = ['totale', 'social', 'video', 'newsletter', 'siti', 'sondaggi'] as const
    return categories.map((cat) => {
      const rows = metrics.value.filter(
        (m) => m.category === cat && countsTowardTotaleProgress(m.key),
      )
      const totalGoals = rows.length
      const reachedGoals = rows.filter((m) => m.goal > 0 && m.current >= m.goal).length
      const value = totalGoals > 0 ? Math.round((reachedGoals / totalGoals) * 100) : 0
      return {
        category: cat,
        label: t(`categories.${cat}`),
        value,
      }
    })
  })

  const overallGoalsStats = computed(() => {
    const rows = metrics.value.filter((m) => countsTowardTotaleProgress(m.key))
    const totalGoals = rows.length
    const reachedGoals = rows.filter((m) => m.goal > 0 && m.current >= m.goal).length
    const notReachedGoals = Math.max(totalGoals - reachedGoals, 0)
    const reachedPercent = totalGoals > 0 ? Math.round((reachedGoals / totalGoals) * 100) : 0
    return { totalGoals, reachedGoals, notReachedGoals, reachedPercent }
  })

  return { progressByCategory, overallGoalsStats }
}
