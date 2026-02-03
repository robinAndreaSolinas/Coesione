import { computed } from 'vue'
import { useObjectives } from './useObjectives'
import { useCategoryProgress } from './useCategoryProgress'

function fmtGoal(v: number, u: string): string {
  if (u === '%') return `${v}%`
  if (u === 'K') return `${v}K`
  if (u === 'M') return `${v}M`
  return String(v)
}

export function useReportData() {
  const { objectives } = useObjectives()
  const { progressByCategory } = useCategoryProgress()

  const reportSections = computed(() => {
    const progressMap = Object.fromEntries(
      progressByCategory.value.map((p) => [p.category, p.value])
    )
    const byCategory: Record<
      string,
      { title: string; metrics: { label: string; goal: string; progress: number }[] }
    > = {}
    objectives.value.forEach((obj) => {
      const cat = obj.category
      if (!byCategory[cat]) {
        byCategory[cat] = { title: cat, metrics: [] }
      }
      const progress = progressMap[cat] ?? 0
      byCategory[cat].metrics.push({
        label: obj.title,
        goal: fmtGoal(obj.value, obj.unit),
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
