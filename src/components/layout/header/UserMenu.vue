<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span
        class="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white"
      >
        {{ initial }}
      </span>
      <span class="block mr-1 font-medium text-theme-sm">{{ currentUser?.name ?? 'Utente' }}</span>
      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ currentUser?.name }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ currentUser?.email }}
        </span>
      </div>
      <ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <li v-for="item in menuItems" :key="item.href">
          <router-link
            :to="item.href"
            class="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            @click="closeDropdown"
          >
            <component
              :is="item.icon"
              class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            />
            {{ item.text }}
          </router-link>
        </li>
      </ul>
      <router-link
        to="/signin"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        @click="signOut"
      >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        Sign out
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserCircleIcon, ChevronDownIcon, LogoutIcon, SettingsIcon } from '@/icons'
import { useAuth } from '@/composables/useAuth'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const { currentUser, logout } = useAuth()
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const initial = computed(() =>
  currentUser.value?.name ? currentUser.value.name[0].toUpperCase() : 'U'
)

const menuItems = computed(() => {
  const items = [{ href: '/profile', icon: UserCircleIcon, text: 'Profilo' }]
  if (currentUser.value?.role === 'Admin') {
    items.push({ href: '/admin/users', icon: SettingsIcon, text: 'Account settings' })
  }
  return items
})

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const signOut = () => {
  logout()
  closeDropdown()
}

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
