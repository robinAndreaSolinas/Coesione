import { ref, onMounted, computed } from 'vue'
import { api, type SiteMetrics } from '@/api/client'

const loading = ref(false)
const error = ref<string | null>(null)
const metrics = ref<SiteMetrics | null>(null)

export function useSiteMetrics() {
  async function load() {
    try {
      loading.value = true
      error.value = null
      metrics.value = await api.site.getMetrics()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Errore nel caricamento delle metriche sito'
      metrics.value = null
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  const uniqueUsers = computed(() => metrics.value?.uniqueUsers ?? 0)
  const pageviews = computed(() => metrics.value?.pageviews ?? 0)
  const articlesDigitalCount = computed(() => metrics.value?.articlesDigitalCount ?? 0)
  const articlesPrintedCount = computed(() => metrics.value?.articlesPrintedCount ?? 0)
  const articlesPublishedCount = computed(() => metrics.value?.articlesPublishedCount ?? 0)

  return {
    loading,
    error,
    metrics,
    uniqueUsers,
    pageviews,
    articlesDigitalCount,
    articlesPrintedCount,
    articlesPublishedCount,
    reload: load,
  }
}
