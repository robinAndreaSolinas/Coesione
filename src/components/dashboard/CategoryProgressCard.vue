<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-4 text-center dark:border-gray-800 dark:bg-white/[0.03] sm:px-5 sm:pt-5"
  >
    <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">
      {{ label }}
    </h4>
    <div class="mt-3 radial-bar-chart">
      <VueApexCharts
        type="radialBar"
        height="170"
        :options="chartOptions"
        :series="[value]"
      />
    </div>
    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      {{ value }}% dell'obiettivo raggiunto
    </p>
  </div>
</template>

<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'

defineProps<{
  label: string
  value: number
}>()

const chartOptions = {
  chart: { sparkline: { enabled: true } },
  colors: ['#465FFF'],
  plotOptions: {
    radialBar: {
      hollow: { size: '65%' },
      track: { background: '#E4E7EC', strokeWidth: '100%' },
      dataLabels: {
        name: { show: false },
        value: {
          fontSize: '20px',
          fontWeight: '600',
          offsetY: 4,
          formatter: (val: number) => `${Math.round(val)}%`,
        },
      },
    },
  },
  stroke: { lineCap: 'round' as const },
}
</script>

<style scoped>
.radial-bar-chart {
  width: 100%;
  max-width: 180px;
  margin: 0 auto;
}
</style>

