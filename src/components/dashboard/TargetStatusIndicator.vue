<template>
  <span
    v-if="status"
    class="inline-flex shrink-0 items-center"
    :title="status === 'above' ? t('common.aboveTarget') : t('common.belowTarget')"
    role="img"
    :aria-label="status === 'above' ? t('common.aboveTarget') : t('common.belowTarget')"
  >
    <span
      class="h-2.5 w-2.5 rounded-full"
      :class="
        status === 'above'
          ? 'bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]'
          : 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.25)]'
      "
    />
  </span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TargetStatus } from '@/utils/targetStatus'

defineProps<{
  status: TargetStatus | null
}>()

const { t } = useI18n()
</script>
