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
    engagementRate: '5%',
    views: '2M',
    audience: '500K',
    condivisioni: '10K',
    commenti: '5K',
    reach: '3M',
    target: '5%',
    targetPercent: '100',
  },
  video: {
    audience: '200K',
    minuti: '1M',
    completionRate: '70%',
    target: '70%',
    targetPercent: '100',
  },
  newsletter: {
    openRate: '40%',
    clickRate: '5%',
    iscrittiTotali: '10K',
    iscrittiAttivi: '8K',
    target: '40%',
    targetPercent: '100',
  },
  siti: {
    utentiUniciArticoli: '50K',
    pagineVisteArticoli: '1.5M',
    articoliPubblicati: '500',
    target: '50K',
    targetPercent: '100',
  },
  sondaggi: {
    numeroSondaggi: '10',
    risposteTotali: '20K',
    completionRate: '80%',
    mediaRisposte: '50',
    target: '20K',
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
