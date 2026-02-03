<template>
  <admin-layout>
    <page-breadcrumb page-title="Gestione utenti" />
    <h1 class="mb-4 text-2xl font-bold text-gray-800 dark:text-white/90">Utenti</h1>
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <div class="mb-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div class="space-y-2">
          <p class="text-sm text-gray-500 dark:text-gray-400">Gestisci utenti, ruoli e password.</p>
          <div class="flex flex-wrap gap-3">
            <input
              v-model="search"
              type="text"
              placeholder="Cerca per nome o email"
              class="h-9 w-56 rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <label class="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <input
                v-model="onlyActive"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span>Mostra solo attivi</span>
            </label>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="showAddModal = true"
        >
          + Aggiungi utente
        </button>
      </div>

      <div v-if="showAddModal" class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h3 class="mb-3 text-sm font-semibold">Nuovo utente</h3>
        <div class="grid gap-3 sm:grid-cols-2">
          <input
            v-model="newUser.name"
            type="text"
            placeholder="Nome"
            class="h-9 rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <input
            v-model="newUser.email"
            type="email"
            placeholder="Email"
            class="h-9 rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <input
            v-model="newUser.password"
            type="password"
            placeholder="Password"
            class="h-9 rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            v-model="newUser.role"
            class="h-9 rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>
        <p v-if="addError" class="mt-2 text-sm text-error-500">{{ addError }}</p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="rounded-lg bg-brand-500 px-3 py-1.5 text-sm text-white hover:bg-brand-600"
            @click="submitAdd"
          >
            Crea
          </button>
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
            @click="cancelAdd"
          >
            Annulla
          </button>
        </div>
      </div>

      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="min-w-full text-sm">
          <thead>
            <tr
              class="border-b border-gray-200 text-left text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400"
            >
              <th class="px-3 py-2 sm:px-4">Nome</th>
              <th class="px-3 py-2 sm:px-4">Email</th>
              <th class="px-3 py-2 sm:px-4">Attivo</th>
              <th class="px-3 py-2 sm:px-4">Ruolo</th>
              <th class="px-3 py-2 sm:px-4">Password</th>
              <th class="px-3 py-2 sm:px-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="cursor-default"
              @dblclick="editUser(user)"
            >
              <td class="px-3 py-2 sm:px-4">
                <input
                  v-model="user.name"
                  type="text"
                  class="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  :disabled="!isEditing(user.id)"
                />
              </td>
              <td class="px-3 py-2 sm:px-4">
                <input
                  v-model="user.email"
                  type="email"
                  class="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  :disabled="!isEditing(user.id)"
                />
              </td>
              <td class="px-3 py-2 sm:px-4">
                <label class="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    v-model="user.active"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    :disabled="!isEditing(user.id)"
                  />
                  <span>{{ user.active ? 'Attivo' : 'Disattivo' }}</span>
                </label>
              </td>
              <td class="px-3 py-2 sm:px-4">
                <select
                  v-model="user.role"
                  class="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  :disabled="!isEditing(user.id)"
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </td>
              <td class="px-3 py-2 sm:px-4">
                <span
                  v-if="!isEditing(user.id)"
                  class="text-xs text-gray-400 dark:text-gray-500"
                >
                  ●●●●●●
                </span>
                <input
                  v-else
                  v-model="editingPassword[user.id]"
                  type="password"
                  placeholder="Lascia vuoto per non cambiare"
                  class="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </td>
              <td class="px-3 py-2 text-right sm:px-4">
                <div class="flex justify-end gap-1">
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                    @click="toggleEdit(user)"
                  >
                    <SettingsIcon class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full text-error-600 hover:bg-error-50 hover:text-error-700 dark:text-error-500 dark:hover:bg-error-500/10"
                    @click="confirmRemove(user.id, user.name)"
                  >
                    <TrashIconLg class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useUsers } from '@/composables/useUsers'
import type { AppUser } from '@/composables/useUsers'
import { TrashIconLg, SettingsIcon } from '@/icons'

const { users, addUser, updateUser, removeUser } = useUsers()

const search = ref('')
const onlyActive = ref(false)
const editingId = ref<string | null>(null)
const editingPassword = ref<Record<string, string>>({})
const showAddModal = ref(false)
const addError = ref('')
const newUser = ref({ name: '', email: '', password: '', role: 'Viewer' })

const filteredUsers = computed(() =>
  users.value.filter((u) => {
    const term = search.value.toLowerCase().trim()
    const matchesSearch =
      !term ||
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    const matchesActive = !onlyActive.value || u.active
    return matchesSearch && matchesActive
  })
)

async function confirmRemove(id: string, name: string) {
  if (!window.confirm(`Vuoi davvero rimuovere l'utente "${name}"?`)) return
  try {
    await removeUser(id)
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Errore')
  }
}

function toggleEdit(user: AppUser) {
  if (editingId.value === user.id) {
    saveUser(user)
    editingId.value = null
    editingPassword.value[user.id] = ''
  } else {
    editingId.value = user.id
  }
}

async function saveUser(user: AppUser) {
  try {
    const payload: Partial<AppUser> & { password?: string } = {
      name: user.name,
      email: user.email,
      active: user.active,
      role: user.role,
    }
    if (editingPassword.value[user.id]) {
      payload.password = editingPassword.value[user.id]
    }
    await updateUser(user.id, payload)
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Errore nel salvataggio')
  }
}

function editUser(user: AppUser) {
  editingId.value = editingId.value === user.id ? null : user.id
}

function isEditing(id: string) {
  return editingId.value === id
}

async function submitAdd() {
  addError.value = ''
  const { name, email, password, role } = newUser.value
  if (!name || !email || !password) {
    addError.value = 'Nome, email e password richiesti'
    return
  }
  try {
    await addUser({ name, email, password, role })
    cancelAdd()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Errore'
  }
}

function cancelAdd() {
  showAddModal.value = false
  addError.value = ''
  newUser.value = { name: '', email: '', password: '', role: 'Viewer' }
}
</script>
