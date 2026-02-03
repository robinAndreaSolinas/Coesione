<template>
  <div class="min-h-screen xl:flex">
    <app-sidebar />
    <Backdrop />
    <div
      class="flex-1 transition-all duration-300 ease-in-out"
      :class="[isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]']"
    >
      <app-header />

      <div
        v-if="showAdminBar"
        class="border-b-2 border-warning-400 bg-warning-100 px-4 py-2 dark:border-warning-600 dark:bg-warning-900/40"
      >
        <div
          class="mx-auto flex max-w-(--breakpoint-2xl) flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span class="text-sm font-semibold text-warning-900 dark:text-warning-100">
            Admin · Visibilità dashboard
          </span>
          <div class="flex flex-wrap items-center gap-4">
            <div
              class="flex items-center gap-3 rounded-xl border border-warning-200 bg-white/80 px-4 py-2.5 shadow-sm dark:border-warning-700/50 dark:bg-warning-950/30"
            >
              <span class="text-sm font-medium text-warning-900 dark:text-warning-100">Accesso</span>
              <button
                type="button"
                role="switch"
                :aria-checked="settings.isPublic"
                class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-warning-400 focus:ring-offset-2"
                :class="
                  settings.isPublic
                    ? 'bg-success-500 dark:bg-success-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                "
                @click="togglePublic"
              >
                <span
                  class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition"
                  :class="settings.isPublic ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
              <span
                class="min-w-[4.5rem] text-xs font-medium"
                :class="
                  settings.isPublic
                    ? 'text-success-700 dark:text-success-400'
                    : 'text-gray-600 dark:text-gray-400'
                "
              >
                {{ settings.isPublic ? 'Pubblica' : 'Privata' }}
              </span>
            </div>
            <div
              class="flex items-center gap-3 rounded-xl border border-warning-200 bg-white/80 px-4 py-2.5 shadow-sm dark:border-warning-700/50 dark:bg-warning-950/30"
            >
              <span class="text-sm font-medium text-warning-900 dark:text-warning-100">Visibile</span>
              <button
                type="button"
                role="switch"
                :aria-checked="settings.isVisibleForUsers"
                class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-warning-400 focus:ring-offset-2"
                :class="
                  settings.isVisibleForUsers
                    ? 'bg-success-500 dark:bg-success-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                "
                @click="toggleVisible"
              >
                <span
                  class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition"
                  :class="settings.isVisibleForUsers ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
              <span
                class="min-w-[4.5rem] text-xs font-medium"
                :class="
                  settings.isVisibleForUsers
                    ? 'text-success-700 dark:text-success-400'
                    : 'text-gray-600 dark:text-gray-400'
                "
              >
                {{ settings.isVisibleForUsers ? 'Sì' : 'No' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import Backdrop from './Backdrop.vue'
import { useSidebar } from '@/composables/useSidebar'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useAdminVisibility } from '@/composables/useAdminVisibility'

const { isExpanded, isHovered } = useSidebar()
const route = useRoute()
const { currentUser } = useCurrentUser()
const { getSettings, setPublic, setVisibleForUsers } = useAdminVisibility()

const isAdmin = computed(() => currentUser.value?.role === 'Admin')

const adminDashboardRoutes = ['Totale', 'Social', 'Video', 'Newsletter', 'Siti', 'Sondaggi']

const showAdminBar = computed(
  () => isAdmin.value && adminDashboardRoutes.includes((route.name as string) || '')
)

const settings = computed(() => getSettings((route.name as string) || ''))

const togglePublic = () => {
  setPublic(route.name as string, !settings.value.isPublic)
}

const toggleVisible = () => {
  setVisibleForUsers(route.name as string, !settings.value.isVisibleForUsers)
}
</script>

