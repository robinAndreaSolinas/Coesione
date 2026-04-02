import { computed, onMounted, ref } from 'vue'
import { api, type SocialSummaryData } from '@/api/client'

export function useSocialSummary() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const summary = ref<SocialSummaryData | null>(null)

  async function load() {
    try {
      loading.value = true
      error.value = null
      const resp = await api.social.summary()
      summary.value = resp?.data ?? null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Errore nel caricamento social'
      summary.value = null
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  const interactionsTotal = computed(() => summary.value?.interactionsTotal ?? 0)
  const audienceTotal = computed(() => summary.value?.audienceTotal ?? 0)
  const viewsTotal = computed(() => summary.value?.viewsTotal ?? 0)
  const sharesTotal = computed(() => summary.value?.sharesTotal ?? 0)
  const commentsTotal = computed(() => summary.value?.commentsTotal ?? 0)
  const engagementRateTotalPercent = computed(() => summary.value?.engagementRateTotalPercent ?? 0)
  const postsCount = computed(() => summary.value?.postsCount ?? 0)

  return {
    loading,
    error,
    summary,
    interactionsTotal,
    audienceTotal,
    viewsTotal,
    sharesTotal,
    commentsTotal,
    engagementRateTotalPercent,
    postsCount,
    reload: load,
  }
}

