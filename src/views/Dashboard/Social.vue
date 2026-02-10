<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Social" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Social</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card label="Engagement rate (calcolato)" value="5%" :goal="goals.social.engagementRate" :trend="2" />
        <metric-card label="Views" value="2.1M" :goal="goals.social.views" :trend="12" />
        <metric-card label="Audience" value="520K" :goal="goals.social.audience" :trend="9" />
        <metric-card label="Condivisioni" value="12.8K" :goal="goals.social.condivisioni" :trend="22" />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo engagement"
          description="Target mensile interazioni social"
          :progress="85"
          :target-percent="parseInt(goals.social.targetPercent) || 100"
          :target-label="goals.social.target"
          current-label="127.5K"
          progress-text="Ottimo engagement! Raggiungerai l'obiettivo a fine mese."
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Interazioni per mese"
          :series="chartSeries"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Andamento engagement"
          description="Engagement, condivisioni e commenti"
          :series="engagementSeries"
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
  { name: 'Interazioni', data: [85, 92, 78, 95, 110, 105, 120, 115, 130, 125, 140, 135] },
])

const engagementSeries = computed(() => [
  { name: 'Engagement rate %', data: [4.2, 4.5, 4.7, 5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 6] },
  { name: 'Condivisioni (K)', data: [8, 10, 9, 12, 14, 13, 15, 16, 18, 17, 20, 19] },
  { name: 'Commenti (K)', data: [3, 3.2, 3.1, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4, 4.1, 4.2] },
])
</script>
