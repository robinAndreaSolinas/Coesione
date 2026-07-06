<template>
  <div
    class="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-800"
    role="group"
    :aria-label="t('common.language')"
  >
    <button
      v-for="loc in locales"
      :key="loc"
      type="button"
      class="rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors"
      :class="
        locale === loc
          ? 'bg-brand-500 text-white'
          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90'
      "
      :aria-pressed="locale === loc"
      @click="switchLocale(loc)"
    >
      {{ loc }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setAppLocale, type AppLocale, SUPPORTED_LOCALES } from '@/i18n'

const { t, locale } = useI18n()
const locales = SUPPORTED_LOCALES

function switchLocale(loc: AppLocale) {
  setAppLocale(loc)
}
</script>
