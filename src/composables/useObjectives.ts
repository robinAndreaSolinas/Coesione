import { ref, onMounted, computed } from 'vue'
import { api, type ApiObjective } from '@/api/client'

export interface Objective {
  id: string
  title: string
  category: 'social' | 'video' | 'newsletter' | 'siti' | 'sondaggi'
  path: string
  value: number
  unit: string
}

const objectives = ref<Objective[]>([])

function formatGoal(value: number, unit: string): string {
  if (unit === '%') return `${value}%`
  if (unit === 'K') return `${value}K`
  if (unit === 'M') return `${value}M`
  return String(value)
}

export function useObjectives() {
  async function loadObjectives() {
    try {
      const rows = await api.objectives.list()
      objectives.value = rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category as Objective['category'],
        path: r.path,
        value: r.value,
        unit: r.unit,
      }))
    } catch {
      objectives.value = []
    }
  }

  async function updateObjective(id: string, value: number, unit: string) {
    const updated = await api.objectives.update(id, { value, unit })
    const idx = objectives.value.findIndex((o) => o.id === id)
    if (idx >= 0) {
      objectives.value[idx] = {
        ...objectives.value[idx],
        value: updated.value,
        unit: updated.unit,
      }
    }
  }

  onMounted(loadObjectives)

  return {
    objectives,
    loadObjectives,
    updateObjective,
    formatGoal,
  }
}
