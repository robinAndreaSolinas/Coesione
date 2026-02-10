<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Video" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Video</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card label="Audience" value="210K" :goal="goals.video.audience" :trend="9" />
        <metric-card label="Minuti guardati" value="1.1M" :goal="goals.video.minuti" :trend="18" />
        <metric-card label="Completion rate" value="68%" :goal="goals.video.completionRate" :trend="5" />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo visualizzazioni"
          description="Target mensile visualizzazioni"
          :progress="89"
          :target-percent="parseInt(goals.video.targetPercent) || 100"
          :target-label="goals.video.target"
          current-label="892K"
          progress-text="Quasi raggiunto! Mancano circa 108K visualizzazioni."
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Visualizzazioni mensili"
          :series="chartSeries"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Performance video"
          description="Visualizzazioni e minuti guardati"
          :series="performanceSeries"
        />
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGoals } from '@/composables/useGoals'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart.vue'

const { goals } = useGoals()
const chartSeries = computed(() => [
  { name: 'Visualizzazioni', data: [450, 520, 480, 600, 650, 700, 720, 750, 800, 820, 850, 892] },
])

const performanceSeries = computed(() => [
  { name: 'Visualizzazioni (K)', data: [45, 52, 48, 60, 65, 70, 72, 75, 80, 82, 85, 89] },
  { name: 'Minuti (K)', data: [8, 9, 10, 11, 12, 13, 14, 13, 15, 14, 16, 15] },
])
</script>
