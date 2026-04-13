<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Social" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Social</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card
          label="Engagement rate (calcolato)"
          :value="socialCurrent.engagementRate"
          :goal="socialGoals.engagementRate"
          :trend="null"
        />
        <metric-card
          label="Views"
          :value="socialCurrent.views"
          :goal="socialGoals.views"
          :trend="null"
        />
        <metric-card
          label="Reach"
          :value="socialCurrent.reach"
          :goal="socialGoals.reach"
          :trend="null"
        />
        <metric-card
          label="Condivisioni"
          :value="socialCurrent.condivisioni"
          :goal="socialGoals.condivisioni"
          :trend="null"
        />
        <metric-card
          label="Numero post"
          :value="socialCurrent.posts"
          :goal="socialGoals.postsCount"
          :trend="null"
        />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo engagement"
          description="Target mensile interazioni social"
          :progress="Math.round(socialProgressPercent)"
          :target-percent="100"
          :target-label="socialGoals.engagementRate"
          :current-label="socialCurrent.engagementRateRawLabel"
          progress-text="Ottimo engagement! Raggiungerai l'obiettivo a fine mese."
        />
      </div>
      <div class="col-span-12">
        <h2 class="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Split per social</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <div
            v-for="platform in platformCards"
            :key="platform.key"
            class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
          >
            <h3 class="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white/90">
              <span
                class="inline-flex h-6 w-6 items-center justify-center rounded-full text-white"
                :class="platform.iconClass"
                v-html="platform.iconSvg"
              />
              {{ platform.label }}
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <metric-card label="Reach" :value="platform.reachValue" :goal="platform.reachGoal" :trend="null" />
              <metric-card label="Engagement rate" :value="platform.erValue" :goal="platform.erGoal" :trend="null" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useObjectives } from '@/composables/useObjectives'
import { useSocialSummary } from '@/composables/useSocialSummary'
import { api, type SocialPlatformsData } from '@/api/client'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart.vue'

const { goals } = useGoals()
const { objectives, formatGoal } = useObjectives()

const socialGoals = computed(() => {
  const byId = new Map(
    objectives.value
      .filter((o) => o.category === 'social')
      .map((o) => [o.id, o])
  )

  function goalFor(id: string, fallback: string): string {
    const obj = byId.get(id)
    if (!obj) return fallback
    return formatGoal(obj.value, obj.unit)
  }

  return {
    engagementRate: goalFor('social-engagement-rate', goals.value.social.engagementRate),
    views: goalFor('social-views', goals.value.social.views),
    reach: goalFor('social-reach', goals.value.social.reach),
    condivisioni: goalFor('social-shares', goals.value.social.condivisioni),
    postsCount: goalFor('social-posts-count', goals.value.social.postsCount),
  }
})

function formatCompact(value: number, unit: string): string {
  const rounded = Math.round(value * 10) / 10
  if (unit === '%') return `${rounded}%`
  if (unit === 'K') return `${rounded}K`
  if (unit === 'M') return `${rounded}M`
  return String(rounded)
}

function denormalizeForDisplay(raw: number, unit: string): number {
  if (unit === 'K') return raw / 1_000
  if (unit === 'M') return raw / 1_000_000
  if (unit === '%') return raw
  return raw
}

const chartCategories = computed(() => ['Totale'])

const platforms = ref<SocialPlatformsData | null>(null)
onMounted(async () => {
  try {
    const resp = await api.social.platforms()
    platforms.value = resp?.data ?? null
  } catch {
    platforms.value = null
  }
})

const {
  interactionsTotal,
  audienceTotal,
  viewsTotal,
  sharesTotal,
  commentsTotal,
  engagementRateTotalPercent,
  postsCount,
} = useSocialSummary()

const socialCurrent = computed(() => {
  const engagementObj = objectives.value.find((o) => o.id === 'social-engagement-rate')
  const viewsObj = objectives.value.find((o) => o.id === 'social-views')
  const reachObj = objectives.value.find((o) => o.id === 'social-reach')
  const sharesObj = objectives.value.find((o) => o.id === 'social-shares')

  const engagementUnit = engagementObj?.unit ?? '%'
  const viewsUnit = viewsObj?.unit ?? 'M'
  const reachUnit = reachObj?.unit ?? 'K'
  const sharesUnit = sharesObj?.unit ?? 'K'

  const engagementRateRawLabel = formatCompact(
    denormalizeForDisplay(engagementRateTotalPercent.value, engagementUnit),
    '%',
  )

  const engagementRate = formatCompact(engagementRateTotalPercent.value, '%')

  const views = formatCompact(denormalizeForDisplay(viewsTotal.value, viewsUnit), viewsUnit)
  const reach = formatCompact(denormalizeForDisplay(audienceTotal.value, reachUnit), reachUnit)
  const condivisioni = formatCompact(denormalizeForDisplay(sharesTotal.value, sharesUnit), sharesUnit)
  const posts = formatCompact(postsCount.value, objectives.value.find((o) => o.id === 'social-posts-count')?.unit ?? '')

  return {
    engagementRate,
    views,
    reach,
    condivisioni,
    engagementRateRawLabel,
    posts,
  }
})

