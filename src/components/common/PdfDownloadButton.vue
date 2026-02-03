<template>
  <button
    type="button"
    :disabled="isExporting"
    @click="exportFullReport"
    class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
  >
    <svg
      v-if="!isExporting"
      class="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.5M17 14v6m0-3l3 3m-3-3l3-3"
      />
    </svg>
    <span v-else class="h-4 w-4 animate-spin">⟳</span>
    {{ isExporting ? 'Esportazione...' : 'Scarica PDF' }}
  </button>
</template>

<script setup lang="ts">
import { usePdfExport } from '@/composables/usePdfExport'

const { exportFullReport, isExporting } = usePdfExport()
</script>
