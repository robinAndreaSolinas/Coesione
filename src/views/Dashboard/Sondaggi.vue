<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Sondaggi" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Sondaggi</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card label="Sondaggi attivi" value="12" :goal="goals.sondaggi.sondaggiAttivi" :trend="0" />
        <metric-card label="Risposte totali" value="8.4K" :goal="goals.sondaggi.risposte" :trend="28" />
        <metric-card label="Completion rate" value="76%" :goal="goals.sondaggi.completionRate" :trend="6" />
        <metric-card label="Media risposte/sondaggio" value="700" :goal="goals.sondaggi.mediaRisposte" :trend="15" />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo partecipazione"
          description="Target risposte al mese"
          :progress="84"
          :target-percent="parseInt(goals.sondaggi.targetPercent) || 100"
          :target-label="goals.sondaggi.target"
          current-label="8.4K"
          progress-text="Ottima partecipazione. Mancano 1.6K risposte per l'obiettivo."
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Risposte per mese"
          :series="chartSeries"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Andamento sondaggi"
          description="Risposte e completion rate"
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
  { name: 'Risposte', data: [520, 580, 620, 650, 680, 720, 750, 780, 800, 820, 830, 840] },
])

const performanceSeries = computed(() => [
  { name: 'Risposte (K)', data: [0.52, 0.58, 0.62, 0.65, 0.68, 0.72, 0.75, 0.78, 0.8, 0.82, 0.83, 0.84] },
  { name: 'Completion %', data: [70, 72, 71, 73, 74, 75, 74, 76, 75, 76, 76, 76] },
])
</script>
