<template>
  <admin-layout>
    <page-breadcrumb :page-title="t('dashboard.sondaggi.breadcrumb')" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">{{ t('dashboard.sondaggi.title') }}</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
        <metric-card
          :label="t('dashboard.sondaggi.surveysCount')"
          :value="sondaggiCurrent.numeroSondaggi"
          :goal="sondaggiGoals.numeroSondaggi"
          :current-value="sondaggiRaw.surveysCount"
          :goal-value="objectiveTargetPair(objectives, 'surveys-count', sondaggiRaw.surveysCount).goalValue"
          :trend="null"
        />
        <metric-card
          :label="t('dashboard.sondaggi.uniqueUsers')"
          :value="sondaggiCurrent.partecipanti"
          :goal="sondaggiGoals.partecipanti"
          :current-value="sondaggiRaw.participants"
          :goal-value="objectiveTargetPair(objectives, 'surveys-participants-count', sondaggiRaw.participants).goalValue"
          :trend="null"
        />
        <metric-card
          :label="t('dashboard.sondaggi.totalResponses')"
          :value="sondaggiCurrent.risposteTotali"
          :goal="sondaggiGoals.risposteTotali"
          :current-value="sondaggiRaw.totalResponses"
          :goal-value="objectiveTargetPair(objectives, 'surveys-total-responses', sondaggiRaw.totalResponses).goalValue"
          :trend="null"
        />
        <metric-card
          :label="t('dashboard.sondaggi.engagementRate')"
          :value="sondaggiCurrent.engagementRate"
          :goal="sondaggiGoals.engagementRate"
          :current-value="sondaggiRaw.engagementRate"
          :goal-value="objectiveTargetPair(objectives, 'sondaggi-engagement-rate', sondaggiRaw.engagementRate).goalValue"
          :trend="null"
        />
        <metric-card
          :label="t('dashboard.sondaggi.satisfactionRate')"
          :value="satisfactionDisplay"
          :goal="sondaggiGoals.satisfactionRate"
          :current-value="stats?.satisfactionScore ?? null"
          :goal-value="objectiveTargetPair(objectives, 'sondaggi-satisfaction-rate', stats?.satisfactionScore ?? 0).goalValue"
          :trend="null"
        >
          <template #footer>
            <div
              v-if="stats?.satisfactionScore != null"
              class="mt-4 text-xs text-gray-500 dark:text-gray-400"
            >
              {{ t('dashboard.sondaggi.surveyResponses', { n: stats.satisfactionResponses }) }}
            </div>
          </template>
        </metric-card>
        <metric-card
          :label="t('dashboard.sondaggi.regionalDevelopment')"
          :value="regionalDevelopmentDisplay"
          :goal="sondaggiGoals.regionalDevelopmentUnderstanding"
          :current-value="stats?.regionalDevelopmentRatePercent ?? null"
          :goal-value="objectiveTargetPair(objectives, 'sondaggi-regional-development-understanding', stats?.regionalDevelopmentRatePercent ?? 0).goalValue"
          :trend="null"
        >
          <template #footer>
            <div
              v-if="stats?.regionalDevelopmentRatePercent != null"
              class="mt-4 text-xs text-gray-500 dark:text-gray-400"
            >
              {{ t('dashboard.sondaggi.surveyResponses', { n: stats.regionalDevelopmentResponses }) }}
              · {{ t('dashboard.sondaggi.averageScore', { n: stats.regionalDevelopmentAverage }) }}
            </div>
          </template>
        </metric-card>
        <metric-card
          :label="t('dashboard.sondaggi.cohesionAdvocacy')"
          value="—"
          :goal="sondaggiGoals.cohesionAdvocacy"
          :trend="null"
        >
          <template #footer>
            <div
              class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-snug text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              {{ t('dashboard.sondaggi.cohesionPlaceholder') }}
            </div>
          </template>
        </metric-card>
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          :title="t('dashboard.sondaggi.goalTitle')"
          :description="t('dashboard.sondaggi.goalDescription')"
          :progress="Math.round(sondaggiProgressPercent)"
          :target-percent="parseInt(goals.sondaggi.targetPercent) || 100"
          :target-label="sondaggiGoals.risposteTotali"
          :current-label="sondaggiCurrent.risposteTotali"
          :progress-text="t('dashboard.sondaggi.goalProgressText', { n: Math.round(sondaggiProgressPercent) })"
        />
      </div>
      <div
        v-if="bySheetSeries.length > 0"
        class="col-span-12 xl:col-span-5"
      >
        <div
          class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
        >
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            {{ t('dashboard.sondaggi.bySheetTitle') }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ t('dashboard.sondaggi.bySheetDescription') }}
          </p>
          <div class="mt-4">
            <VueApexCharts
              class="by-sheet-pie"
              :class="isDarkMode ? 'by-sheet-pie--dark' : 'by-sheet-pie--light'"
              type="donut"
              height="280"
              :options="bySheetPieOptions"
              :series="bySheetSeries"
            />
          </div>
          <ul class="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <li
              v-for="(item, idx) in bySheetLegend"
              :key="item.label"
              class="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-white/90"
            >
              <span
                class="h-2.5 w-2.5 shrink-0 rounded-full"
                :style="{ backgroundColor: bySheetColors[idx % bySheetColors.length] }"
              />
              <span class="font-medium">{{ item.label }}</span>
              <span class="font-semibold tabular-nums text-gray-600 dark:text-gray-300">{{ item.value }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import { useGoals } from '@/composables/useGoals'
import { useObjectives, objectiveTargetPair } from '@/composables/useObjectives'
import { useMetrics } from '@/composables/useMetrics'
import { api, type SondaggiStats } from '@/api/client'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import { formatDisplayValue } from '@/utils/metricFormat'

const { t } = useI18n()
const { goals } = useGoals()
const { objectives, formatGoal } = useObjectives()
const { formatMetricValue } = useMetrics()

const isDarkMode = ref(false)
let themeObserver: MutationObserver | null = null

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

onMounted(() => {
  loadStats()
  const root = document.documentElement
  const updateTheme = () => {
    isDarkMode.value = root.classList.contains('dark')
  }
  updateTheme()
  themeObserver = new MutationObserver(updateTheme)
  themeObserver.observe(root, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
})

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

const satisfactionDisplay = computed(() => {
  const score = stats.value?.satisfactionScore
  if (score == null) return '—'
  return String(Math.round(score * 100) / 100)
})

const regionalDevelopmentDisplay = computed(() => {
  const rate = stats.value?.regionalDevelopmentRatePercent
  if (rate == null) return '—'
  return formatDisplayValue(rate, '%')
})

const sondaggiRaw = computed(() => {
  function visual(id: string, raw: number): number {
    const unit = objectives.value.find((o) => o.id === id)?.unit ?? ''
    return denormalizeValue(raw, unit)
  }

  return {
    surveysCount: visual('surveys-count', stats.value?.surveysCount ?? 0),
    participants: visual('surveys-participants-count', stats.value?.participantsCount ?? 0),
    totalResponses: visual('surveys-total-responses', stats.value?.totalResponses ?? 0),
    engagementRate: stats.value?.engagementRatePercent ?? 0,
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

const bySheetColors = ['#465FFF', '#12B76A', '#F79009', '#F04438', '#7A5AF8', '#0BA5EC']

function sheetLabel(apiKey: string): string {
  if (apiKey === 'GdG') return t('dashboard.sondaggi.sheetGdg')
  return apiKey
}

const bySheetEntries = computed(() => {
  const bySheet = stats.value?.regionalDevelopmentBySheet ?? {}
  return Object.entries(bySheet)
    .map(([key, value]) => ({
      label: sheetLabel(key),
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value)
})

const bySheetSeries = computed(() => bySheetEntries.value.map((e) => e.value))
const bySheetLabels = computed(() => bySheetEntries.value.map((e) => e.label))
const bySheetLegend = computed(() => bySheetEntries.value)

const bySheetPieOptions = computed(() => {
  const dark = isDarkMode.value
  return {
    chart: {
      id: 'regional-by-sheet-pie',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
      background: 'transparent',
    },
    labels: bySheetLabels.value,
    colors: bySheetColors,
    stroke: {
      width: 2,
      colors: [dark ? '#111827' : '#FFFFFF'],
    },
    plotOptions: {
      pie: {
        donut: {
          size: '58%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '12px',
              fontWeight: 500,
              color: dark ? '#D1D5DB' : '#6B7280',
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 700,
              color: dark ? '#F9FAFB' : '#111827',
              formatter: (val: string) => val,
            },
            total: {
              show: true,
              label: t('dashboard.sondaggi.averageScoreShort'),
              fontSize: '12px',
              fontWeight: 500,
              color: dark ? '#9CA3AF' : '#6B7280',
              formatter: () => {
                const avg = stats.value?.regionalDevelopmentAverage
                return avg != null ? String(Math.round(avg * 100) / 100) : '—'
              },
            },
          },
        },
      },
    },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontWeight: 700,
        colors: ['#FFFFFF'],
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 2,
        opacity: 0.45,
        color: '#000000',
      },
      formatter: (_val: number, opts: { seriesIndex: number }) => {
        const score = bySheetSeries.value[opts.seriesIndex]
        return score != null ? String(score) : ''
      },
    },
    tooltip: {
      theme: dark ? 'dark' : 'light',
      fillSeriesColor: false,
      style: {
        fontSize: '13px',
        fontFamily: 'Outfit, sans-serif',
      },
      y: {
        formatter: (val: number) => String(val),
      },
    },
  }
})
</script>

<style scoped>
:deep(.by-sheet-pie--light .apexcharts-tooltip) {
  background: #ffffff !important;
  color: #111827 !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:deep(.by-sheet-pie--light .apexcharts-tooltip-title) {
  background: #f9fafb !important;
  color: #111827 !important;
  border-bottom: 1px solid #e5e7eb !important;
}

:deep(.by-sheet-pie--dark .apexcharts-tooltip) {
  background: #1f2937 !important;
  color: #f9fafb !important;
  border: 1px solid #374151 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

:deep(.by-sheet-pie--dark .apexcharts-tooltip-title) {
  background: #111827 !important;
  color: #f9fafb !important;
  border-bottom: 1px solid #374151 !important;
}

:deep(.apexcharts-datalabel),
:deep(.apexcharts-datalabel-label),
:deep(.apexcharts-datalabel-value) {
  fill: #ffffff !important;
}
</style>
