import { ref, onMounted, computed } from 'vue'
import { api, type ApiMetricSummary } from '@/api/client'

export type MetricCategory = 'social' | 'video' | 'newsletter' | 'siti' | 'sondaggi'

export interface MetricSummary {
  category: MetricCategory
  key: string
  title: string
  unit: string
  goal: number
  current: number
}

export interface MetricValue {
  unit: string
  goal: number
  current: number
}

export interface MetricForView extends MetricSummary {
  progress: number
  currentLabel: string
  goalLabel: string
}

type MetricsByCategory = Record<string, Record<string, MetricValue>>

const metrics = ref<MetricSummary[]>([])

function denormalizeValue(value: number, unit: string): number {
  if (unit === '%') return value * 100
  if (unit === 'K') return value / 1_000
  if (unit === 'M') return value / 1_000_000
  return value
}

function formatMetricValue(value: number, unit: string): string {
  const rounded = Math.round(value * 10) / 10
  if (unit === '%') return `${rounded}%`
  if (unit === 'K') return `${rounded}K`
  if (unit === 'M') return `${rounded}M`
  return String(rounded)
}

export function useMetrics() {
  async function loadMetrics() {
    try {
      const rows = await api.metrics.summary()
      metrics.value = rows.map((r: ApiMetricSummary) => {
        const category = r.category as MetricCategory
        const goal = denormalizeValue(r.goal, r.unit)
        const current = denormalizeValue(r.current, r.unit)
        return {
          category,
          key: r.key,
          title: r.title,
          unit: r.unit,
          goal,
          current,
        }
      })
    } catch {
      metrics.value = []
    }
  }

  const byCategory = computed<MetricsByCategory>(() => {
    const result: MetricsByCategory = {}
    metrics.value.forEach((m) => {
      if (!result[m.category]) {
        result[m.category] = {}
      }
      result[m.category][m.key] = {
        unit: m.unit,
        goal: m.goal,
        current: m.current,
      }
    })
    return result
  })

  const metricsForView = computed<MetricForView[]>(() =>
    metrics.value.map((m) => {
      const progress =
        m.goal > 0 ? Math.round((m.current / m.goal) * 100) : 0
      return {
        ...m,
        progress,
        currentLabel: formatMetricValue(m.current, m.unit),
        goalLabel: formatMetricValue(m.goal, m.unit),
      }
    })
  )

  onMounted(loadMetrics)

  return {
    metrics,
    byCategory,
    metricsForView,
    loadMetrics,
    formatMetricValue,
  }
}

