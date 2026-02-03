<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
  >
    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
      Raggiungimento obiettivi per categoria
    </h3>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Ogni barra indica la percentuale di target raggiunta
    </p>
    <div class="mt-6">
      <VueApexCharts
        type="bar"
        height="280"
        :options="chartOptions"
        :series="series"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps<{
  data: { category: string; label: string; value: number }[]
}>()

const CATEGORY_COLORS: Record<string, string> = {
  social: '#3B82F6',
  video: '#EF4444',
  newsletter: '#22C55E',
  siti: '#8B5CF6',
  sondaggi: '#F59E0B',
}

const series = computed(() => [
  {
    name: '% obiettivo raggiunto',
    data: props.data.map((d) => d.value),
  },
])

const chartOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '60%',
      borderRadius: 4,
      dataLabels: { position: 'top' as const },
      distributed: true,
    },
  },
  colors: props.data.map((d) => CATEGORY_COLORS[d.category] ?? '#64748B'),
  dataLabels: {
    enabled: true,
    formatter: (val: number) => val + '%',
    offsetY: -20,
  },
  xaxis: {
    categories: props.data.map((d) => d.label),
    labels: { style: { fontSize: '12px' } },
  },
  yaxis: {
    max: 100,
    tickAmount: 5,
    labels: { formatter: (val: number) => val + '%' },
  },
  grid: {
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
  },
  tooltip: {
    y: { formatter: (val: number) => val + '% raggiunto' },
  },
}))
</script>
