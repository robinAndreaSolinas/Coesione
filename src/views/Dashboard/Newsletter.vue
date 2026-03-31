<template>
  <admin-layout>
    <page-breadcrumb page-title="Analitiche Newsletter" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">Newsletter</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <metric-card
          label="Open rate (calcolato)"
          :value="openRateDisplay"
          :goal="newsletterGoals.openRate"
          :trend="openRateTrend"
        />
        <metric-card
          label="Click rate (calcolato)"
          :value="clickRateDisplay"
          :goal="newsletterGoals.clickRate"
          :trend="clickRateTrend"
        />
        <metric-card
          label="Policy briefs e newsletter distribuiti"
          :value="sentTotalDisplay"
          :goal="newsletterGoals.invii"
          :trend="null"
        />
        <metric-card
          label="Iscritti totali"
          :value="subscribersTotalDisplay"
          :goal="newsletterGoals.iscrittiTotali"
          :trend="subscribersTotalTrend"
        />
        <metric-card
          label="Iscritti attivi"
          :value="subscribersActiveDisplay"
          :goal="newsletterGoals.iscrittiAttivi"
          :trend="subscribersActiveTrend"
        />
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          title="Obiettivo iscritti"
          description="Target trimestrale iscritti"
          :progress="Math.round(subscribersDeltaPercent)"
          :target-percent="100"
          :target-label="newsletterGoals.iscrittiTotali"
          :current-label="subscribersTotalDisplay"
          progress-text="Crescita costante. Obiettivo a portata di mano."
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          title="Crescita iscritti"
          :series="chartSeries"
          :categories="monthCategories"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          title="Performance invii"
          description="Open rate e click rate per mese"
          :series="performanceSeries"
          :categories="monthCategories"
        />
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGoals } from '@/composables/useGoals'
import { useObjectives } from '@/composables/useObjectives'
import { useNewsletter } from '@/composables/useNewsletter'
import { useNewsletterDaily } from '@/composables/useNewsletterDaily'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart.vue'

const { goals } = useGoals()
const { objectives, formatGoal } = useObjectives()
const { metrics, formatNumber, formatPercent } = useNewsletter()
const { dailyPoints } = useNewsletterDaily()

const openRateDisplay = computed(() => formatPercent(metrics.value.openRate))
const clickRateDisplay = computed(() => formatPercent(metrics.value.clickRate))
const subscribersTotalDisplay = computed(() => formatNumber(metrics.value.subscribersTotal))
const subscribersActiveDisplay = computed(() => formatNumber(metrics.value.subscribersActive))
const sentTotalDisplay = computed(() => formatNumber(metrics.value.sentTotal))

const newsletterObjectivesById = computed(
  () =>
    new Map(
      objectives.value
        .filter((o) => o.category === 'newsletter')
        .map((o) => [o.id, o])
    )
)

const newsletterGoals = computed(() => {
  function goalFor(id: string, fallback: string): string {
    const obj = newsletterObjectivesById.value.get(id)
    if (!obj) return fallback
    return formatGoal(obj.value, obj.unit)
  }

  return {
    openRate: goalFor('newsletter-open-rate', goals.value.newsletter.openRate),
    clickRate: goalFor('newsletter-click-rate', goals.value.newsletter.clickRate),
    iscrittiTotali: goalFor('newsletter-subscribers-total', goals.value.newsletter.iscrittiTotali),
    iscrittiAttivi: goalFor('newsletter-subscribers-active', goals.value.newsletter.iscrittiAttivi),
    invii: goalFor('newsletter-sent', goals.value.newsletter.invii),
  }
})

const subscribersDeltaPercent = computed(() => {
  const obj = newsletterObjectivesById.value.get('newsletter-subscribers-total')
  if (!obj || obj.value <= 0) return 0

  let current = metrics.value.subscribersTotal

  if (obj.unit === 'K') {
    current = current / 1_000
  } else if (obj.unit === 'M') {
    current = current / 1_000_000
  }

  const val = (current / obj.value) * 100
  if (!Number.isFinite(val) || val < 0) return 0
  return Math.min(val, 999)
})

