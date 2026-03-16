import { computed } from 'vue'
import { useObjectives } from './useObjectives'
import { useCategoryProgress } from './useCategoryProgress'
import { useMetrics, type MetricForView } from './useMetrics'

function fmtGoal(v: number, u: string): string {
  if (u === '%') return `${v}%`
  if (u === 'K') return `${v}K`
  if (u === 'M') return `${v}M`
  return String(v)
}

export function useReportData() {
  const { objectives } = useObjectives()
  const { progressByCategory } = useCategoryProgress()
  const { metricsForView } = useMetrics()

  const reportSections = computed(() => {
    const progressMap = Object.fromEntries(
      progressByCategory.value.map((p) => [p.category, p.value])
    )

    const metricIndex: Record<string, Record<string, MetricForView>> = {}
    metricsForView.value.forEach((m) => {
      const cat = m.category
      if (!metricIndex[cat]) {
        metricIndex[cat] = {}
      }
      metricIndex[cat][m.title.toLowerCase()] = m
    })

    const byCategory: Record<
      string,
      {
        title: string
        metrics: { label: string; goal: string; obtained: string; progress: number }[]
      }
    > = {}

    objectives.value.forEach((obj) => {
      const cat = obj.category
      if (!byCategory[cat]) {
        byCategory[cat] = { title: cat, metrics: [] }
      }

      const defaultProgress = progressMap[cat] ?? 0
      const metric = metricIndex[cat]?.[obj.title.toLowerCase()]
      const goalLabel = fmtGoal(obj.value, obj.unit)
      const obtainedLabel = metric ? metric.currentLabel : '—'
      const progress = metric ? metric.progress : defaultProgress

      byCategory[cat].metrics.push({
        label: obj.title,
        goal: goalLabel,
        obtained: obtainedLabel,
        progress,
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

