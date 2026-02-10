import { ref, onMounted } from 'vue'
import { api, type NewsletterMetrics } from '@/api/client'

const metrics = ref<NewsletterMetrics>({
  openRate: 0,
  clickRate: 0,
  subscribersTotal: 0,
  subscribersActive: 0,
})

export function useNewsletter() {
  async function loadMetrics() {
    try {
      metrics.value = await api.newsletter.getMetrics()
    } catch {
      metrics.value = { openRate: 0, clickRate: 0, subscribersTotal: 0, subscribersActive: 0 }
    }
  }

  function formatNumber(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return String(Math.round(value))
  }

  function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`
  }

  onMounted(loadMetrics)

  return {
    metrics,
    loadMetrics,
    formatNumber,
    formatPercent,
  }
}
