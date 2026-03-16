import { ref, onMounted } from 'vue'
import { api, type NewsletterDailyPoint } from '@/api/client'

const dailyPoints = ref<NewsletterDailyPoint[]>([])

export function useNewsletterDaily() {
  async function loadDaily() {
    try {
      dailyPoints.value = await api.newsletter.getDailyMetrics()
    } catch {
      dailyPoints.value = []
    }
  }

  onMounted(loadDaily)

  return {
    dailyPoints,
    loadDaily,
  }
}

