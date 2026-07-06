<template>
  <admin-layout>
    <page-breadcrumb :page-title="t('dashboard.video.breadcrumb')" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">{{ t('dashboard.video.title') }}</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
        <metric-card
          :label="t('dashboard.video.videoCount')"
          :value="audiovisualLabel"
          :goal="videoGoals.audiovisualCount"
          :current-value="audiovisualCountValue"
          :goal-value="objectiveTargetPair(objectives, 'video-audiovisual-count', audiovisualCountValue).goalValue"
        />
        <metric-card
          :label="t('dashboard.video.stream')"
          :value="audienceLabel"
          :goal="videoGoals.audience"
          :current-value="audienceValue"
          :goal-value="objectiveTargetPair(objectives, 'video-audience', audienceValue).goalValue"
        />
        <metric-card
          :label="t('dashboard.video.minutesWatched')"
          :value="minutesLabel"
        />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          :title="t('dashboard.video.goalTitle')"
          :description="t('dashboard.video.goalDescription')"
          :progress="videoProgress"
          :target-percent="100"
          :target-label="videoGoals.audience"
          :current-label="audienceLabel"
          :progress-text="t('dashboard.video.goalProgressText', { n: videoProgress })"
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          :title="t('dashboard.video.chartDaily')"
          :series="chartSeries"
          :categories="chartCategories"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          :title="t('dashboard.video.chartPerformance')"
          :description="t('dashboard.video.chartPerformanceDescription')"
          :series="performanceSeries"
          :categories="chartCategories"
        />
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoals } from '@/composables/useGoals'
import { useObjectives, objectiveTargetPair } from '@/composables/useObjectives'
import { useMetrics } from '@/composables/useMetrics'
import { api, type VideoStats } from '@/api/client'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart.vue'

const { t } = useI18n()
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

const audiovisualLabel = computed(() =>
  formatMetricValue(audiovisualCountValue.value, videoUnits.value.audiovisualCount || ''),
)
const audienceLabel = computed(() =>
  formatMetricValue(audienceValue.value, videoUnits.value.audience || ''),
)
const minutesLabel = computed(() =>
  formatMetricValue(minutesWatchedValue.value, videoUnits.value.minuti || ''),
)

const videoProgress = computed(() => {
  const obj = objectives.value.find((o) => o.id === 'video-audience')
  const goalVisual = obj?.value ?? 0
  if (goalVisual <= 0) return 0
  return Math.max(0, Math.min(999, Math.round((audienceValue.value / goalVisual) * 100)))
})

const monthlyBuckets = computed(() => {
  const bucket = new Map<string, { stream: number; watchedMinutes: number }>()
  for (const d of stats.value?.daily ?? []) {
    const month = d.date.slice(0, 7)
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
    name: t('dashboard.video.stream'),
    data: monthlyBuckets.value.map((m) => m.stream),
  },
])

const performanceSeries = computed(() => [
  {
    name: t('dashboard.video.stream'),
    data: monthlyBuckets.value.map((m) => m.stream),
  },
  {
    name: t('dashboard.video.seriesMinutesWatched'),
    data: monthlyBuckets.value.map((m) => m.watchedMinutes),
  },
])
</script>
