<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Video" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Video</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card
          label="Numero video"
          :value="audiovisualLabel"
          :goal="videoGoals.audiovisualCount"
        />
        <metric-card
          label="Stream"
          :value="audienceLabel"
          :goal="videoGoals.audience"
        />
        <metric-card
          label="Minuti guardati"
          :value="minutesLabel"
        />
        <metric-card
          label="Completion rate"
          :value="completionRateLabel"
          :goal="videoGoals.completionRate"
        />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo visualizzazioni"
          description="Target visualizzazioni e minuti guardati"
          :progress="videoProgress"
          :target-percent="100"
          :target-label="videoGoals.completionRate"
          :current-label="completionRateLabel"
          :progress-text="`Hai raggiunto circa ${videoProgress}% dell'obiettivo.`"
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Visualizzazioni giornaliere"
          :series="chartSeries"
          :categories="chartCategories"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Performance video"
          description="Stream e minuti guardati"
          :series="performanceSeries"
          :categories="chartCategories"
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
import { api, type VideoStats } from '@/api/client'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart.vue'

const { goals } = useGoals()
const { objectives, formatGoal } = useObjectives()
const { formatMetricValue } = useMetrics()

const stats = ref<VideoStats | null>(null)
const loading = ref(false)

async function loadStats() {
  loading.value = true
  try {
    stats.value = await api.video.getStats()
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)

const videoGoals = computed(() => {
  const byId = new Map(
    objectives.value
      .filter((o) => o.category === 'video')
      .map((o) => [o.id, o])
  )

  function goalFor(id: string, fallback: string): string {
    const obj = byId.get(id)
    if (!obj) return fallback
    return formatGoal(obj.value, obj.unit)
  }

  return {
    audiovisualCount: goalFor('video-audiovisual-count', goals.value.video.audiovisualCount),
    audience: goalFor('video-audience', goals.value.video.audience),
    minuti: goalFor('video-minutes-watched', goals.value.video.minuti),
    completionRate: goalFor('video-completion-rate', goals.value.video.completionRate),
  }
})

const videoUnits = computed(() => {
  const byId = new Map(
    objectives.value
      .filter((o) => o.category === 'video')
      .map((o) => [o.id, o])
  )

  return {
    audiovisualCount: byId.get('video-audiovisual-count')?.unit ?? '',
    audience: byId.get('video-audience')?.unit ?? '',
    minuti: byId.get('video-minutes-watched')?.unit ?? '',
    completionRate: byId.get('video-completion-rate')?.unit ?? '%',
  }
})

function denormalizeValue(value: number, unit: string): number {
  if (unit === '%') return value * 100
  if (unit === 'K') return value / 1_000
  if (unit === 'M') return value / 1_000_000
  return value
}

const audiovisualCountValue = computed(() =>
  denormalizeValue(stats.value?.audiovisualCount ?? 0, videoUnits.value.audiovisualCount || '')
)
const audienceValue = computed(() =>
  denormalizeValue(stats.value?.audience ?? 0, videoUnits.value.audience || '')
)
const minutesWatchedValue = computed(() =>
  denormalizeValue(stats.value?.minutesWatched ?? 0, videoUnits.value.minuti || '')
)
const completionRateValue = computed(() =>
  denormalizeValue(stats.value?.vthAvg ?? 0, videoUnits.value.completionRate || '%')
)

const audiovisualLabel = computed(() =>
  loading.value
    ? '...'
    : formatMetricValue(audiovisualCountValue.value, videoUnits.value.audiovisualCount || '')
)
const audienceLabel = computed(() =>
  loading.value
    ? '...'
    : formatMetricValue(audienceValue.value, videoUnits.value.audience || '')
)
const minutesLabel = computed(() =>
  loading.value
    ? '...'
    : formatMetricValue(minutesWatchedValue.value, videoUnits.value.minuti || '')
)
const completionRateLabel = computed(() =>
  loading.value
    ? '...'
    : formatMetricValue(completionRateValue.value, videoUnits.value.completionRate || '%')
)
const completionRateGoalValue = computed(() => {
  const obj = objectives.value.find((o) => o.id === 'video-completion-rate')
  if (obj && obj.value > 0) return obj.value
  const fallback = goals.value.video.completionRate || goals.value.video.target || '0'
  const parsed = Number(String(fallback).replace('%', ''))
  return Number.isFinite(parsed) ? parsed : 0
})

const videoProgress = computed(() => {
  const goal = completionRateGoalValue.value
  if (goal <= 0) return 0
  const current = completionRateValue.value
  return Math.max(0, Math.min(999, Math.round((current / goal) * 100)))
})

const monthlyBuckets = computed(() => {
  const bucket = new Map<string, { stream: number; watchedMinutes: number }>()
  for (const d of stats.value?.daily ?? []) {
    const month = d.date.slice(0, 7) // YYYY-MM
    const prev = bucket.get(month) ?? { stream: 0, watchedMinutes: 0 }
    prev.stream += d.stream
    prev.watchedMinutes += d.watchedSeconds / 60
    bucket.set(month, prev)
  }
  return Array.from(bucket.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, values]) => ({
      month,
      stream: values.stream,
      watchedMinutes: Math.round(values.watchedMinutes),
    }))
})

const chartCategories = computed(() => monthlyBuckets.value.map((m) => m.month))

const chartSeries = computed(() => [
  {
    name: 'Stream',
    data: monthlyBuckets.value.map((m) => m.stream),
  },
])

const performanceSeries = computed(() => [
  {
    name: 'Stream',
    data: monthlyBuckets.value.map((m) => m.stream),
  },
  {
    name: 'Minuti guardati',
    data: monthlyBuckets.value.map((m) => m.watchedMinutes),
  },
])
</script>
