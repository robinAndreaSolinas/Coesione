<template>
  <router-link
    :to="objective.path"
    class="group block rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 dark:hover:shadow-theme-lg md:p-5"
    :class="borderAccentClass"
  >
    <div class="flex items-start gap-3">
      <div
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
        :class="iconBgClass"
      >
        <span class="[&>svg]:h-5 [&>svg]:w-5" v-html="iconSvg" />
      </div>
      <div class="min-w-0 flex-1">
        <span
          class="inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          :class="badgeClass"
        >
          {{ categoryLabel }}
        </span>
        <h3 class="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-gray-800 dark:text-white/90">
          {{ objective.title }}
        </h3>
        <p v-if="objective.value != null" class="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          Target: {{ formatGoal(objective.value, objective.unit) }}
        </p>
      </div>
      <svg
        class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500 dark:group-hover:text-brand-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Objective } from '@/composables/useObjectives'

const props = defineProps<{
  objective: Objective
}>()

function formatGoal(value: number, unit: string): string {
  if (unit === '%') return `${value}%`
  if (unit === 'K') return `${value}K`
  if (unit === 'M') return `${value}M`
  return String(value)
}

const categoryLabels: Record<string, string> = {
  social: 'Social',
  video: 'Video',
  newsletter: 'Newsletter',
  siti: 'Siti',
  sondaggi: 'Sondaggi',
}

const categoryLabel = computed(() => categoryLabels[props.objective.category] ?? props.objective.category)

const iconBgClass = computed(() => {
  const classes: Record<string, string> = {
    social: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    video: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    newsletter: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    siti: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    sondaggi: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  }
  return classes[props.objective.category] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
})

const badgeClass = computed(() => {
  const classes: Record<string, string> = {
    social: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    video: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    newsletter: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400',
    siti: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
    sondaggi: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  }
  return classes[props.objective.category] ?? 'bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400'
})

const borderAccentClass = computed(() => {
  const classes: Record<string, string> = {
    social: 'border-l-4 border-l-blue-500 dark:border-l-blue-400',
    video: 'border-l-4 border-l-red-500 dark:border-l-red-400',
    newsletter: 'border-l-4 border-l-green-500 dark:border-l-green-400',
    siti: 'border-l-4 border-l-purple-500 dark:border-l-purple-400',
    sondaggi: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
  }
  return classes[props.objective.category] ?? ''
})

const iconPaths: Record<string, string> = {
  social: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  video: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M23 7v10l-4-2V9l4-2zM5 17V7l4 2v8l-4 2zm8-12v12l4-2V7l-4-2z"/></svg>',
  newsletter: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 4l8 5 8-5v10H4V8z"/></svg>',
  siti: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
  sondaggi: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm9 2h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h4v2h-4v-2zM5 7h4v10H5V7z"/></svg>',
}

const iconSvg = computed(() => iconPaths[props.objective.category] ?? iconPaths.social)
</script>
