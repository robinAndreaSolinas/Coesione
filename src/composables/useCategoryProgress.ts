import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMetrics } from './useMetrics'
import { hasSectionBollino, bollinoStatus } from '@/utils/totaleObjectives'

/** Categorie del dettaglio (bollini per sezione). */
const CATEGORIES = ['social', 'video', 'newsletter', 'siti', 'sondaggi'] as const

/**
 * % per categoria = bollini verdi / (verdi + rossi) della sezione.
 * Verde = target superato, rosso = non ancora.
 */
export function useCategoryProgress() {
  const { t } = useI18n()
  const { metrics } = useMetrics()

  function bolliniForCategory(category: string) {
    const rows = metrics.value.filter(
      (m) => m.category === category && hasSectionBollino(m.key),
    )
    let green = 0
    let red = 0
    for (const m of rows) {
      const status = bollinoStatus(m.current, m.goal)
      if (status === 'above') green += 1
      else if (status === 'below') red += 1
    }
    const total = green + red
    const value = total > 0 ? Math.round((green / total) * 100) : 0
    return { green, red, total, value }
  }

  const progressByCategory = computed(() => {
    return CATEGORIES.map((cat) => {
      const { value } = bolliniForCategory(cat)
      return {
        category: cat,
        label: t(`categories.${cat}`),
        value,
      }
    })
  })

  const overallGoalsStats = computed(() => {
    let reachedGoals = 0
    let notReachedGoals = 0
    for (const cat of CATEGORIES) {
      const { green, red } = bolliniForCategory(cat)
      reachedGoals += green
      notReachedGoals += red
    }
    const totalGoals = reachedGoals + notReachedGoals
    const reachedPercent = totalGoals > 0 ? Math.round((reachedGoals / totalGoals) * 100) : 0
    return { totalGoals, reachedGoals, notReachedGoals, reachedPercent }
  })

  return { progressByCategory, overallGoalsStats }
}
