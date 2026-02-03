import { computed } from 'vue'

const CATEGORY_LABELS: Record<string, string> = {
  social: 'Social',
  video: 'Video',
  newsletter: 'Newsletter',
  siti: 'Siti',
  sondaggi: 'Sondaggi',
}

export function useCategoryProgress() {
  const progressByCategory = computed(() => {
    const defaults: Record<string, number> = {
      social: 85,
      video: 72,
      newsletter: 90,
      siti: 68,
      sondaggi: 78,
    }
    const categories = ['social', 'video', 'newsletter', 'siti', 'sondaggi'] as const
    return categories.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      value: defaults[cat] ?? 75,
    }))
  })

  return { progressByCategory }
}
