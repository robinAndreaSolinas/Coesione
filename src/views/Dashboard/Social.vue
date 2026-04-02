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
          label="Audience"
          :value="socialCurrent.audience"
          :goal="socialGoals.audience"
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
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useObjectives } from '@/composables/useObjectives'
import { useSocialSummary } from '@/composables/useSocialSummary'
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
    audience: goalFor('social-audience', goals.value.social.audience),
    condivisioni: goalFor('social-shares', goals.value.social.condivisioni),
    postsCount: goalFor('social-posts-count', goals.value.social.postsCount),
  }
})

function formatCompact(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100
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
  const audienceObj = objectives.value.find((o) => o.id === 'social-audience')
  const sharesObj = objectives.value.find((o) => o.id === 'social-shares')

  const engagementUnit = engagementObj?.unit ?? '%'
  const viewsUnit = viewsObj?.unit ?? 'M'
  const audienceUnit = audienceObj?.unit ?? 'K'
  const sharesUnit = sharesObj?.unit ?? 'K'

  const engagementRateRawLabel = formatCompact(
    denormalizeForDisplay(engagementRateTotalPercent.value, engagementUnit),
    '%',
  )

  const engagementRate = formatCompact(engagementRateTotalPercent.value, '%')

  const views = formatCompact(denormalizeForDisplay(viewsTotal.value, viewsUnit), viewsUnit)
  const audience = formatCompact(denormalizeForDisplay(audienceTotal.value, audienceUnit), audienceUnit)
  const condivisioni = formatCompact(denormalizeForDisplay(sharesTotal.value, sharesUnit), sharesUnit)
  const posts = formatCompact(postsCount.value, objectives.value.find((o) => o.id === 'social-posts-count')?.unit ?? '')

  return {
    engagementRate,
    views,
    audience,
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
</script>
