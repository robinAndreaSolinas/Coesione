<template>
  <admin-layout>
    <page-breadcrumb page-title="API Management" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">API Management</h1>

    <div class="space-y-8">
      <section
        class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between text-left"
          @click="apiDocsCollapsed = !apiDocsCollapsed"
        >
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            API del progetto
          </h2>
          <svg
            class="h-5 w-5 transition-transform"
            :class="{ 'rotate-180': !apiDocsCollapsed }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="!apiDocsCollapsed" class="mt-4">
          <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Endpoint disponibili in questo progetto. Base URL: <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">/api/v1</code>
          </p>
          <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th class="px-3 py-2">Metodo</th>
                <th class="px-3 py-2">Path</th>
                <th class="px-3 py-2">Auth</th>
                <th class="px-3 py-2">Descrizione</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="api in apiDocs" :key="api.method + api.path">
                <td class="px-3 py-2">
                  <span
                    class="rounded px-2 py-0.5 text-xs font-medium"
                    :class="methodClass(api.method)"
                  >
                    {{ api.method }}
                  </span>
                </td>
                <td class="px-3 py-2 font-mono text-xs">{{ api.path }}</td>
                <td class="px-3 py-2 text-xs">{{ api.auth }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ api.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </section>

      <section
        v-if="isAdmin"
        class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
      >
        <h2 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          External API Key
        </h2>
        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Chiavi API esterne salvate in modo sicuro sul server
        </p>
        <form
          v-if="showAddForm"
          class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
          autocomplete="off"
          @submit.prevent
        >
          <h3 class="mb-4 text-sm font-semibold">Nuova external API key</h3>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Tipo</label>
              <select
                v-model="newKey.type"
                class="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                autocomplete="off"
              >
                <option value="jwt">JWT</option>
                <option value="api_key">API key</option>
                <option value="secret_client">Secret + Client</option>
                <option value="token_json">token.json</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Fonte <span class="text-error-500">*</span></label>
              <select
                v-model="newKey.source"
                required
                class="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                autocomplete="off"
              >
                <option value="">—</option>
                <option value="BigQuery">BigQuery</option>
                <option value="Google Analytics">Google Analytics</option>
                <option value="Piano.io">Piano.io</option>
                <option value="Dailymotion">Dailymotion</option>
                <option value="Airtable">Airtable</option>
                <option value="YouTube">YouTube</option>
                <option value="Meta">Meta</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Nome</label>
              <input
                v-model="newKey.name"
                type="text"
                placeholder="es. Google Analytics"
                name="x"
                class="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                autocomplete="off"
                data-lpignore="true"
                data-1p-ignore
                data-bwignore
              />
            </div>
            <template v-if="newKey.type === 'secret_client'">
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Client ID</label>
                <input
                  v-model="newKey.clientId"
                  type="text"
                  placeholder="Client ID"
                  name="x"
                  class="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  autocomplete="off"
                  data-lpignore="true"
                  data-1p-ignore
                  data-bwignore
                />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Client Secret</label>
                <input
                  v-model="newKey.clientSecret"
                  type="text"
                  placeholder="Client Secret"
                  name="x"
                  class="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  autocomplete="off"
                  data-lpignore="true"
                  data-1p-ignore
                  data-bwignore
                />
              </div>
            </template>
            <template v-else>
              <div :class="newKey.type === 'token_json' ? 'sm:col-span-2 lg:col-span-3' : 'sm:col-span-2'">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">{{ typeInputLabel(newKey.type) }}</label>
                <input
                  v-if="newKey.type !== 'token_json'"
                  v-model="newKey.key"
                  type="text"
                  :placeholder="typePlaceholder(newKey.type)"
                  name="x"
                  class="h-9 w-full rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  autocomplete="off"
                  data-lpignore="true"
                  data-1p-ignore
                  data-bwignore
                />
                <textarea
                  v-else
                  v-model="newKey.key"
                  :placeholder="typePlaceholder(newKey.type)"
                  rows="6"
                  name="x"
                  class="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  autocomplete="off"
                  data-lpignore="true"
                  data-1p-ignore
                  data-bwignore
                />
              </div>
            </template>
          </div>
          <p v-if="keyError" class="mt-2 text-sm text-error-500">{{ keyError }}</p>
          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="rounded-lg bg-brand-500 px-3 py-1.5 text-sm text-white hover:bg-brand-600"
              @click="addKey"
            >
              Aggiungi
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
              @click="cancelAdd"
            >
              Annulla
            </button>
          </div>
        </form>
        <button
          v-else
          type="button"
          class="mb-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="showAddForm = true"
        >
          + Aggiungi external API key
        </button>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th class="px-3 py-2">#</th>
                <th class="px-3 py-2">Tipo</th>
                <th class="px-3 py-2">Fonte</th>
                <th class="px-3 py-2">Nome</th>
                <th class="px-3 py-2">Creato</th>
                <th class="px-3 py-2 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="k in keys" :key="k.hash">
                <td class="px-3 py-2 font-mono text-xs text-gray-500" :title="k.hash">{{ (k.hash || '').slice(0, 8) }}</td>
                <td class="px-3 py-2 text-xs">{{ typeLabel(k.type) }}</td>
                <td class="px-3 py-2 text-xs">{{ k.source || '—' }}</td>
                <td class="px-3 py-2">{{ k.name }}</td>
                <td class="px-3 py-2 text-xs text-gray-500">{{ formatDate(k.createdAt) }}</td>
                <td class="px-3 py-2 text-right">
                  <button
                    type="button"
                    class="text-error-600 hover:text-error-700 dark:text-error-500"
                    @click="openDeleteModal(k.hash, k.name)"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
              <tr v-if="!keys.length">
                <td colspan="6" class="px-3 py-6 text-center text-sm text-gray-500">
                  Nessuna external API key configurata
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div
      v-if="deleteModalOpen"
      class="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto"
    >
      <div
        class="fixed inset-0 h-full w-full bg-gray-900/50 backdrop-blur-sm"
        aria-hidden="true"
        @click="closeDeleteModal"
      />
      <div
        class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
        <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          Elimina external API key
        </h3>
        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Per confermare, scrivi <strong class="font-mono text-gray-700 dark:text-gray-300">ELIMINA {{ deleteTarget?.name?.toUpperCase() }}</strong>
        </p>
        <input
          v-model="deleteConfirmText"
          type="text"
          :placeholder="'ELIMINA ' + (deleteTarget?.name?.toUpperCase() ?? '')"
          autocomplete="off"
          class="mb-4 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm uppercase dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
          @keydown.enter.prevent="executeDelete()"
        />
        <p v-if="deleteError" class="mb-4 text-sm text-error-500">{{ deleteError }}</p>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 dark:text-gray-400"
            @click="closeDeleteModal"
          >
            Annulla
          </button>
          <button
            type="button"
            :disabled="deleteConfirmText.toUpperCase() !== confirmPhrase"
            class="rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-50"
            @click="executeDelete"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useAuth } from '@/composables/useAuth'
