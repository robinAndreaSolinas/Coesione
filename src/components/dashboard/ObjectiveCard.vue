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
        <div class="mt-2 flex items-start justify-between gap-4">
          <h3 class="line-clamp-2 text-sm font-semibold leading-snug text-gray-800 dark:text-white/90">
            {{ objective.title }}
          </h3>
          <div class="shrink-0 text-right">
            <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Valore / Target
            </div>
            <div class="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
              {{ currentLabelComputed }} / {{ targetLabelComputed }}
            </div>
          </div>
        </div>
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
  currentLabel?: string | null
  targetLabel?: string | null
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
  social: '<svg fill="none" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.00002 12.0957C4.00002 7.67742 7.58174 4.0957 12 4.0957C16.4183 4.0957 20 7.67742 20 12.0957C20 16.514 16.4183 20.0957 12 20.0957H5.06068L6.34317 18.8132C6.48382 18.6726 6.56284 18.4818 6.56284 18.2829C6.56284 18.084 6.48382 17.8932 6.34317 17.7526C4.89463 16.304 4.00002 14.305 4.00002 12.0957ZM12 2.5957C6.75332 2.5957 2.50002 6.849 2.50002 12.0957C2.50002 14.4488 3.35633 16.603 4.77303 18.262L2.71969 20.3154C2.50519 20.5299 2.44103 20.8525 2.55711 21.1327C2.6732 21.413 2.94668 21.5957 3.25002 21.5957H12C17.2467 21.5957 21.5 17.3424 21.5 12.0957C21.5 6.849 17.2467 2.5957 12 2.5957ZM7.62502 10.8467C6.93467 10.8467 6.37502 11.4063 6.37502 12.0967C6.37502 12.787 6.93467 13.3467 7.62502 13.3467H7.62512C8.31548 13.3467 8.87512 12.787 8.87512 12.0967C8.87512 11.4063 8.31548 10.8467 7.62512 10.8467H7.62502ZM10.75 12.0967C10.75 11.4063 11.3097 10.8467 12 10.8467H12.0001C12.6905 10.8467 13.2501 11.4063 13.2501 12.0967C13.2501 12.787 12.6905 13.3467 12.0001 13.3467H12C11.3097 13.3467 10.75 12.787 10.75 12.0967ZM16.375 10.8467C15.6847 10.8467 15.125 11.4063 15.125 12.0967C15.125 12.787 15.6847 13.3467 16.375 13.3467H16.3751C17.0655 13.3467 17.6251 12.787 17.6251 12.0967C17.6251 11.4063 17.0655 10.8467 16.3751 10.8467H16.375Z" fill="currentColor"/></svg>',
  video: '<svg fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M5 6.75C5 5.7835 5.7835 5 6.75 5H14.25C15.2165 5 16 5.7835 16 6.75V8.25L18.659 6.478C19.8225 5.70233 21.375 6.53652 21.375 7.933V16.067C21.375 17.4635 19.8225 18.2977 18.659 17.522L16 15.75V17.25C16 18.2165 15.2165 19 14.25 19H6.75C5.7835 19 5 18.2165 5 17.25V6.75ZM6.5 6.75V17.25C6.5 17.3881 6.61193 17.5 6.75 17.5H14.25C14.3881 17.5 14.5 17.3881 14.5 17.25V6.75C14.5 6.61193 14.3881 6.5 14.25 6.5H6.75C6.61193 6.5 6.5 6.61193 6.5 6.75ZM16 10.053V13.947L19.073 15.995C19.2392 16.1058 19.4617 15.9866 19.4617 15.787V8.213C19.4617 8.01336 19.2392 7.89415 19.073 8.005L16 10.053Z"/></svg>',
  newsletter: '<svg fill="none" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 8.187V17.25C3.5 17.6642 3.83579 18 4.25 18H19.75C20.1642 18 20.5 17.6642 20.5 17.25V8.18747L13.2873 13.2171C12.5141 13.7563 11.4866 13.7563 10.7134 13.2171L3.5 8.187ZM20.5 6.2286C20.5 6.23039 20.5 6.23218 20.5 6.23398V6.24336C20.4976 6.31753 20.4604 6.38643 20.3992 6.42905L12.4293 11.9867C12.1716 12.1664 11.8291 12.1664 11.5713 11.9867L3.60116 6.42885C3.538 6.38481 3.50035 6.31268 3.50032 6.23568C3.50028 6.10553 3.60577 6 3.73592 6H20.2644C20.3922 6 20.4963 6.10171 20.5 6.2286ZM22 6.25648V17.25C22 18.4926 20.9926 19.5 19.75 19.5H4.25C3.00736 19.5 2 18.4926 2 17.25V6.23398C2 6.22371 2.00021 6.2135 2.00061 6.20333C2.01781 5.25971 2.78812 4.5 3.73592 4.5H20.2644C21.2229 4.5 22 5.27697 22.0001 6.23549C22.0001 6.24249 22.0001 6.24949 22 6.25648Z" fill="currentColor"/></svg>',
  siti: '<svg fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75ZM1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM11.25 3.5C9.74784 5.35746 8.8 8.31861 8.8 12C8.8 15.6814 9.74784 18.6425 11.25 20.5H12.75C14.2522 18.6425 15.2 15.6814 15.2 12C15.2 8.31861 14.2522 5.35746 12.75 3.5H11.25ZM10.5015 21.9866C8.49772 19.8929 7.3 16.4544 7.3 12C7.3 7.54564 8.49772 4.10714 10.5015 2.01338L11.0448 2.53342L11.25 2.75H12.75L12.9552 2.53342L13.4985 2.01338C15.5023 4.10714 16.7 7.54564 16.7 12C16.7 16.4544 15.5023 19.8929 13.4985 21.9866L12.9552 21.4666L12.75 21.25H11.25L11.0448 21.4666L10.5015 21.9866ZM2.25 12C2.25 11.5858 2.58579 11.25 3 11.25H21C21.4142 11.25 21.75 11.5858 21.75 12C21.75 12.4142 21.4142 12.75 21 12.75H3C2.58579 12.75 2.25 12.4142 2.25 12ZM4.9952 6.27067C5.13679 5.88143 5.56719 5.68049 5.95644 5.82208C7.80953 6.49618 9.8288 6.85 12 6.85C14.1712 6.85 16.1905 6.49618 18.0436 5.82208C18.4328 5.68049 18.8632 5.88143 19.0048 6.27067C19.1464 6.65991 18.9455 7.09031 18.5562 7.2319C16.5452 7.96339 14.376 8.35 12 8.35C9.62398 8.35 7.45482 7.96339 5.44379 7.2319C5.05455 7.09031 4.85361 6.65991 4.9952 6.27067ZM4.9952 17.7293C5.13679 17.3401 5.56719 17.1391 5.95644 17.2807C7.80953 17.9548 9.8288 18.3086 12 18.3086C14.1712 18.3086 16.1905 17.9548 18.0436 17.2807C18.4328 17.1391 18.8632 17.3401 19.0048 17.7293C19.1464 18.1186 18.9455 18.549 18.5562 18.6906C16.5452 19.4221 14.376 19.8086 12 19.8086C9.62398 19.8086 7.45482 19.4221 5.44379 18.6906C5.05455 18.549 4.85361 18.1186 4.9952 17.7293Z"/></svg>',
  sondaggi: '<svg fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 4.75C6.41421 4.75 6.75 5.08579 6.75 5.5V7.25H21C21.4142 7.25 21.75 7.58579 21.75 8C21.75 8.41421 21.4142 8.75 21 8.75H6.75V10.5C6.75 10.9142 6.41421 11.25 6 11.25C5.58579 11.25 5.25 10.9142 5.25 10.5V5.5C5.25 5.08579 5.58579 4.75 6 4.75ZM3 7.25C3.41421 7.25 3.75 7.58579 3.75 8C3.75 8.41421 3.41421 8.75 3 8.75C2.58579 8.75 2.25 8.41421 2.25 8C2.25 7.58579 2.58579 7.25 3 7.25ZM18 12.75C18.4142 12.75 18.75 13.0858 18.75 13.5V15.25H21C21.4142 15.25 21.75 15.5858 21.75 16C21.75 16.4142 21.4142 16.75 21 16.75H18.75V18.5C18.75 18.9142 18.4142 19.25 18 19.25C17.5858 19.25 17.25 18.9142 17.25 18.5V13.5C17.25 13.0858 17.5858 12.75 18 12.75ZM3 15.25H17.25V16.75H3C2.58579 16.75 2.25 16.4142 2.25 16C2.25 15.5858 2.58579 15.25 3 15.25Z"/></svg>',
}

const iconSvg = computed(() => iconPaths[props.objective.category] ?? iconPaths.social)

const currentLabelComputed = computed(() => props.currentLabel ?? 'N/A')
const targetLabelComputed = computed(
  () => props.targetLabel ?? (props.objective.value != null ? formatGoal(props.objective.value, props.objective.unit) : 'N/A'),
)
</script>
