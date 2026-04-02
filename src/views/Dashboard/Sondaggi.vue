<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Sondaggi" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Sondaggi</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
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
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Risposte per mese"
          :series="chartSeries"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Andamento sondaggi"
          description="Risposte"
          :series="performanceSeries"
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
import AnalyticsChart from '@/components/dashboard/AnalyticsChart.vue'

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
    numeroSondaggi: loading.value ? '...' : formatMetricValue(count, countUnit),
    risposteTotali: loading.value ? '...' : formatMetricValue(totalResponses, totalRespUnit),
    mediaRisposte: loading.value ? '...' : formatMetricValue(avgResponses, avgRespUnit),
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

const chartSeries = computed(() => [
  {
    name: 'Risposte',
    data: [stats.value?.totalResponses ?? 0],
  },
])

const performanceSeries = computed(() => [
  {
    name: 'Risposte',
    data: [stats.value?.totalResponses ?? 0],
  },
])
</script>
