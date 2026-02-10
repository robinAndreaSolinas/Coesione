<template>
  <admin-layout>
    <page-breadcrumb page-title="Gestione Obiettivi" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Gestione Obiettivi</h1>
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Imposta gli obiettivi per ogni metrica. Valore numerico + tipologia (% K M).
      </p>
      <div class="space-y-6">
        <div
          v-for="obj in objectives"
          :key="obj.id"
          class="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center"
        >
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-800 dark:text-white/90">{{ obj.title }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ categoryLabel(obj) }} → {{ obj.path }}
            </p>
          </div>
          <div class="flex w-full gap-2 sm:w-auto">
            <div class="w-24">
              <label class="mb-1 block text-xs text-gray-500">Valore</label>
              <input
                type="number"
                step="any"
                :value="obj.value"
                @input="onValueInput(obj, ($event.target as HTMLInputElement).value)"
                class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div class="w-20">
              <label class="mb-1 block text-xs text-gray-500">Tipo</label>
              <select
                v-if="isAdmin"
                :value="obj.unit"
                @change="onUnitChange(obj, ($event.target as HTMLSelectElement).value)"
                class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">—</option>
                <option value="%">%</option>
                <option value="K">K</option>
                <option value="M">M</option>
              </select>
              <span v-else class="flex h-10 items-center text-sm text-gray-700 dark:text-gray-300">
                {{ obj.unit || '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <p class="mt-6 text-xs text-gray-500 dark:text-gray-400">
        Le modifiche vengono salvate automaticamente.
      </p>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useObjectives } from '@/composables/useObjectives'
import { useAuth } from '@/composables/useAuth'
import type { Objective } from '@/composables/useObjectives'

const { objectives, updateObjective } = useObjectives()
const { currentUser } = useAuth()
const isAdmin = computed(() => currentUser.value?.role === 'Admin')

const categoryLabels: Record<string, string> = {
  social: 'Social',
  video: 'Video',
  newsletter: 'Newsletter',
  siti: 'Siti',
  sondaggi: 'Sondaggi',
}

function categoryLabel(obj: Objective): string {
  return categoryLabels[obj.category] ?? obj.category
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function toBase(value: number, unit: string): number {
  if (unit === 'K') return value * 1_000
  if (unit === 'M') return value * 1_000_000
  return value
}

function fromBase(base: number, unit: string): number {
  if (unit === 'K') return base / 1_000
  if (unit === 'M') return base / 1_000_000
  return base
}

function onValueInput(obj: Objective, value: string) {
  const num = parseFloat(value)
  if (isNaN(num)) return
  obj.value = num
  debouncedSave(obj)
}

function onUnitChange(obj: Objective, unit: string) {
  // converte il valore mantenendo la metrica assoluta
  const base = toBase(obj.value, obj.unit)
  obj.value = fromBase(base, unit)
  obj.unit = unit
  debouncedSave(obj)
}

function debouncedSave(obj: Objective) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updateObjective(obj.id, obj.value, obj.unit)
    debounceTimer = null
  }, 400)
}
</script>
