<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Sondaggi + Webinar" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Sondaggi + Webinar</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
        <metric-card
          label="Numero sondaggi"
          :value="sondaggiCurrent.numeroSondaggi"
          :goal="sondaggiGoals.numeroSondaggi"
          :trend="null"
        />
        <metric-card
          label="Utenti unici"
          :value="sondaggiCurrent.partecipanti"
          :goal="sondaggiGoals.partecipanti"
          :trend="null"
        />
        <metric-card
          label="Risposte totali"
          :value="sondaggiCurrent.risposteTotali"
          :goal="sondaggiGoals.risposteTotali"
          :trend="null"
        />
        <metric-card
          label="Engagement rate (calcolato)"
          :value="sondaggiCurrent.engagementRate"
          :goal="sondaggiGoals.engagementRate"
          :trend="null"
        />
        <metric-card
          label="Satisfaction rate structured dialogues"
          value="—"
          :goal="sondaggiGoals.satisfactionRate"
          :trend="null"
        >
          <template #footer>
            <div
              class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-snug text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              Placeholder: score 1–5, target ≥ 4. Non calcolabile in maniera programmatica.
            </div>
          </template>
        </metric-card>
        <metric-card
          label="Improved understanding Regional Development"
          value="—"
          :goal="sondaggiGoals.regionalDevelopmentUnderstanding"
          :trend="null"
        >
          <template #footer>
            <div
              class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-snug text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              Placeholder: survey post-workshop/dialogue. Non calcolabile in maniera programmatica.
            </div>
          </template>
        </metric-card>
        <metric-card
          label="Cohesion Advocacy"
          value="—"
          :goal="sondaggiGoals.cohesionAdvocacy"
          :trend="null"
        >
          <template #footer>
            <div
              class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-snug text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              Placeholder: survey follow-up a chiusura intero progetto. Non calcolabile in maniera programmatica.
            </div>
          </template>
        </metric-card>
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo partecipazione"
          description="Target risposte totali"
          :progress="Math.round(sondaggiProgressPercent)"
          :target-percent="parseInt(goals.sondaggi.targetPercent) || 100"
          :target-label="sondaggiGoals.risposteTotali"
          :current-label="sondaggiCurrent.risposteTotali"
          :progress-text="`Hai raggiunto circa ${Math.round(sondaggiProgressPercent)}% dell'obiettivo.`"
        />
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useObjectives } from '@/composables/useObjectives'
import { useMetrics } from '@/composables/useMetrics'
import { api, type SondaggiStats } from '@/api/client'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import { formatDisplayValue } from '@/utils/metricFormat'

const { goals } = useGoals()
const { objectives, formatGoal } = useObjectives()
const { formatMetricValue } = useMetrics()

function denormalizeValue(value: number, unit: string): number {
  if (unit === '%') return value * 100
  if (unit === 'K') return value / 1_000
  if (unit === 'M') return value / 1_000_000
  return value
}

const stats = ref<SondaggiStats | null>(null)
const loading = ref(false)

async function loadStats() {
  loading.value = true
  try {
    stats.value = await api.sondaggi.getStats()
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)

const sondaggiGoals = computed(() => {
  const byId = new Map(
    objectives.value
      .filter((o) => o.category === 'sondaggi')
      .map((o) => [o.id, o])
  )

  function goalFor(id: string, fallback: string): string {
    const obj = byId.get(id)
    if (!obj) return fallback
    return formatGoal(obj.value, obj.unit)
  }

  return {
    numeroSondaggi: goalFor('surveys-count', goals.value.sondaggi.numeroSondaggi),
    partecipanti: goalFor('surveys-participants-count', goals.value.sondaggi.partecipanti),
    risposteTotali: goalFor('surveys-total-responses', goals.value.sondaggi.risposteTotali),
    engagementRate: goalFor('sondaggi-engagement-rate', goals.value.sondaggi.engagementRate),
    satisfactionRate: goalFor('sondaggi-satisfaction-rate', goals.value.sondaggi.satisfactionRate),
    regionalDevelopmentUnderstanding: goalFor(
      'sondaggi-regional-development-understanding',
      goals.value.sondaggi.regionalDevelopmentUnderstanding,
    ),
    cohesionAdvocacy: goalFor('sondaggi-cohesion-advocacy', goals.value.sondaggi.cohesionAdvocacy),
  }
})

const sondaggiCurrent = computed(() => {
  function formatForObjective(id: string, raw: number): string {
    const obj = objectives.value.find((o) => o.id === id)
    const unit = obj?.unit ?? ''
    return formatMetricValue(denormalizeValue(raw, unit), unit)
  }

  return {
    numeroSondaggi: formatForObjective('surveys-count', stats.value?.surveysCount ?? 0),
    partecipanti: formatForObjective('surveys-participants-count', stats.value?.participantsCount ?? 0),
    risposteTotali: formatForObjective('surveys-total-responses', stats.value?.totalResponses ?? 0),
    engagementRate: formatDisplayValue(stats.value?.engagementRatePercent ?? 0, '%'),
  }
})

const sondaggiProgressPercent = computed(() => {
  const obj = objectives.value.find((o) => o.id === 'surveys-total-responses')
  const goalBase = obj?.value ?? 0
  if (goalBase <= 0) return 0

  const currentBase = stats.value?.totalResponses ?? 0
  const percent = (currentBase / goalBase) * 100
  return Math.max(0, Math.min(percent, 999))
})
</script>
