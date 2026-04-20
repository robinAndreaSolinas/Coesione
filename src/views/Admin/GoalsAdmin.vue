<template>
  <admin-layout>
    <page-breadcrumb page-title="Gestione Obiettivi" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Gestione Obiettivi</h1>
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Imposta gli obiettivi per ogni metrica. Valore numerico + tipologia (% K M).
      </p>
      <div class="space-y-4">
        <div
          v-for="group in groupedObjectives"
          :key="group.category"
          class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800"
            @click="toggleGroup(group.category)"
          >
            <div class="flex items-center gap-3">
              <span
                class="inline-flex h-7 items-center rounded-md px-2 text-xs font-semibold uppercase tracking-wider"
                :class="groupBadgeClass(group.category)"
              >
                {{ group.label }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ group.items.length }} {{ group.items.length === 1 ? 'obbiettivo' : 'obbiettivi' }}
              </span>
            </div>
            <svg
              class="h-5 w-5 text-gray-500 transition-transform duration-200 dark:text-gray-400"
              :class="{ 'rotate-180': isGroupOpen(group.category) }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="isGroupOpen(group.category)" class="space-y-4 p-4">
            <template v-if="group.category === 'social'">
              <div class="grid gap-4 md:grid-cols-2">
                <div
                  v-for="sub in socialPlatformCards"
                  :key="sub.key"
                  class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                  :class="sub.cardBgClass"
                >
                  <div class="mb-3 flex items-center gap-2">
                    <span
                      class="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-semibold uppercase tracking-wider"
                      :class="sub.badgeClass"
                    >
                      {{ sub.label }}
                    </span>
                  </div>
                  <div class="space-y-3">
                    <div
                      v-for="obj in sub.items"
                      :key="obj.id"
                      class="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800 sm:flex-row sm:items-center"
                      :class="sub.cardBgClass"
                    >
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ cleanMetricTitle(obj) }}</p>
                      </div>
                      <div class="flex w-full gap-2 sm:w-auto">
                        <div class="w-24">
                          <label class="mb-1 block text-xs text-gray-500">Valore</label>
                          <input
                            type="number"
                            :step="obj.unit === '%' ? 1 : 'any'"
                            :value="obj.value"
                            @input="onValueInput(obj, ($event.target as HTMLInputElement).value)"
                            class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                          />
                        </div>
                        <div class="w-20">
                          <label class="mb-1 block text-xs text-gray-500">Tipo</label>
                          <select
                            v-if="isAdmin"
                            :value="obj.unit"
                            @change="onUnitChange(obj, ($event.target as HTMLSelectElement).value)"
                            class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                          >
                            <option value="">—</option>
                            <option value="%">%</option>
                            <option value="K">K</option>
                            <option value="M">M</option>
                          </select>
                          <span v-else class="flex h-10 items-center text-sm text-gray-700 dark:text-gray-300">
                            {{ obj.unit || '—' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="socialGeneralItems.length > 0" class="space-y-3">
                <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Generali
                </p>
                <div
                  v-for="obj in socialGeneralItems"
                  :key="obj.id"
                  class="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center"
                >
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-gray-800 dark:text-white/90">{{ obj.title }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ categoryLabel(obj) }} → {{ obj.path }}
                    </p>
                  </div>
                  <div class="flex w-full gap-2 sm:w-auto">
                    <div class="w-24">
                      <label class="mb-1 block text-xs text-gray-500">Valore</label>
                      <input
                        type="number"
                        :step="obj.unit === '%' ? 1 : 'any'"
                        :value="obj.value"
                        @input="onValueInput(obj, ($event.target as HTMLInputElement).value)"
                        class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      />
                    </div>
                    <div class="w-20">
                      <label class="mb-1 block text-xs text-gray-500">Tipo</label>
                      <select
                        v-if="isAdmin"
                        :value="obj.unit"
                        @change="onUnitChange(obj, ($event.target as HTMLSelectElement).value)"
                        class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      >
                        <option value="">—</option>
                        <option value="%">%</option>
                        <option value="K">K</option>
                        <option value="M">M</option>
                      </select>
                      <span v-else class="flex h-10 items-center text-sm text-gray-700 dark:text-gray-300">
                        {{ obj.unit || '—' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div
                v-for="obj in group.items"
                :key="obj.id"
                class="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center"
              >
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-gray-800 dark:text-white/90">{{ obj.title }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ categoryLabel(obj) }} → {{ obj.path }}
                  </p>
                </div>
                <div class="flex w-full gap-2 sm:w-auto">
                  <div class="w-24">
                    <label class="mb-1 block text-xs text-gray-500">Valore</label>
                    <input
                      type="number"
                      :step="obj.unit === '%' ? 1 : 'any'"
                      :value="obj.value"
                      @input="onValueInput(obj, ($event.target as HTMLInputElement).value)"
                      class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    />
                  </div>
                  <div class="w-20">
                    <label class="mb-1 block text-xs text-gray-500">Tipo</label>
                    <select
                      v-if="isAdmin"
                      :value="obj.unit"
                      @change="onUnitChange(obj, ($event.target as HTMLSelectElement).value)"
                      class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    >
                      <option value="">—</option>
                      <option value="%">%</option>
                      <option value="K">K</option>
                      <option value="M">M</option>
                    </select>
                    <span v-else class="flex h-10 items-center text-sm text-gray-700 dark:text-gray-300">
                      {{ obj.unit || '—' }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <p class="mt-6 text-xs text-gray-500 dark:text-gray-400">
        Le modifiche vengono salvate automaticamente.
      </p>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useObjectives } from '@/composables/useObjectives'
import { useAuth } from '@/composables/useAuth'
import type { Objective } from '@/composables/useObjectives'

const { objectives, updateObjective } = useObjectives()
const { currentUser } = useAuth()
const isAdmin = computed(() => currentUser.value?.role === 'Admin')

const categoryLabels: Record<string, string> = {
  social: 'Social',
  video: 'Video',
  newsletter: 'Newsletter',
  siti: 'Siti',
  sondaggi: 'Sondaggi',
}

const categoryOrder = ['social', 'video', 'newsletter', 'siti', 'sondaggi']

function categoryLabel(obj: Objective): string {
  return categoryLabels[obj.category] ?? obj.category
}

const groupedObjectives = computed(() => {
  const map = new Map<string, Objective[]>()
  for (const obj of objectives.value) {
    const list = map.get(obj.category) ?? []
    list.push(obj)
    map.set(obj.category, list)
  }
  const ordered = [
    ...categoryOrder.filter((c) => map.has(c)),
    ...Array.from(map.keys()).filter((c) => !categoryOrder.includes(c)),
  ]
  return ordered.map((category) => ({
    category,
    label: categoryLabels[category] ?? category,
    items: map.get(category) ?? [],
  }))
})

const openGroups = ref<Record<string, boolean>>({})

function isGroupOpen(category: string): boolean {
  return openGroups.value[category] ?? true
}

function toggleGroup(category: string) {
  openGroups.value = {
    ...openGroups.value,
    [category]: !isGroupOpen(category),
  }
}

type SocialPlatformKey = 'facebook' | 'instagram' | 'tiktok' | 'youtube'

const socialPlatformOrder: SocialPlatformKey[] = ['facebook', 'instagram', 'tiktok', 'youtube']

const socialPlatformLabels: Record<SocialPlatformKey, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

const socialPlatformBadgeClass: Record<SocialPlatformKey, string> = {
  facebook: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  instagram: 'bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400',
  tiktok: 'bg-gray-900 text-white dark:bg-gray-700 dark:text-white',
  youtube: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
}

const socialPlatformCardBgClass: Record<SocialPlatformKey, string> = {
  facebook: 'bg-blue-50/60 dark:bg-blue-500/10',
  instagram: 'bg-pink-50/60 dark:bg-pink-500/10',
  tiktok: 'bg-gray-100/80 dark:bg-gray-700/30',
  youtube: 'bg-red-50/60 dark:bg-red-500/10',
}

function cleanMetricTitle(obj: Objective): string {
  const platform = detectSocialPlatform(obj)
  if (!platform) return obj.title
  const label = socialPlatformLabels[platform]
  return obj.title.replace(new RegExp(`^${label}\\s*·\\s*`), '')
}

function detectSocialPlatform(obj: Objective): SocialPlatformKey | null {
  const id = obj.id
  if (id.startsWith('social-facebook-')) return 'facebook'
  if (id.startsWith('social-instagram-')) return 'instagram'
  if (id.startsWith('social-tiktok-')) return 'tiktok'
  if (id.startsWith('social-youtube-')) return 'youtube'
  return null
}

const socialGroupItems = computed(() => {
  const socialGroup = groupedObjectives.value.find((g) => g.category === 'social')
  return socialGroup?.items ?? []
})

const socialPlatformCards = computed(() => {
  const map = new Map<SocialPlatformKey, Objective[]>()
  for (const obj of socialGroupItems.value) {
    const platform = detectSocialPlatform(obj)
    if (!platform) continue
    const list = map.get(platform) ?? []
    list.push(obj)
    map.set(platform, list)
  }
  return socialPlatformOrder
    .filter((p) => map.has(p))
    .map((p) => ({
      key: `social-${p}`,
      platform: p,
      label: socialPlatformLabels[p],
      badgeClass: socialPlatformBadgeClass[p],
      cardBgClass: socialPlatformCardBgClass[p],
      items: map.get(p) ?? [],
    }))
})

const socialGeneralItems = computed(() =>
  socialGroupItems.value.filter((obj) => detectSocialPlatform(obj) === null),
)

function groupBadgeClass(category: string): string {
  const map: Record<string, string> = {
    social: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    video: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    newsletter: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400',
    siti: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
    sondaggi: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  }
  return map[category] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300'
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function toBase(value: number, unit: string): number {
  if (unit === 'K') return value * 1_000
  if (unit === 'M') return value * 1_000_000
  return value
}

function fromBase(base: number, unit: string): number {
  if (unit === 'K') return base / 1_000
  if (unit === 'M') return base / 1_000_000
  return base
}

function onValueInput(obj: Objective, value: string) {
  const num = parseFloat(value)
  if (isNaN(num)) return
  obj.value = obj.unit === '%' ? Math.round(num) : num
  debouncedSave(obj)
}

function onUnitChange(obj: Objective, unit: string) {
  // converte il valore mantenendo la metrica assoluta
  const base = toBase(obj.value, obj.unit)
  const converted = fromBase(base, unit)
  obj.value = unit === '%' ? Math.round(converted) : converted
  obj.unit = unit
  debouncedSave(obj)
}

function debouncedSave(obj: Objective) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updateObjective(obj.id, obj.value, obj.unit)
    debounceTimer = null
  }, 400)
}
</script>
