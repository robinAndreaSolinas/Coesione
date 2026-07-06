<template>
  <admin-layout>
    <page-breadcrumb :page-title="t('dashboard.newsletter.breadcrumb')" />
    <h1 class="mb-6 text-2xl font-bold text-gray-800 dark:text-white/90">{{ t('dashboard.newsletter.title') }}</h1>
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
        <metric-card
          :label="t('dashboard.newsletter.openRate')"
          :value="openRateDisplay"
          :goal="newsletterGoals.openRate"
          :current-value="openRateVisual"
          :goal-value="objectiveTargetPair(objectives, 'newsletter-open-rate', openRateVisual).goalValue"
          :trend="null"
        />
        <metric-card
          :label="t('dashboard.newsletter.clickRate')"
          :value="clickRateDisplay"
          :goal="newsletterGoals.clickRate"
          :current-value="clickRateVisual"
          :goal-value="objectiveTargetPair(objectives, 'newsletter-click-rate', clickRateVisual).goalValue"
          :trend="null"
        />
        <metric-card
          :label="t('dashboard.newsletter.sent')"
          :value="sentTotalDisplay"
          :goal="newsletterGoals.invii"
          :current-value="sentTotalVisual"
          :goal-value="objectiveTargetPair(objectives, 'newsletter-sent', sentTotalVisual).goalValue"
          :trend="null"
        />
        <metric-card
          :label="t('dashboard.newsletter.recipients')"
          :value="destinatariDisplay"
          :trend="null"
        />
        <metric-card
          :label="t('dashboard.newsletter.feedbackPositive')"
          value="—"
          :goal="newsletterGoals.feedbackPositive"
          :trend="null"
        >
          <template #footer>
            <div
              class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-snug text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              {{ t('common.placeholderNotProgrammatic') }}
            </div>
          </template>
        </metric-card>
      </div>
      <div class="col-span-12 xl:col-span-7">
        <goal-progress
          :title="t('dashboard.newsletter.goalTitle')"
          :description="t('dashboard.newsletter.goalDescription')"
          :progress="Math.round(openRateProgressPercent)"
          :target-percent="100"
          :target-label="newsletterGoals.openRate"
          :current-label="openRateDisplay"
          :progress-text="t('dashboard.newsletter.goalProgressText')"
        />
      </div>
      <div class="col-span-12 xl:col-span-5">
        <analytics-chart
          :title="t('dashboard.newsletter.chartSubscribers')"
          :series="chartSeries"
          :categories="monthCategories"
        />
      </div>
      <div class="col-span-12">
        <analytics-chart
          :title="t('dashboard.newsletter.chartPerformance')"
          :description="t('dashboard.newsletter.chartPerformanceDescription')"
          :series="performanceSeries"
          :categories="monthCategories"
          y-axis-format="percent"
        />
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoals } from '@/composables/useGoals'
import { useObjectives, objectiveTargetPair } from '@/composables/useObjectives'
import { useNewsletter } from '@/composables/useNewsletter'
import { useNewsletterDaily } from '@/composables/useNewsletterDaily'
import { useMetrics } from '@/composables/useMetrics'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import GoalProgress from '@/components/dashboard/GoalProgress.vue'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart.vue'

const { t } = useI18n()
const { goals } = useGoals()
const { objectives, formatGoal } = useObjectives()
const { metrics, formatPercent } = useNewsletter()
const { dailyPoints } = useNewsletterDaily()
const { formatMetricValue } = useMetrics()

function denormalizeForUnit(raw: number, unit: string): number {
  if (unit === 'K') return raw / 1_000
  if (unit === 'M') return raw / 1_000_000
  if (unit === '%') return raw
  return raw
}

function formatByObjectiveUnit(raw: number, id: string): string {
  const obj = objectives.value.find((o) => o.id === id)
  if (!obj || !obj.unit) return String(Math.round(raw))
  return formatMetricValue(denormalizeForUnit(raw, obj.unit), obj.unit)
}

const openRateDisplay = computed(() => formatPercent(metrics.value.openRate))
const clickRateDisplay = computed(() => formatPercent(metrics.value.clickRate))
const openRateVisual = computed(() => metrics.value.openRate)
const clickRateVisual = computed(() => metrics.value.clickRate)

const newsletterObjectivesById = computed(
  () =>
    new Map(
      objectives.value
        .filter((o) => o.category === 'newsletter')
        .map((o) => [o.id, o])
    )
)

const sentTotalVisual = computed(() => {
  const obj = newsletterObjectivesById.value.get('newsletter-sent')
  return denormalizeForUnit(metrics.value.sentTotal, obj?.unit ?? '')
})
const destinatariDisplay = computed(() =>
  formatByObjectiveUnit(metrics.value.subscribersActive, 'newsletter-subscribers-active'),
)
const sentTotalDisplay = computed(() =>
  formatByObjectiveUnit(metrics.value.sentTotal, 'newsletter-sent'),
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
    invii: goalFor('newsletter-sent', goals.value.newsletter.invii),
    feedbackPositive: goalFor('newsletter-feedback-positive', '70%'),
  }
})

const openRateProgressPercent = computed(() => {
  const obj = newsletterObjectivesById.value.get('newsletter-open-rate')
  if (!obj || obj.value <= 0) return 0
  const current = metrics.value.openRate
  const val = (current / obj.value) * 100
  if (!Number.isFinite(val) || val < 0) return 0
  return Math.min(val, 999)
})

const monthlyBuckets = computed(() => {
  const byMonth = new Map<
    string,
    { sent: number; open: number; click: number; lastSubs: number }
  >()

  dailyPoints.value.forEach((p) => {
    const month = p.day.slice(0, 7)
    const bucket = byMonth.get(month) ?? { sent: 0, open: 0, click: 0, lastSubs: 0 }
    bucket.sent += p.sent ?? 0
    bucket.open += p.open ?? 0
    bucket.click += p.click ?? 0
    bucket.lastSubs = p.subscribersTotal
    byMonth.set(month, bucket)
  })

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, b]) => {
      const openRateRaw = b.sent > 0 ? (b.open / b.sent) * 100 : 0
      const clickRateRaw = b.sent > 0 ? (b.click / b.sent) * 100 : 0
      return {
        month,
        openRate: Number(Math.min(openRateRaw, 100).toFixed(2)),
        clickRate: Number(Math.min(clickRateRaw, 100).toFixed(2)),
        subscribersTotal: b.lastSubs,
      }
    })
})

const monthCategories = computed(() => monthlyBuckets.value.map((m) => m.month))

const chartSeries = computed(() => [
  {
    name: t('dashboard.newsletter.seriesSubscribers'),
    data: monthlyBuckets.value.map((m) => m.subscribersTotal),
  },
])

const performanceSeries = computed(() => [
  {
    name: `${t('dashboard.newsletter.openRate')} (%)`,
    data: monthlyBuckets.value.map((m) => m.openRate),
  },
  {
    name: `${t('dashboard.newsletter.clickRate')} (%)`,
    data: monthlyBuckets.value.map((m) => m.clickRate),
  },
])
</script>