import { api, type ApiKeyEntry, type ApiKeyType } from '@/api/client'

const { currentUser } = useAuth()
const isAdmin = computed(() => currentUser.value?.role === 'Admin')

const apiDocs = [
  { method: 'GET', path: '/api/v1/health', auth: '—', desc: 'Health check' },
  { method: 'POST', path: '/api/v1/auth/login', auth: '—', desc: 'Login con email e password' },
  { method: 'GET', path: '/api/v1/auth/me', auth: 'Bearer', desc: 'Utente corrente' },
  { method: 'PATCH', path: '/api/v1/auth/me', auth: 'Bearer', desc: 'Aggiorna profilo (nome, email, password)' },
  { method: 'POST', path: '/api/v1/auth/logout', auth: '—', desc: 'Logout' },
  { method: 'GET', path: '/api/v1/users', auth: 'Admin', desc: 'Lista utenti' },
  { method: 'POST', path: '/api/v1/users', auth: 'Admin', desc: 'Crea utente' },
  { method: 'PUT', path: '/api/v1/users/:id', auth: 'Admin', desc: 'Aggiorna utente' },
  { method: 'DELETE', path: '/api/v1/users/:id', auth: 'Admin', desc: 'Elimina utente' },
  { method: 'GET', path: '/api/v1/pages/visibility', auth: '—', desc: 'Visibilità pagine' },
  { method: 'GET', path: '/api/v1/pages/visibility/:pageKey', auth: '—', desc: 'Visibilità singola pagina' },
  { method: 'PUT', path: '/api/v1/pages/visibility/:pageKey', auth: 'Admin', desc: 'Aggiorna visibilità' },
  { method: 'GET', path: '/api/v1/objectives', auth: '—', desc: 'Lista obiettivi' },
  { method: 'PUT', path: '/api/v1/objectives/:id', auth: 'Editor/Admin', desc: 'Aggiorna obiettivo' },
  { method: 'GET', path: '/api/v1/api-keys', auth: 'Admin', desc: 'Lista API key' },
  { method: 'POST', path: '/api/v1/api-keys', auth: 'Admin', desc: 'Crea API key' },
  { method: 'PUT', path: '/api/v1/api-keys/:hash', auth: 'Admin', desc: 'Aggiorna API key' },
  { method: 'DELETE', path: '/api/v1/api-keys/:hash', auth: 'Admin', desc: 'Elimina API key' },
]