const subscribersDeltaLabel = computed(() => `${subscribersDeltaPercent.value.toFixed(1)}%`)

const monthlyBuckets = computed(() => {
  const byMonth = new Map<
    string,
    { openSum: number; clickSum: number; count: number; lastSubs: number }
  >()

  dailyPoints.value.forEach((p) => {
    const month = p.day.slice(0, 7) // YYYY-MM
    const bucket =
      byMonth.get(month) ?? { openSum: 0, clickSum: 0, count: 0, lastSubs: 0 }
    bucket.openSum += p.openRate
    bucket.clickSum += p.clickRate
    bucket.count += 1
    bucket.lastSubs = p.subscribersTotal
    byMonth.set(month, bucket)
  })

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, b]) => ({
      month,
      openRate: b.count ? Number((b.openSum / b.count).toFixed(2)) : 0,
      clickRate: b.count ? Number((b.clickSum / b.count).toFixed(2)) : 0,
      subscribersTotal: b.lastSubs,
    }))
})

const monthCategories = computed(() => monthlyBuckets.value.map((m) => m.month))

const chartSeries = computed(() => [
  {
    name: 'Iscritti',
    data: monthlyBuckets.value.map((m) => m.subscribersTotal),
  },
])

const performanceSeries = computed(() => [
  {
    name: 'Open rate %',
    data: monthlyBuckets.value.map((m) => m.openRate),
  },
  {
    name: 'Click rate %',
    data: monthlyBuckets.value.map((m) => m.clickRate),
  },
])

const lastTwoBuckets = computed(() => {
  const buckets = monthlyBuckets.value
  if (buckets.length === 0) {
    return { current: null as null | (typeof buckets[number]), previous: null as null | (typeof buckets[number]) }
  }
  if (buckets.length === 1) {
    return { current: buckets[0], previous: null as null | (typeof buckets[number]) }
  }
  return {
    current: buckets[buckets.length - 1],
    previous: buckets[buckets.length - 2],
  }
})

const openRateCurrentMonth = computed(() => {
  const b = lastTwoBuckets.value.current
  return b ? Number(b.openRate.toFixed(2)) : 0
})

const openRatePreviousMonth = computed(() => {
  const b = lastTwoBuckets.value.previous
  return b ? Number(b.openRate.toFixed(2)) : 0
})

const clickRateCurrentMonth = computed(() => {
  const b = lastTwoBuckets.value.current
  return b ? Number(b.clickRate.toFixed(2)) : 0
})

const clickRatePreviousMonth = computed(() => {
  const b = lastTwoBuckets.value.previous
  return b ? Number(b.clickRate.toFixed(2)) : 0
})

const openRateTrend = computed(() => {
  const buckets = monthlyBuckets.value
  if (buckets.length < 2) return 0
  const prev = buckets[buckets.length - 2].openRate
  const curr = buckets[buckets.length - 1].openRate
  const delta = curr - prev
  if (!Number.isFinite(delta)) return 0
  return Number(delta.toFixed(2))
})

const clickRateTrend = computed(() => {
  const buckets = monthlyBuckets.value
  if (buckets.length < 2) return 0
  const prev = buckets[buckets.length - 2].clickRate
  const curr = buckets[buckets.length - 1].clickRate
  const delta = curr - prev
  if (!Number.isFinite(delta)) return 0
  return Number(delta.toFixed(2))
})

const subscribersTotalTrend = computed(() => {
  const buckets = monthlyBuckets.value
  if (buckets.length < 2) return 0
  const prev = buckets[buckets.length - 2].subscribersTotal
  const curr = buckets[buckets.length - 1].subscribersTotal
  if (prev <= 0) return 0
  const deltaPercent = ((curr - prev) / prev) * 100
  if (!Number.isFinite(deltaPercent)) return 0
  return Number(deltaPercent.toFixed(2))
})

const subscribersActiveTrend = computed(() => {
  // Non abbiamo la serie mensile per gli attivi: usiamo lo stesso trend dei totali
  return subscribersTotalTrend.value
})
</script>
