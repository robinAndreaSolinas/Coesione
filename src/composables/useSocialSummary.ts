import { computed, onMounted, ref } from 'vue'
import {
  api,
  type SocialDashboardData,
  type SocialPlatformsData,
  type SocialSummaryData,
} from '@/api/client'

/**
 * Carica /social/dashboard (summary + platforms + post/count allineati).
 * I conteggi post arrivano sempre da post/count (`all` + per piattaforma).
 */
export function useSocialSummary() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const summary = ref<SocialSummaryData | null>(null)
  const platforms = ref<SocialPlatformsData | null>(null)

  async function load() {
    try {
      loading.value = true
      error.value = null

      const resp = await api.social.dashboard()
      const data = resp?.data as SocialDashboardData | undefined
      if (!data) {
        summary.value = null
        platforms.value = null
        return
      }

      const postCount = data.postCount
      const postsTotal =
        postCount?.postsCount ??
        postCount?.all ??
        data.summary?.postsCount ??
        0

      summary.value = {
        ...data.summary,
        postsCount: postsTotal,
      }

      // Sovrascrive i postsCount piattaforma con i valori ufficiali di post/count
      platforms.value = {
        facebook: {
          ...data.platforms.facebook,
          postsCount: postCount?.facebook ?? data.platforms.facebook.postsCount ?? 0,
        },
        instagram: {
          ...data.platforms.instagram,
          postsCount: postCount?.instagram ?? data.platforms.instagram.postsCount ?? 0,
        },
        x: {
          ...data.platforms.x,
          postsCount: postCount?.x ?? data.platforms.x.postsCount ?? 0,
        },
        tiktok: {
          ...data.platforms.tiktok,
          postsCount: postCount?.tiktok ?? data.platforms.tiktok.postsCount ?? 0,
        },
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Errore nel caricamento social'
      summary.value = null
      platforms.value = null
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  const interactionsTotal = computed(() => summary.value?.interactionsTotal ?? 0)
  const reachTotal = computed(() => summary.value?.reachTotal ?? 0)
  const sharesTotal = computed(() => summary.value?.sharesTotal ?? 0)
  const commentsTotal = computed(() => summary.value?.commentsTotal ?? 0)
  const engagementRateTotalPercent = computed(() => summary.value?.engagementRateTotalPercent ?? 0)
  const postsCount = computed(() => summary.value?.postsCount ?? 0)

  return {
    loading,
    error,
    summary,
    platforms,
    interactionsTotal,
    reachTotal,
    sharesTotal,
    commentsTotal,
    engagementRateTotalPercent,
    postsCount,
    reload: load,
  }
}
