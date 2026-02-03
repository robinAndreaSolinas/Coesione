import { ref, watch } from 'vue'

const STORAGE_KEY = 'coesione-goals'

export interface SectionGoals {
  [key: string]: string
}

export interface GoalsState {
  social: SectionGoals
  video: SectionGoals
  newsletter: SectionGoals
  siti: SectionGoals
  sondaggi: SectionGoals
  totale: SectionGoals
}

const defaultGoals: GoalsState = {
  social: {
    like: '50K',
    condivisioni: '15K',
    commenti: '5K',
    reach: '150K',
    target: '150K',
    targetPercent: '100',
  },
  video: {
    visualizzazioni: '1M',
    minuti: '200K',
    completionRate: '70%',
    iscritti: '3K',
    target: '1M',
    targetPercent: '100',
  },
  newsletter: {
    iscritti: '50K',
    openRate: '45%',
    clickRate: '15%',
    unsubscribe: '1%',
    target: '50K',
    targetPercent: '100',
  },
  siti: {
    pagineViste: '1.5M',
    utentiUnici: '350K',
    durataMedia: '4m',
    bounceRate: '40%',
    target: '350K',
    targetPercent: '100',
  },
  sondaggi: {
    sondaggiAttivi: '15',
    risposte: '10K',
    completionRate: '80%',
    mediaRisposte: '800',
    target: '10K',
    targetPercent: '100',
  },
  totale: {
    social: '150K',
    video: '1M',
    newsletter: '50K',
    siti: '350K',
    target: '100',
    targetPercent: '100',
  },
}

function loadGoals(): GoalsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultGoals, ...JSON.parse(stored) }
    }
  } catch {
    // ignore
  }
  return JSON.parse(JSON.stringify(defaultGoals))
}

const goals = ref<GoalsState>(loadGoals())

watch(
  goals,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true }
)

export function useGoals() {
  return { goals }
}
