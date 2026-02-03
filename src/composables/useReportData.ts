import { computed } from 'vue'
import { useObjectives } from './useObjectives'

export function useReportData() {
  const { objectives } = useObjectives()

  const reportSections = computed(() => {
    const byCategory: Record<string, { title: string; metrics: { label: string; value: string; goal: string }[] }> = {}
    objectives.value.forEach((obj) => {
      const cat = obj.category
      if (!byCategory[cat]) {
        byCategory[cat] = { title: cat, metrics: [] }
      }
      byCategory[cat].metrics.push({
        label: obj.title,
        value: '-',
        goal: obj.goal,
      })
    })
    return Object.values(byCategory).map((s) => ({
      ...s,
      title: s.title.charAt(0).toUpperCase() + s.title.slice(1),
      progress: 0,
      targetLabel: '-',
    }))
  })

  return { reportSections }
}
