export interface PianoPublisher {
  id: string
  name: string
  siteId: string
  apiKey: string
  baseUrl: 'https://api-esp.piano.io' | 'https://api-esp-eu.piano.io' | 'http://sandbox-api-esp.piano.io'
}

interface Campaign {
  Id: number
  Name: string
  Active: number
}

interface CampaignStats {
  deliverability: {
    totalsForSelectedTime: {
      sent: number
    }
  }
  performance: {
    totalsForSelectedTime: {
      open: number
      click: number
    }
  }
}

interface MailingList {
  Id: number
  Name: string
}

interface SubscribersResponse {
  [sqId: string]: {
    squad_users: number
    squad_users_active: number
  }
}

export interface NewsletterMetrics {
  openRate: number
  clickRate: number
  subscribersTotal: number
  subscribersActive: number
}

async function fetchPiano<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`Piano API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function getActiveCampaigns(publisher: PianoPublisher): Promise<Campaign[]> {
  const url = `${publisher.baseUrl}/publisher/list/${publisher.siteId}?api_key=${publisher.apiKey}`
  const data = await fetchPiano<{ lists: Campaign[] }>(url)
  return data.lists.filter((c) => c.Active === 1)
}

export async function getCampaignStats(
  publisher: PianoPublisher,
  campaignIds: number[],
  dateStart: string,
  dateEnd: string
): Promise<CampaignStats> {
  const campIds = campaignIds.join(',')
  const url = `${publisher.baseUrl}/stats/campaigns/full/${campIds}?date_start=${dateStart}&date_end=${dateEnd}&api_key=${publisher.apiKey}`
  return fetchPiano<CampaignStats>(url)
}

export async function getCampaignMailingLists(publisher: PianoPublisher, campaignId: number): Promise<MailingList[]> {
  const url = `${publisher.baseUrl}/publisher/pub/${publisher.siteId}/ml/${campaignId}/sq?api_key=${publisher.apiKey}`
  return fetchPiano<MailingList[]>(url)
}

export async function getSubscribers(publisher: PianoPublisher, sqIds: number[]): Promise<SubscribersResponse> {
  const url = `${publisher.baseUrl}/publisher/pub/${publisher.siteId}/sq/subscribers?api_key=${publisher.apiKey}`
  return fetchPiano<SubscribersResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ sqIds }),
  })
}

export async function getPublisherMetrics(publisher: PianoPublisher, dateStart: string, dateEnd: string): Promise<NewsletterMetrics> {
  const campaigns = await getActiveCampaigns(publisher)
  if (campaigns.length === 0) {
    return { openRate: 0, clickRate: 0, subscribersTotal: 0, subscribersActive: 0 }
  }

  const campaignIds = campaigns.map((c) => c.Id)
  const stats = await getCampaignStats(publisher, campaignIds, dateStart, dateEnd)

  const allSqIds: number[] = []
  for (const campaign of campaigns) {
    const lists = await getCampaignMailingLists(publisher, campaign.Id)
    allSqIds.push(...lists.map((l) => l.Id))
  }

  const uniqueSqIds = [...new Set(allSqIds)]
  const subscribers = uniqueSqIds.length > 0 ? await getSubscribers(publisher, uniqueSqIds) : {}

  let subscribersTotal = 0
  let subscribersActive = 0
  for (const sqId of uniqueSqIds) {
    const sub = subscribers[String(sqId)]
    if (sub) {
      subscribersTotal += sub.squad_users
      subscribersActive += sub.squad_users_active
    }
  }

  const sent = stats.deliverability.totalsForSelectedTime.sent
  const opened = stats.performance.totalsForSelectedTime.open
  const clicked = stats.performance.totalsForSelectedTime.click

  const openRate = sent > 0 ? opened / sent : 0
  const clickRate = sent > 0 ? clicked / sent : 0

  return {
    openRate,
    clickRate,
    subscribersTotal,
    subscribersActive,
  }
}
