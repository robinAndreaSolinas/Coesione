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
          description="Target mensile pagine viste"
          :progress="Math.round(sitiCurrent.pagineVisteArticoli.progress ?? 0)"
          :target-percent="100"
          :target-label="sitiGoals.pagineVisteArticoli"
          :current-label="sitiCurrent.pagineVisteArticoli.value"
          progress-text="Buon traffico. Continua così per raggiungere l'obiettivo."
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Utenti unici mensili"
          :series="chartSeries"
          :categories="uniqueUserCategories"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Traffico sito"
          description="Pagine viste e utenti unici"
          :series="trafficSeries"
          :categories="uniqueUserCategories"
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
const { pageviews, articlesPublished, dailyPoints } = useSiteMetrics()

const uniqueUsersMonthAvg = ref(0)
const uniqueUsersByMonth = ref<Array<{ eventDate: string; uug: number }>>([])

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
      uniqueUsersByMonth.value = Array.isArray(data.data.by_date)
        ? data.data.by_date.map((r: { eventDate?: string; uug?: number }) => ({
            eventDate: String(r.eventDate ?? ''),
            uug: Number(r.uug ?? 0),
          }))
        : []
    } else {
      uniqueUsersMonthAvg.value = 0
      uniqueUsersByMonth.value = []
    }
  } catch {
    uniqueUsersMonthAvg.value = 0
    uniqueUsersByMonth.value = []
  }
})

function denormalizeSiteValue(value: number, unit: string): number {
  if (unit === '%') return value * 100
  if (unit === 'K') return value / 1_000
  if (unit === 'M') return value / 1_000_000
  return value
}

function denormalizeUniqueUsersValue(rawUugInK: number, unit: string): number {
  // Adatta i dati in base all'unità dell'obiettivo:
  // - unit K => migliaia
  // - unit M => milioni
  if (unit === 'K') return rawUugInK / 1_000
  if (unit === 'M') return rawUugInK / 1_000_000
  if (unit === '%') return rawUugInK * 100
  return rawUugInK
}

function formatDenormalized(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100
  if (unit === '%') return `${rounded}%`
  if (unit === 'K') {
    if (rounded === 0 && value !== 0) return `${value.toFixed(2)}K`
    return `${rounded}K`
  }
  if (unit === 'M') {
    if (rounded === 0 && value !== 0) return `${value.toFixed(2)}M`
    return `${rounded}M`
  }
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
    const goalVisual = obj?.value ?? 0

    const currentVisual =
      id === 'articles-unique-users'
        ? denormalizeUniqueUsersValue(raw, unit)
        : denormalizeSiteValue(raw, unit)

    const progressRaw = goalVisual > 0 ? (currentVisual / goalVisual) * 100 : 0
    const progress = Math.max(0, Math.min(progressRaw, 999))

    return {
      value: formatDenormalized(currentVisual, unit),
      progress,
    }
  }

  return {
    utentiUniciArticoli: currentFor('articles-unique-users', uniqueUsersMonthAvg.value),
    pagineVisteArticoli: currentFor('articles-pageviews', pageviews.value),
    articoliPubblicati: currentFor('articles-published-count', articlesPublished.value),
  }
})

const uniqueUserCategories = computed(() => uniqueUsersByMonth.value.map((p) => p.eventDate))

const uniqueUsersUnit = computed(
  () => objectives.value.find((o) => o.id === 'articles-unique-users')?.unit ?? ''
)

const chartSeries = computed(() => [
  {
    name: 'Utenti unici',
    data: uniqueUsersByMonth.value.map((p) => denormalizeUniqueUsersValue(p.uug, uniqueUsersUnit.value)),
  },
])

const pageviewsByMonth = computed(() => {
  const m = new Map<string, number>()
  for (const p of dailyPoints.value) {
    const key = String(p.publish_date).slice(0, 7) // YYYY-MM
    m.set(key, (m.get(key) ?? 0) + Number(p.pageview ?? 0))
  }
  return m
})

const trafficSeries = computed(() => {
  return [
    {
      name: 'Pagine viste',
      data: uniqueUserCategories.value.map(
        (month) => denormalizeSiteValue(pageviewsByMonth.value.get(month) ?? 0, objectives.value.find((o) => o.id === 'articles-pageviews')?.unit ?? '')
      ),
    },
    {
      name: 'Utenti unici (media mese)',
      data: uniqueUsersByMonth.value.map((p) => denormalizeUniqueUsersValue(p.uug, uniqueUsersUnit.value)),
    },
  ]
})
</script>
