<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Siti" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Analitiche Siti</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card
          label="Utenti unici articoli"
          :value="sitiCurrent.utentiUniciArticoli.value"
          :goal="sitiGoals.utentiUniciArticoli"
          :trend="null"
          :progress-percent="sitiCurrent.utentiUniciArticoli.progress"
        />
        <metric-card
          label="Pagine viste articoli"
          :value="sitiCurrent.pagineVisteArticoli.value"
          :goal="sitiGoals.pagineVisteArticoli"
          :trend="null"
          :progress-percent="sitiCurrent.pagineVisteArticoli.progress"
        />
        <metric-card
          label="Numero articoli pubblicati"
          :value="sitiCurrent.articoliPubblicati.value"
          :goal="sitiGoals.articoliPubblicati"
          :trend="null"
          :progress-percent="sitiCurrent.articoliPubblicati.progress"
        />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo traffico"
          description="Target mensile utenti unici"
          :progress="sitiCurrent.utentiUniciArticoli.progress ?? 0"
          :target-percent="parseInt(goals.siti.targetPercent) || 100"
          :target-label="goals.siti.target"
          :current-label="sitiCurrent.utentiUniciArticoli.value"
          progress-text="Buon traffico. Continua così per raggiungere l'obiettivo."
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Utenti unici mensili"
          :series="chartSeries"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Traffico sito"
          description="Pagine viste e utenti unici"
          :series="trafficSeries"
        />
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useObjectives } from '@/composables/useObjectives'
import { useSiteMetrics } from '@/composables/useSiteMetrics'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart.vue'

const { goals } = useGoals()
const { objectives, formatGoal } = useObjectives()
const { uniqueUsers, pageviews, articlesPublished } = useSiteMetrics()

const uniqueUsersMonthAvg = ref(0)

onMounted(async () => {
  try {
    const token = localStorage.getItem('coesione-token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch('/api/v1/site/unique-user', { headers })
    if (!res.ok) {
      uniqueUsersMonthAvg.value = 0
      return
    }
    const data = await res.json()
    if (data?.success && data.data?.month_avg != null) {
      uniqueUsersMonthAvg.value = Number(data.data.month_avg) || 0
    } else {
      uniqueUsersMonthAvg.value = 0
    }
  } catch {
    uniqueUsersMonthAvg.value = 0
  }
})

function denormalizeSiteValue(value: number, unit: string): number {
  if (unit === '%') return value * 100
  if (unit === 'K') return value / 1_000
  if (unit === 'M') return value / 1_000_000
  return value
}

function formatSiteValue(value: number, unit: string): string {
  const denorm = denormalizeSiteValue(value, unit)
  const rounded = Math.round(denorm * 100) / 100
  // Se il valore è troppo piccolo rispetto all'unità (es. 0.001M),
  // mostra il valore grezzo per evitare che diventi 0M.
  if ((unit === 'K' || unit === 'M') && rounded === 0 && value !== 0) {
    const rawRounded = Math.round(value * 100) / 100
    return String(rawRounded)
  }
  if (unit === '%') return `${rounded}%`
  if (unit === 'K') return `${rounded}K`
  if (unit === 'M') return `${rounded}M`
  return String(rounded)
}

const sitiGoals = computed(() => {
  const byId = new Map(
    objectives.value
      .filter((o) => o.category === 'siti')
      .map((o) => [o.id, o])
  )

  function goalFor(id: string, fallback: string): string {
    const obj = byId.get(id)
    if (!obj) return fallback
    return formatGoal(obj.value, obj.unit)
  }

  return {
    utentiUniciArticoli: goalFor('articles-unique-users', goals.value.siti.utentiUniciArticoli),
    pagineVisteArticoli: goalFor('articles-pageviews', goals.value.siti.pagineVisteArticoli),
    articoliPubblicati: goalFor('articles-published-count', goals.value.siti.articoliPubblicati),
  }
})

const sitiCurrent = computed(() => {
  function currentFor(id: string, raw: number) {
    const obj = objectives.value.find((o) => o.id === id)
    const unit = obj?.unit ?? ''
    return {
      value: formatSiteValue(raw, unit),
      progress: 0,
    }
  }

  return {
    utentiUniciArticoli: currentFor('articles-unique-users', uniqueUsersMonthAvg.value),
    pagineVisteArticoli: currentFor('articles-pageviews', pageviews.value),
    articoliPubblicati: currentFor('articles-published-count', articlesPublished.value),
  }
})

const chartSeries = computed(() => [
  // Per ora usiamo un'unica serie basata sulle pageview totali come placeholder numerico reale
  { name: 'Pagine viste (totale periodo)', data: [pageviews.value] },
])

const trafficSeries = computed(() => [
  { name: 'Pagine viste', data: [pageviews.value] },
  { name: 'Utenti unici (media mese)', data: [uniqueUsersMonthAvg.value] },
])
</script>
