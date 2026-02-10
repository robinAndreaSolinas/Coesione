<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Newsletter" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Newsletter</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card label="Open rate (calcolato)" :value="openRateDisplay" :goal="goals.newsletter.openRate" :trend="8" />
        <metric-card label="Click rate (calcolato)" :value="clickRateDisplay" :goal="goals.newsletter.clickRate" :trend="3" />
        <metric-card label="Iscritti totali" :value="subscribersTotalDisplay" :goal="goals.newsletter.iscrittiTotali" :trend="15" />
        <metric-card label="Iscritti attivi" :value="subscribersActiveDisplay" :goal="goals.newsletter.iscrittiAttivi" :trend="10" />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo iscritti"
          description="Target trimestrale iscritti"
          :progress="90"
          :target-percent="parseInt(goals.newsletter.targetPercent) || 100"
          :target-label="goals.newsletter.target"
          :current-label="subscribersTotalDisplay"
          progress-text="Crescita costante. Obiettivo a portata di mano."
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Crescita iscritti"
          :series="chartSeries"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Performance invii"
          description="Open rate e click rate per mese"
          :series="performanceSeries"
        />
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useNewsletter } from '@/composables/useNewsletter'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart.vue'

const { goals } = useGoals()
const { metrics, formatNumber, formatPercent } = useNewsletter()

const openRateDisplay = computed(() => formatPercent(metrics.value.openRate))
const clickRateDisplay = computed(() => formatPercent(metrics.value.clickRate))
const subscribersTotalDisplay = computed(() => formatNumber(metrics.value.subscribersTotal))
const subscribersActiveDisplay = computed(() => formatNumber(metrics.value.subscribersActive))

const chartSeries = computed(() => [
  { name: 'Iscritti', data: [38, 39, 40, 41, 42, 42.5, 43, 43.5, 44, 44.5, 45, 45.2] },
])

const performanceSeries = computed(() => [
  { name: 'Open rate %', data: [38, 40, 39, 42, 41, 43, 42, 44, 43, 45, 44, 42] },
  { name: 'Click rate %', data: [10, 11, 10, 12, 11, 13, 12, 14, 13, 12, 12, 12] },
])
</script>
