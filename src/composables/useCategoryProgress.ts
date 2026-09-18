import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMetrics } from './useMetrics'

/** Categorie reali (non include `totale`, che è un singolo KPI overview). */
const CATEGORIES = ['social', 'video', 'newsletter', 'siti', 'sondaggi'] as const

/**
 * % obiettivi superati per categoria:
 * (obiettivi con current >= goal) / (obiettivi con goal > 0) * 100
 */
export function useCategoryProgress() {
  const { t } = useI18n()
  const { metrics } = useMetrics()

  const progressByCategory = computed(() => {
    return CATEGORIES.map((cat) => {
      const rows = metrics.value.filter((m) => m.category === cat && m.goal > 0)
      const totalGoals = rows.length
      const reachedGoals = rows.filter((m) => m.current >= m.goal).length
      const value = totalGoals > 0 ? Math.round((reachedGoals / totalGoals) * 100) : 0
      return {
        category: cat,
        label: t(`categories.${cat}`),
        value,
      }
    })
  })

  const overallGoalsStats = computed(() => {
    const rows = metrics.value.filter(
      (m) => CATEGORIES.includes(m.category as (typeof CATEGORIES)[number]) && m.goal > 0,
    )
    const totalGoals = rows.length
    const reachedGoals = rows.filter((m) => m.current >= m.goal).length
    const notReachedGoals = Math.max(totalGoals - reachedGoals, 0)
    const reachedPercent = totalGoals > 0 ? Math.round((reachedGoals / totalGoals) * 100) : 0
    return { totalGoals, reachedGoals, notReachedGoals, reachedPercent }
  })

  return { progressByCategory, overallGoalsStats }
}
