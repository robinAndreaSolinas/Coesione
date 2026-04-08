<template>
  <admin-layout>
    <page-breadcrumb page-title="Totale" />
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white/90">Obiettivi</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Clicca su una card per vedere i dettagli della categoria
      </p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
      <objective-card
        v-for="obj in objectives"
        :key="obj.id"
        :objective="obj"
        :current-label="metricByKeyObj[obj.id]?.currentLabel"
        :target-label="metricByKeyObj[obj.id]?.goalLabel"
      />
    </div>
    <div class="mt-8 space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
          Raggiungimento complessivo obiettivi
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Goal raggiunti vs non raggiunti su tutte le sezioni
        </p>
        <div class="mt-6">
          <VueApexCharts
            class="overall-goals-pie"
            :class="isDarkMode ? 'overall-goals-pie--dark' : 'overall-goals-pie--light'"
            type="pie"
            height="300"
            :options="overallPieOptions"
            :series="overallPieSeries"
          />
        </div>
        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <div class="flex items-center gap-2 text-sm text-gray-800 dark:text-white/90">
            <span class="h-2.5 w-2.5 rounded-full bg-green-600"></span>
            <span>Raggiunti: {{ overallReachedPercent }}% ({{ overallReachedGoals }})</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-800 dark:text-white/90">
            <span class="h-2.5 w-2.5 rounded-full bg-red-600"></span>
            <span>Non raggiunti: {{ overallNotReachedPercent }}% ({{ overallNotReachedGoals }})</span>
          </div>
        </div>
      </div>
      <div>
        <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
          Dettaglio per categoria
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ogni cerchio mostra il progresso della singola area rispetto al proprio target
        </p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <category-progress-card
            v-for="cat in progressByCategory"
            :key="cat.category"
            :label="cat.label"
            :value="cat.value"
          />
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useObjectives } from '@/composables/useObjectives'
import { useCategoryProgress } from '@/composables/useCategoryProgress'
import { useMetrics } from '@/composables/useMetrics'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ObjectiveCard from '@/components/dashboard/ObjectiveCard.vue'
import CategoryProgressCard from '@/components/dashboard/CategoryProgressCard.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'

const { objectives } = useObjectives()
const { progressByCategory } = useCategoryProgress()
const { metricsForView } = useMetrics()
const isDarkMode = ref(false)
let themeObserver: MutationObserver | null = null

const metricByKeyObj = computed(() => {
  const obj: Record<string, (typeof metricsForView.value)[number]> = {}
  for (const metric of metricsForView.value) {
    obj[metric.key] = metric
  }
  return obj
})

const overallTotalGoals = computed(() => metricsForView.value.length)
const overallReachedGoals = computed(() =>
  metricsForView.value.filter((m) => m.goal > 0 && m.current >= m.goal).length
)
const overallNotReachedGoals = computed(() =>
  Math.max(overallTotalGoals.value - overallReachedGoals.value, 0)
)
const overallPieSeries = computed(() => [overallReachedGoals.value, overallNotReachedGoals.value])

const overallReachedPercent = computed(() => {
  const total = overallTotalGoals.value
  if (total <= 0) return 0
  return Math.round((overallReachedGoals.value / total) * 1000) / 10
})

const overallNotReachedPercent = computed(() => {
  const total = overallTotalGoals.value
  if (total <= 0) return 0
  return Math.round((overallNotReachedGoals.value / total) * 1000) / 10
})

const overallPieOptions = computed(() => ({
  chart: { id: 'overall-goals-pie', fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  labels: ['Raggiunti', 'Non raggiunti'],
  colors: ['#16A34A', '#DC2626'],
  fill: {
    colors: ['#16A34A', '#DC2626'],
  },
  stroke: {
    width: 2,
    colors: ['#FFFFFF'],
  },
  theme: {
    monochrome: { enabled: false },
  },
  legend: {
    position: 'bottom' as const,
    labels: { colors: [isDarkMode.value ? '#E5E7EB' : '#1F2937'] },
  },
  dataLabels: {
    enabled: false,
    formatter: (val: number) => `${Math.round(val)}%`,
    style: { colors: [isDarkMode.value ? '#FFFFFF' : '#000000'], fontWeight: 700, fontSize: '13px' },
    background: {
      enabled: true,
      foreColor: isDarkMode.value ? '#FFFFFF' : '#000000',
      borderRadius: 4,
      padding: 6,
      opacity: 1,
      borderWidth: 1,
      borderColor: isDarkMode.value ? '#000000' : '#FFFFFF',
    },
    dropShadow: { enabled: false },
  },
  tooltip: {
    theme: isDarkMode.value ? 'dark' : 'light',
    fillSeriesColor: false,
    style: {
      fontSize: '12px',
      fontFamily: 'Outfit, sans-serif',
    },
    marker: { show: true },
    y: {
      formatter: (val: number) => `${Math.round(val)} goal`,
    },
  },
}))

onMounted(() => {
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

function metricIconBg(category: string) {
  const map: Record<string, string> = {
    social: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    video: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    newsletter: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    siti: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    sondaggi: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  }
  return map[category] || 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
}
</script>

<style>
.overall-goals-pie--light .apexcharts-tooltip {
  background: #ffffff !important;
  color: #000000 !important;
  border: 1px solid #ffffff !important;
}

.overall-goals-pie--light .apexcharts-tooltip-title {
  background: #ffffff !important;
  color: #000000 !important;
  border-bottom: 1px solid #ffffff !important;
}

.overall-goals-pie--light .apexcharts-data-labels text,
.overall-goals-pie--light .apexcharts-datalabel,
.overall-goals-pie--light .apexcharts-datalabel tspan {
  fill: #000000 !important;
  stroke: none !important;
  stroke-width: 0 !important;
}

.overall-goals-pie--light .apexcharts-data-labels rect {
  fill: #ffffff !important;
  stroke: #ffffff !important;
  opacity: 1 !important;
}

.overall-goals-pie--dark .apexcharts-tooltip {
  background: #000000 !important;
  color: #ffffff !important;
  border: 1px solid #000000 !important;
}

.overall-goals-pie--dark .apexcharts-tooltip-title {
  background: #000000 !important;
  color: #ffffff !important;
  border-bottom: 1px solid #000000 !important;
}

.overall-goals-pie--dark .apexcharts-data-labels text,
.overall-goals-pie--dark .apexcharts-datalabel,
.overall-goals-pie--dark .apexcharts-datalabel tspan {
  fill: #ffffff !important;
  stroke: none !important;
  stroke-width: 0 !important;
}

.overall-goals-pie--dark .apexcharts-data-labels rect {
  fill: #000000 !important;
  stroke: #000000 !important;
  opacity: 1 !important;
}

.apexcharts-tooltip.apexcharts-theme-light {
  background: #ffffff !important;
  color: #000000 !important;
  border: 1px solid #ffffff !important;
}

.apexcharts-tooltip.apexcharts-theme-light .apexcharts-tooltip-title {
  background: #ffffff !important;
  color: #000000 !important;
  border-bottom: 1px solid #ffffff !important;
}

.apexcharts-tooltip.apexcharts-theme-dark {
  background: #000000 !important;
  color: #ffffff !important;
  border: 1px solid #000000 !important;
}

.apexcharts-tooltip.apexcharts-theme-dark .apexcharts-tooltip-title {
  background: #000000 !important;
  color: #ffffff !important;
  border-bottom: 1px solid #000000 !important;
}

</style>
