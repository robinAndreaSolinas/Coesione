<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Siti" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Analitiche Siti</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card label="Pagine viste" value="1.2M" :goal="goals.siti.pagineViste" :trend="7" />
        <metric-card label="Utenti unici" value="312K" :goal="goals.siti.utentiUnici" :trend="5" />
        <metric-card label="Durata media" value="3m 42s" :goal="goals.siti.durataMedia" :trend="12" />
        <metric-card label="Bounce rate" value="42%" :goal="goals.siti.bounceRate" :trend="-8" />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo traffico"
          description="Target mensile utenti unici"
          :progress="89"
          :target-percent="parseInt(goals.siti.targetPercent) || 100"
          :target-label="goals.siti.target"
          current-label="312K"
          progress-text="Buon traffico. Continua così per raggiungere l'obiettivo."
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Utenti unici mensili"
          :series="chartSeries"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Traffico sito"
          description="Pagine viste e utenti unici"
          :series="trafficSeries"
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
  { name: 'Utenti unici', data: [250, 265, 270, 275, 280, 285, 290, 295, 300, 305, 308, 312] },
])

const trafficSeries = computed(() => [
  { name: 'Pagine viste (K)', data: [95, 98, 100, 102, 105, 108, 110, 112, 115, 118, 120, 120] },
  { name: 'Utenti unici (K)', data: [25, 26, 27, 27, 28, 28, 29, 29, 30, 30, 30, 31] },
])
</script>
