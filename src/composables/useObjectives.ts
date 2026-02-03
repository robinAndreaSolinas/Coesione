import { ref, watch } from 'vue'

const STORAGE_KEY = 'coesione-objectives'

export interface Objective {
  id: string
  title: string
  category: 'social' | 'video' | 'newsletter' | 'siti' | 'sondaggi'
  path: string
  goal: string
}

const defaultObjectives: Objective[] = [
  { id: 'engagement-rate', title: 'Engagement rate (engage/reach)', category: 'social', path: '/social', goal: '5%' },
  { id: 'utenti-unici', title: 'Utenti unici giornalieri', category: 'siti', path: '/siti', goal: '50K' },
  { id: 'audience-video', title: 'Audience video', category: 'video', path: '/video', goal: '1M' },
  { id: 'survey-newsletter', title: 'Survey newsletter', category: 'sondaggi', path: '/sondaggi', goal: '10K' },
  { id: 'articoli-pubblicati', title: 'Numero articoli pubblicati', category: 'siti', path: '/siti', goal: '500' },
  { id: 'pagine-viste', title: 'Pagine viste', category: 'siti', path: '/siti', goal: '1.5M' },
  { id: 'newsletter-rate', title: 'Newsletter open rate e click rate', category: 'newsletter', path: '/newsletter', goal: '45% / 15%' },
]

function loadObjectives(): Objective[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return defaultObjectives.map((d) => {
        const saved = parsed.find((p: Objective) => p.id === d.id)
        return saved ? { ...d, ...saved } : d
      })
    }
  } catch {
    // ignore
  }
  return JSON.parse(JSON.stringify(defaultObjectives))
}

const objectives = ref<Objective[]>(loadObjectives())

watch(
  objectives,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true }
)

export function useObjectives() {
  return { objectives }
}