const apiDocsCollapsed = ref(true)
const keys = ref<ApiKeyEntry[]>([])
const showAddForm = ref(false)
const keyError = ref('')
const deleteModalOpen = ref(false)
const deleteTarget = ref<{ hash: string; name: string } | null>(null)
const deleteConfirmText = ref('')
const deleteError = ref('')

const confirmPhrase = computed(() =>
  deleteTarget.value ? `ELIMINA ${deleteTarget.value.name.toUpperCase()}` : ''
)
const KEY_TYPES: { value: ApiKeyType; label: string }[] = [
  { value: 'jwt', label: 'JWT' },
  { value: 'api_key', label: 'API key' },
  { value: 'secret_client', label: 'Secret + Client' },
  { value: 'token_json', label: 'token.json' },
]
const newKey = ref({
  name: '',
  source: '',
  type: 'api_key' as ApiKeyType,
  key: '',
  clientId: '',
  clientSecret: '',
})

watch(() => newKey.value.type, () => {
  newKey.value.key = ''
  newKey.value.clientId = ''
  newKey.value.clientSecret = ''
})

function typeLabel(t?: ApiKeyType): string {
  if (!t) return 'API key'
  return KEY_TYPES.find((x) => x.value === t)?.label ?? t
}

function typeInputLabel(t: ApiKeyType): string {
  const map: Record<ApiKeyType, string> = {
    jwt: 'JWT token',
    api_key: 'API key',
    secret_client: '',
    token_json: 'Contenuto token.json',
  }
  return map[t] ?? 'Valore'
}

function typePlaceholder(t: ApiKeyType): string {
  const map: Record<ApiKeyType, string> = {
    jwt: 'eyJhbGciOiJIUzI1NiIs...',
    api_key: 'sk-xxx...',
    secret_client: '',
    token_json: '{"type":"service_account",...}',
  }
  return map[t] ?? 'Valore'
}

function methodClass(m: string) {
  const map: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  }
  return map[m] ?? 'bg-gray-100 dark:bg-gray-800'
}

function formatDate(s: string | number) {
  try {
    return new Date(s).toLocaleDateString('it-IT')
  } catch {
    return String(s)
  }
}

async function loadKeys() {
  if (!isAdmin.value) return
  try {
    keys.value = await api.apiKeys.list()
  } catch {
    keys.value = []
  }
}

async function addKey() {
  keyError.value = ''
  const { name, source, type, key, clientId, clientSecret } = newKey.value
  const sourceVal = source || ''
  let payload: string | Record<string, unknown>
  if (type === 'secret_client') {
    if (!clientId?.trim() || !clientSecret?.trim()) {
      keyError.value = 'Client ID e Client Secret richiesti'
      return
    }
    payload = { client_id: clientId.trim(), client_secret: clientSecret.trim() }
  } else if (type === 'token_json') {
    if (!key?.trim()) {
      keyError.value = 'Valore richiesto'
      return
    }
    try {
      payload = JSON.parse(key) as Record<string, unknown>
    } catch {
      keyError.value = 'JSON non valido'
      return
    }
  } else {
    if (!key?.trim()) {
      keyError.value = 'Valore richiesto'
      return
    }
    payload = key
  }
  if (!name.trim()) {
    keyError.value = 'Nome richiesto'
    return
  }
  if (!sourceVal.trim()) {
    keyError.value = 'Fonte richiesta'
    return
  }
  try {
    await api.apiKeys.create({ name: name.trim(), source: sourceVal, type, key: payload })
    cancelAdd()
    loadKeys()
  } catch (e) {
    keyError.value = e instanceof Error ? e.message : 'Errore'
  }
}

function cancelAdd() {
  showAddForm.value = false
  keyError.value = ''
  newKey.value = { name: '', source: '', type: 'api_key', key: '', clientId: '', clientSecret: '' }
}

function openDeleteModal(hash: string, name: string) {
  deleteTarget.value = { hash, name }
  deleteConfirmText.value = ''
  deleteError.value = ''
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  deleteModalOpen.value = false
  deleteTarget.value = null
  deleteConfirmText.value = ''
  deleteError.value = ''
}

async function executeDelete() {
  if (!deleteTarget.value || deleteConfirmText.value.toUpperCase() !== confirmPhrase.value) return
  deleteError.value = ''
  try {
    await api.apiKeys.delete(deleteTarget.value.hash)
    closeDeleteModal()
    loadKeys()
  } catch (e) {
    deleteError.value = e instanceof Error ? e.message : 'Errore'
  }
}

onMounted(loadKeys)
onBeforeUnmount(cancelAdd)
</script>
