<template>
  <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
    <h3 class="mb-4 font-semibold text-gray-800 dark:text-white/90">{{ title }}</h3>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="(value, key) in fields" :key="key">
        <label class="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
          {{ labelForKey(key) }}
        </label>
        <input
          type="text"
          :value="value"
          @input="$emit('update', key, ($event.target as HTMLInputElement).value)"
          class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SectionGoals } from '@/composables/useGoals'

const labelMap: Record<string, string> = {
  like: 'Like',
  condivisioni: 'Condivisioni',
  commenti: 'Commenti',
  reach: 'Reach',
  visualizzazioni: 'Visualizzazioni',
  minuti: 'Minuti guardati',
  completionRate: 'Completion rate',
  iscritti: 'Iscritti',
  openRate: 'Open rate',
  clickRate: 'Click rate',
  unsubscribe: 'Unsubscribe',
  pagineViste: 'Pagine viste',
  utentiUnici: 'Utenti unici',
  durataMedia: 'Durata media',
  bounceRate: 'Bounce rate',
  sondaggiAttivi: 'Sondaggi attivi',
  risposte: 'Risposte',
  mediaRisposte: 'Media risposte',
  target: 'Obiettivo principale',
  targetPercent: 'Target %',
  social: 'Social',
  video: 'Video',
  newsletter: 'Newsletter',
  siti: 'Siti',
}

defineProps<{
  title: string
  sectionKey: string
  fields: SectionGoals
}>()

defineEmits<{
  update: [key: string, value: string]
}>()

function labelForKey(key: string): string {
  return labelMap[key] ?? key
}
</script>
