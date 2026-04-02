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

function normalizeValue(value: number, unit: string): number {
  if (unit === '%') return value / 100
  if (unit === 'K') return value * 1_000
  if (unit === 'M') return value * 1_000_000
  if (unit === '-') return value
  return value
}

function denormalizeValue(value: number, unit: string): number {
  if (unit === '%') return value * 100
  if (unit === 'K') return value / 1_000
  if (unit === 'M') return value / 1_000_000
  if (unit === '-') return value
  return value
}

function formatGoal(value: number, unit: string): string {
  // Qui `value` è già denormalizzato (valore \"visuale\")
  if (unit === '%') return `${Math.round(value)}%`
  if (unit === 'K') return `${value}K`
  if (unit === 'M') return `${value}M`
  if (unit === '-') return String(value)
  return String(value)
}

export function useObjectives() {
  async function loadObjectives() {
    try {
      const rows = await api.objectives.list()
      objectives.value = rows.map((r) => {
        const denorm = denormalizeValue(r.value, r.unit)
        return {
        id: r.id,
        title: r.title,
        category: r.category as Objective['category'],
        path: r.path,
        // value in API is normalizzato; in frontend lavoriamo col valore \"visuale\"
        value: r.unit === '%' ? Math.round(denorm) : denorm,
        unit: r.unit,
        }
      })
    } catch {
      objectives.value = []
    }
  }

  async function updateObjective(id: string, value: number, unit: string) {
    const normalized = normalizeValue(value, unit)
    const updated = await api.objectives.update(id, { value: normalized, unit })
    const idx = objectives.value.findIndex((o) => o.id === id)
    if (idx >= 0) {
      const denorm = denormalizeValue(updated.value, updated.unit)
      objectives.value[idx] = {
        ...objectives.value[idx],
        value: updated.unit === '%' ? Math.round(denorm) : denorm,
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
