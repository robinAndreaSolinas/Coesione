<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Sondaggi + Webinar" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Sondaggi + Webinar</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:gap-6">
        <metric-card
          label="Numero sondaggi"
          :value="sondaggiCurrent.numeroSondaggi"
          :goal="sondaggiGoals.numeroSondaggi"
          :trend="null"
        />
        <metric-card
          label="Risposte totali"
          :value="sondaggiCurrent.risposteTotali"
          :goal="sondaggiGoals.risposteTotali"
          :trend="null"
        />
        <metric-card
          label="Media risposte/sondaggio"
          :value="sondaggiCurrent.mediaRisposte"
          :goal="sondaggiGoals.mediaRisposte"
          :trend="null"
        />
        <metric-card
          label="Satisfaction rate"
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
          description="Target risposte al mese"
          :progress="Math.round(sondaggiProgressPercent)"
          :target-percent="parseInt(goals.sondaggi.targetPercent) || 100"
          :target-label="sondaggiGoals.risposteTotali"
          :current-label="sondaggiCurrent.risposteTotali"
          :progress-text="`Hai raggiunto circa ${Math.round(sondaggiProgressPercent)}% dell'obiettivo.`"
        />
      </div>
      <div class="col-span-12 grid gap-4 md:grid-cols-2">
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Logora</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Dati da groups</p>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <div class="text-xs text-gray-500 dark:text-gray-400">Sondaggi</div>
              <div class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ logoraSurveysLabel }}</div>
            </div>
            <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <div class="text-xs text-gray-500 dark:text-gray-400">Risposte</div>
              <div class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ logoraResponsesLabel }}</div>
            </div>
          </div>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Quiz</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Dati da quiz</p>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <div class="text-xs text-gray-500 dark:text-gray-400">Sondaggi</div>
              <div class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ quizSurveysLabel }}</div>
            </div>
            <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <div class="text-xs text-gray-500 dark:text-gray-400">Risposte</div>
              <div class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ quizResponsesLabel }}</div>
            </div>
          </div>
        </div>
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
    risposteTotali: goalFor('surveys-total-responses', goals.value.sondaggi.risposteTotali),
    mediaRisposte: goalFor('surveys-average-responses', goals.value.sondaggi.mediaRisposte),
    satisfactionRate: goalFor('sondaggi-satisfaction-rate', goals.value.sondaggi.satisfactionRate),
    regionalDevelopmentUnderstanding: goalFor(
      'sondaggi-regional-development-understanding',
      goals.value.sondaggi.regionalDevelopmentUnderstanding,
    ),
    cohesionAdvocacy: goalFor('sondaggi-cohesion-advocacy', goals.value.sondaggi.cohesionAdvocacy),
  }
})
const sondaggiCurrent = computed(() => {
  const countObj = objectives.value.find((o) => o.id === 'surveys-count')
  const totalRespObj = objectives.value.find((o) => o.id === 'surveys-total-responses')
  const avgRespObj = objectives.value.find((o) => o.id === 'surveys-average-responses')

  const countUnit = countObj?.unit ?? ''
  const totalRespUnit = totalRespObj?.unit ?? ''
  const avgRespUnit = avgRespObj?.unit ?? ''

  const countRaw = stats.value?.surveysCount ?? 0
  const totalResponsesRaw = stats.value?.totalResponses ?? 0
  const avgResponsesRaw = stats.value?.averageResponses ?? 0

  const count = denormalizeValue(countRaw, countUnit)
  const totalResponses = denormalizeValue(totalResponsesRaw, totalRespUnit)
  const avgResponses = denormalizeValue(avgResponsesRaw, avgRespUnit)

  return {
    numeroSondaggi: formatMetricValue(count, countUnit),
    risposteTotali: formatMetricValue(totalResponses, totalRespUnit),
    mediaRisposte: formatMetricValue(avgResponses, avgRespUnit),
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

const logoraSurveysLabel = computed(() => formatMetricValue(stats.value?.logora?.surveysCount ?? 0, ''))
const logoraResponsesLabel = computed(() => formatMetricValue(stats.value?.logora?.totalResponses ?? 0, ''))
const quizSurveysLabel = computed(() => formatMetricValue(stats.value?.quiz?.surveysCount ?? 0, ''))
const quizResponsesLabel = computed(() => formatMetricValue(stats.value?.quiz?.totalResponses ?? 0, ''))
</script>
