<template>
  <router-link to="/" class="flex items-center gap-2">
    <img
      src="/images/logo/logo-icon.svg"
      alt=""
      class="h-8 w-8 flex-shrink-0"
    />
    <span
      v-if="showText"
      class="font-bold text-gray-900 dark:text-white/90"
      :class="textClass"
    >
      Cohesion Analytics
    </span>
  </router-link>
</template>

<script setup lang="ts">
defineProps<{
  showText?: boolean
  textClass?: string
}>()
</script>
