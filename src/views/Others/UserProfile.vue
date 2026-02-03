<template>
  <admin-layout>
    <page-breadcrumb page-title="Profilo" />
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
    >
      <h3 class="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">Profilo</h3>
      <div class="flex flex-col gap-6 max-w-md">
        <div class="flex items-center gap-4">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-xl font-semibold text-white"
          >
            {{ initial }}
          </div>
          <div>
            <p class="font-medium text-gray-800 dark:text-white/90">{{ currentUser?.name }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ currentUser?.email }}</p>
          </div>
        </div>
        <form @submit.prevent="save" class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Nome
            </label>
            <input
              v-model="form.name"
              type="text"
              class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Email
            </label>
            <input
              v-model="form.email"
              type="email"
              class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div class="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-400">Cambia password</p>
            <div>
              <label class="mb-1 block text-xs text-gray-500">Password attuale</label>
              <input
                v-model="form.currentPassword"
                type="password"
                placeholder="Password attuale"
                class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">Nuova password</label>
              <input
                v-model="form.newPassword"
                type="password"
                placeholder="Nuova password"
                class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">Conferma nuova password</label>
              <input
                v-model="form.confirmPassword"
                type="password"
                placeholder="Ripeti nuova password"
                class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>
          <p v-if="error" class="text-sm text-error-500">{{ error }}</p>
          <p v-if="success" class="text-sm text-success-600">Modifiche salvate.</p>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {{ saving ? 'Salvataggio...' : 'Salva' }}
          </button>
        </form>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useAuth } from '@/composables/useAuth'

const { currentUser, updateProfile } = useAuth()

const form = ref({ name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' })
const error = ref('')
const success = ref(false)
const saving = ref(false)

watch(
  currentUser,
  (u) => {
    if (u) {
      form.value = { name: u.name, email: u.email, currentPassword: '', newPassword: '', confirmPassword: '' }
    }
  },
  { immediate: true }
)

const initial = computed(() =>
  currentUser.value?.name ? currentUser.value.name[0].toUpperCase() : 'U'
)

async function save() {
  error.value = ''
  success.value = false
  if (form.value.newPassword || form.value.confirmPassword || form.value.currentPassword) {
    if (!form.value.currentPassword) {
      error.value = 'Inserisci la password attuale per cambiarla'
      return
    }
    if (form.value.newPassword.length < 6) {
      error.value = 'La nuova password deve avere almeno 6 caratteri'
      return
    }
    if (form.value.newPassword !== form.value.confirmPassword) {
      error.value = 'Le due password non coincidono'
      return
    }
  }
  saving.value = true
  try {
    const data: { name?: string; email?: string; currentPassword?: string; newPassword?: string } = {}
    if (form.value.name.trim()) data.name = form.value.name.trim()
    if (form.value.email.trim()) data.email = form.value.email.trim()
    if (form.value.newPassword) {
      data.currentPassword = form.value.currentPassword
      data.newPassword = form.value.newPassword
    }
    if (Object.keys(data).length === 0) return
    await updateProfile(data)
    form.value.currentPassword = ''
    form.value.newPassword = ''
    form.value.confirmPassword = ''
    success.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Errore'
  } finally {
    saving.value = false
  }
}
</script>
