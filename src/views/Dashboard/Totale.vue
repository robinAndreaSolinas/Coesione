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
      />
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
import { useObjectives } from '@/composables/useObjectives'
import { useCategoryProgress } from '@/composables/useCategoryProgress'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ObjectiveCard from '@/components/dashboard/ObjectiveCard.vue'
import ObjectivePieChart from '@/components/dashboard/ObjectivePieChart.vue'
import CategoryProgressCard from '@/components/dashboard/CategoryProgressCard.vue'

const { objectives } = useObjectives()
const { progressByCategory } = useCategoryProgress()
</script>
