<template>
  <div
    class="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <div
      class="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6"
    >
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ title }}</h3>
        <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">{{ description }}</p>
      </div>
      <div class="relative max-h-[320px]">
        <div class="radial-bar-chart">
          <VueApexCharts
            type="radialBar"
            height="280"
            :options="chartOptions"
            :series="[progress]"
          />
        </div>
      </div>
      <div class="flex justify-center mt-8">
        <span
          :class="[
            'inline-flex rounded-full px-3 py-1 text-xs font-medium',
            progress >= targetPercent
              ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
              : 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500',
          ]"
        >
          {{ progress >= targetPercent ? 'Obiettivo raggiunto' : `${targetPercent - progress}% mancanti` }}
        </span>
      </div>
      <p class="mx-auto mt-1.5 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
        {{ progressText }}
      </p>
    </div>
    <div class="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Obiettivo
        </p>
        <p class="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
          {{ targetLabel }}
        </p>
      </div>
      <div class="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>
      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Attuale
        </p>
        <p class="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
          {{ currentLabel }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'

defineProps<{
  title: string
  description: string
  progress: number
  targetPercent?: number
  targetLabel: string
  currentLabel: string
  progressText: string
}>()

const chartOptions = {
  colors: ['#465FFF'],
  chart: { fontFamily: 'Outfit, sans-serif', sparkline: { enabled: true } },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      hollow: { size: '80%' },
      track: { background: '#E4E7EC', strokeWidth: '100%', margin: 5 },
      dataLabels: {
        name: { show: false },
        value: {
          fontSize: '34px',
          fontWeight: '600',
          offsetY: 50,
          color: '#1D2939',
          formatter: (val: number) => val.toFixed(0) + '%',
        },
      },
    },
  },
  fill: { type: 'solid', colors: ['#465FFF'] },
  stroke: { lineCap: 'round' as const },
  labels: ['Progresso'],
}
</script>

<style scoped>
.radial-bar-chart {
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
}
</style>