const socialProgressPercent = computed(() => {
  const engagementObj = objectives.value.find((o) => o.id === 'social-engagement-rate')
  const goalVisual = engagementObj?.value ?? 0 // gia' denormalizzato (unit % => valore in percent)
  if (goalVisual <= 0) return 0
  const progressRaw = (engagementRateTotalPercent.value / goalVisual) * 100
  return Math.max(0, Math.min(progressRaw, 999))
})

const chartSeries = computed(() => [
  { name: 'Interazioni', data: [denormalizeForDisplay(interactionsTotal.value, 'K')] },
])

const engagementSeries = computed(() => [
  { name: 'Engagement rate %', data: [engagementRateTotalPercent.value] },
  { name: 'Condivisioni (K)', data: [denormalizeForDisplay(sharesTotal.value, 'K')] },
  { name: 'Commenti (K)', data: [denormalizeForDisplay(commentsTotal.value, 'K')] },
])

const platformGoals = {
  facebook: { reach: 2000, reachUnit: 'K', er: 1.4, erUnit: '%' },
  instagram: { reach: 19000, reachUnit: 'K', er: 7.37, erUnit: '%' },
  youtube: { reach: 2000, reachUnit: 'K', er: 1.0, erUnit: '%' },
  tiktok: { reach: 24000, reachUnit: 'K', er: 7.73, erUnit: '%' },
} as const

const platformCards = computed(() => {
  const p = platforms.value
  const rows = [
    { key: 'facebook', label: 'Facebook', data: p?.facebook },
    { key: 'instagram', label: 'Instagram', data: p?.instagram },
    { key: 'youtube', label: 'YouTube', data: p?.youtube },
    { key: 'tiktok', label: 'TikTok', data: p?.tiktok },
  ] as const
  return rows.map((r) => {
    const cfg = platformGoals[r.key]
    const iconByKey = {
      facebook: {
        cls: 'bg-[#1877F2]',
        svg: '<svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-current"><path d="M13.5 21v-7h2.3l.4-3h-2.7V9.1c0-.9.3-1.6 1.6-1.6H16V4.8c-.5-.1-1.4-.2-2.4-.2-2.4 0-4 1.4-4 4.1V11H7v3h2.2v7h4.3z"/></svg>',
      },
      instagram: {
        cls: 'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
        svg: '<svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-current"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z"/><circle cx="17.3" cy="6.7" r="1.2"/><path d="M12 3.8c2.7 0 3 .01 4.1.06 2.7.12 4 1.4 4.1 4.1.05 1.1.06 1.4.06 4.1s-.01 3-.06 4.1c-.12 2.7-1.4 4-4.1 4.1-1.1.05-1.4.06-4.1.06s-3-.01-4.1-.06c-2.7-.12-4-1.4-4.1-4.1-.05-1.1-.06-1.4-.06-4.1s.01-3 .06-4.1c.12-2.7 1.4-4 4.1-4.1 1.1-.05 1.4-.06 4.1-.06M12 2c-2.8 0-3.1.01-4.2.06-3.6.16-5.6 2.2-5.8 5.8C2 9 2 9.3 2 12s0 3 .06 4.2c.16 3.6 2.2 5.6 5.8 5.8 1.1.05 1.4.06 4.2.06s3.1-.01 4.2-.06c3.6-.16 5.6-2.2 5.8-5.8.05-1.1.06-1.4.06-4.2s-.01-3.1-.06-4.2c-.16-3.6-2.2-5.6-5.8-5.8C15.1 2.01 14.8 2 12 2z"/></svg>',
      },
      youtube: {
        cls: 'bg-[#FF0000]',
        svg: '<svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-current"><path d="M23 12s0-3.2-.4-4.7c-.2-.8-.8-1.4-1.6-1.6C19.6 5.3 12 5.3 12 5.3s-7.6 0-9 .4c-.8.2-1.4.8-1.6 1.6C1 8.8 1 12 1 12s0 3.2.4 4.7c.2.8.8 1.4 1.6 1.6 1.4.4 9 .4 9 .4s7.6 0 9-.4c.8-.2 1.4-.8 1.6-1.6.4-1.5.4-4.7.4-4.7zM10 15.5v-7l6 3.5-6 3.5z"/></svg>',
      },
      tiktok: {
        cls: 'bg-black',
        svg: '<svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-current"><path d="M14.5 3h2.3c.2 1.8 1.3 3.4 3 4v2.4c-1.3 0-2.5-.4-3.6-1.1v6.3a5.6 5.6 0 1 1-4.8-5.6v2.5a3.1 3.1 0 1 0 2.1 2.9V3z"/></svg>',
      },
    } as const
    const icon = iconByKey[r.key]
    return {
      key: r.key,
      label: r.label,
      iconClass: icon.cls,
      iconSvg: icon.svg,
      reachValue: formatCompact(denormalizeForDisplay(r.data?.reach ?? 0, cfg.reachUnit), cfg.reachUnit),
      erValue: formatCompact(denormalizeForDisplay(r.data?.engagementRatePercent ?? 0, cfg.erUnit), cfg.erUnit),
      reachGoal: formatCompact(denormalizeForDisplay(cfg.reach, cfg.reachUnit), cfg.reachUnit),
      erGoal: formatCompact(denormalizeForDisplay(cfg.er, cfg.erUnit), cfg.erUnit),
    }
  })
})
</script>
