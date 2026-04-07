<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Video" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Video</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card
          label="Numero di Audiovisual"
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
          :goal="videoGoals.minuti"
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
          :target-percent="videoTargetPercent"
          :target-label="goals.video.target"
          :current-label="`${videoProgress}%`"
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
const videoTargetPercent = computed(() => {
  const raw = goals.value.video.target || '100'
  const parsed = parseInt(raw.replace('%', ''), 10)
  return Number.isNaN(parsed) ? 100 : parsed
})

const videoProgress = computed(() => {
  const current = (stats.value?.vthAvg ?? 0) * 100
  return Math.max(0, Math.round(current))
})

const chartCategories = computed(() =>
  stats.value?.daily.map((d) => d.date) ?? []
)

const chartSeries = computed(() => [
  {
    name: 'Stream',
    data: stats.value?.daily.map((d) => d.stream) ?? [],
  },
])

const performanceSeries = computed(() => [
  {
    name: 'Stream',
    data: stats.value?.daily.map((d) => d.stream) ?? [],
  },
  {
    name: 'Minuti guardati',
    data: stats.value?.daily.map((d) => Math.round(d.watchedSeconds / 60)) ?? [],
  },
])
</script>
