<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Social" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Social</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card label="Like" value="45.2K" :goal="goals.social.like" :trend="18" />
        <metric-card label="Condivisioni" value="12.8K" :goal="goals.social.condivisioni" :trend="22" />
        <metric-card label="Commenti" value="3.4K" :goal="goals.social.commenti" :trend="-5" />
        <metric-card label="Reach" value="124.5K" :goal="goals.social.reach" :trend="11" />
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
          description="Like, condivisioni e commenti"
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
  { name: 'Like', data: [30, 35, 32, 40, 45, 42, 48, 50, 55, 52, 58, 60] },
  { name: 'Condivisioni', data: [8, 10, 9, 12, 14, 13, 15, 16, 18, 17, 20, 19] },
])
</script>
