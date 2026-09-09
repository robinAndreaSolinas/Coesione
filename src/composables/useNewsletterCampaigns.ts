import { ref, onMounted } from 'vue'
import { api, type NewsletterCampaignRow } from '@/api/client'

const campaigns = ref<NewsletterCampaignRow[]>([])

export function useNewsletterCampaigns() {
  async function loadCampaigns() {
    try {
      const data = await api.newsletter.getCampaigns()
      campaigns.value = data.campaigns ?? []
    } catch {
      campaigns.value = []
    }
  }

  onMounted(loadCampaigns)

  return {
    campaigns,
    loadCampaigns,
  }
}
