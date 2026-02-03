<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
  >
    <div class="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
      <div class="w-full">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ title }}</h3>
        <p v-if="description" class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          {{ description }}
        </p>
      </div>
    </div>
    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <div class="-ml-4 min-w-[1000px] xl:min-w-full pl-2">
        <VueApexCharts type="area" height="310" :options="chartOptions" :series="series" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps<{
  title: string
  description?: string
  series: { name: string; data: number[] }[]
  categories?: string[]
}>()

const series = computed(() => props.series)

const chartOptions = computed(() => ({
  legend: { show: false },
  colors: ['#465FFF', '#9CB9FF'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'area',
    toolbar: { show: false },
    offsetX: 0,
    offsetY: 0,
  },
  fill: { gradient: { enabled: true, opacityFrom: 0.55, opacityTo: 0 } },
  stroke: { curve: 'straight' as const, width: [2, 2] },
  markers: { size: 0 },
  labels: { show: false },
  grid: {
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { left: 10, right: 10, top: 10, bottom: 10 },
  },
  dataLabels: { enabled: false },
  xaxis: {
    type: 'category',
    categories: props.categories ?? ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { title: { style: { fontSize: '0px' } } },
}))
</script>
