import { computed } from 'vue'
import { useObjectives } from './useObjectives'
import { useCategoryProgress } from './useCategoryProgress'
import { useMetrics } from './useMetrics'

export function useReportData() {
  const { objectives } = useObjectives()
  const { progressByCategory } = useCategoryProgress()
  const { metricsForView } = useMetrics()

  const reportSections = computed(() => {
    const progressMap = Object.fromEntries(
      progressByCategory.value.map((p) => [p.category, p.value])
    )

    const objectiveById = new Map(objectives.value.map((o) => [o.id, o]))

    const byCategory: Record<
      string,
      {
        title: string
        metrics: { label: string; goal: string; obtained: string; progress: number }[]
      }
    > = {}

    metricsForView.value.forEach((metric) => {
      const cat = metric.category
      if (!byCategory[cat]) {
        byCategory[cat] = { title: cat, metrics: [] }
      }

      const objective = objectiveById.get(metric.key)
      const label = objective?.title || metric.title

      byCategory[cat].metrics.push({
        label,
        goal: metric.goalLabel,
        obtained: metric.currentLabel,
        progress: metric.progress,
      })
    })

    return Object.entries(byCategory).map(([cat, s]) => ({
      ...s,
      title: s.title.charAt(0).toUpperCase() + s.title.slice(1),
      categoryProgress: progressMap[cat] ?? 0,
    }))
  })

  return { reportSections }
}

