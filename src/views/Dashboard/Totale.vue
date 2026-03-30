<template>
  <admin-layout>
    <page-breadcrumb page-title="Totale" />
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white/90">Obiettivi</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Clicca su una card per vedere i dettagli della categoria
      </p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
      <objective-card
        v-for="obj in objectives"
        :key="obj.id"
        :objective="obj"
        :current-label="metricByKeyObj[obj.id]?.currentLabel"
        :target-label="metricByKeyObj[obj.id]?.goalLabel"
      />
    </div>
    <div v-if="metricsForView.length" class="mt-8">
      <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
        Stato complessivo delle metriche
      </h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Valori attuali rispetto agli obiettivi per le principali metriche di ogni area.
      </p>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <metric-card
          v-for="metric in metricsForView"
          :key="`${metric.category}-${metric.key}`"
          :label="metric.title"
          :value="metric.currentLabel"
          :goal="metric.goalLabel"
          :progress-percent="metric.progress"
          :icon-bg-class="metricIconBg(metric.category)"
        />
      </div>
    </div>
    <div class="mt-8 space-y-6">
      <objective-pie-chart :data="progressByCategory" />
      <div>
        <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
          Dettaglio per categoria
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ogni cerchio mostra il progresso della singola area rispetto al proprio target
        </p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <category-progress-card
            v-for="cat in progressByCategory"
            :key="cat.category"
            :label="cat.label"
            :value="cat.value"
          />
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useObjectives } from '@/composables/useObjectives'
import { useCategoryProgress } from '@/composables/useCategoryProgress'
import { useMetrics } from '@/composables/useMetrics'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ObjectiveCard from '@/components/dashboard/ObjectiveCard.vue'
import ObjectivePieChart from '@/components/dashboard/ObjectivePieChart.vue'
import CategoryProgressCard from '@/components/dashboard/CategoryProgressCard.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'

const { objectives } = useObjectives()
const { progressByCategory } = useCategoryProgress()
const { metricsForView } = useMetrics()

const metricByKeyObj = computed(() => {
  const obj: Record<string, (typeof metricsForView.value)[number]> = {}
  for (const metric of metricsForView.value) {
    obj[metric.key] = metric
  }
  return obj
})

function metricIconBg(category: string) {
  const map: Record<string, string> = {
    social: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    video: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    newsletter: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    siti: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    sondaggi: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  }
  return map[category] || 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
}
</script>
