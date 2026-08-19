<script setup lang="ts">
import Icon from '../components/ui/Icon.vue'
import { useTheme } from '../composables/useTheme'

const { resolvedTheme, skin, density, radius } = useTheme()

const kpis = [
  { label: 'Total readers', value: '284,592', delta: '12.4%', up: true, icon: 'users' },
  { label: 'Published posts', value: '1,247', delta: '8.1%', up: true, icon: 'file-text' },
  { label: 'Avg. read time', value: '4m 38s', delta: '2.3%', up: false, icon: 'zap' },
  { label: 'Engagement rate', value: '68.2%', delta: '5.7%', up: true, icon: 'sparkles' },
]

const sources = [
  { label: 'Organic search', pct: 42, series: 'c1' },
  { label: 'Direct', pct: 24, series: 'c2' },
  { label: 'Referral', pct: 18, series: 'c3' },
  { label: 'Social', pct: 11, series: 'c4' },
  { label: 'Email', pct: 5, series: 'c5' },
]

const activity = [
  { who: 'Marcus Tan', what: 'published “Designing for clarity”', when: '2h ago' },
  { who: 'Elena Marsh', what: 'commented on “The case for oklch”', when: '4h ago' },
  { who: 'Priya N.', what: 'invited 3 teammates', when: '6h ago' },
  { who: 'Sam R.', what: 'archived 12 old drafts', when: '1d ago' },
]
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Good morning, Ahmad</h1>
      <p class="page-sub">
        Currently rendering <strong class="text-fg">{{ resolvedTheme }}</strong> ·
        <strong class="text-fg">{{ skin }}</strong> · {{ density }} · {{ radius }} corners.
        Open the sliders in the topbar to change any of it.
      </p>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary"><Icon name="filter" :size="15" /> Filters</button>
      <button class="btn btn-primary"><Icon name="plus" :size="15" /> New post</button>
    </div>
  </div>

  <div class="grid-auto mb-4">
    <div v-for="k in kpis" :key="k.label" class="card kpi">
      <div class="flex items-start justify-between">
        <div class="kpi-label">{{ k.label }}</div>
        <span class="kpi-icon"><Icon :name="k.icon" :size="15" /></span>
      </div>
      <div class="kpi-value">{{ k.value }}</div>
      <span class="kpi-delta" :class="k.up ? 'kpi-delta-up' : 'kpi-delta-down'">
        <Icon :name="k.up ? 'trend-up' : 'trend-down'" :size="11" /> {{ k.delta }}
      </span>
    </div>
  </div>

  <!-- Single column on phones, 3:2 split from lg -->
  <div class="grid gap-4 lg:grid-cols-[3fr_2fr]">
    <div class="card">
      <div class="card-hd">
        <div>
          <div class="card-title">Audience overview</div>
          <div class="card-sub">Readers vs. subscribers — last 12 months</div>
        </div>
        <div class="btn-group hidden sm:inline-flex">
          <button class="btn">7d</button>
          <button class="btn">30d</button>
          <button class="btn" aria-pressed="true">12m</button>
        </div>
      </div>
      <div class="card-p">
        <!-- Inline SVG so the chart is themed by the same tokens as everything
             else — no chart library carrying its own hard-coded palette. -->
        <svg viewBox="0 0 600 220" class="w-full h-auto" role="img" aria-label="Audience over 12 months">
          <defs>
            <linearGradient id="lm-fill-1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--lm-c1)" stop-opacity="0.28" />
              <stop offset="100%" stop-color="var(--lm-c1)" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="lm-fill-2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--lm-c2)" stop-opacity="0.24" />
              <stop offset="100%" stop-color="var(--lm-c2)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g stroke="var(--lm-border)" stroke-dasharray="3 4">
            <line x1="0" y1="40" x2="600" y2="40" /><line x1="0" y1="90" x2="600" y2="90" />
            <line x1="0" y1="140" x2="600" y2="140" /><line x1="0" y1="190" x2="600" y2="190" />
          </g>
          <path d="M0,150 L55,140 L110,132 L165,138 L220,112 L275,96 L330,88 L385,66 L440,72 L495,50 L550,38 L600,26 L600,220 L0,220 Z" fill="url(#lm-fill-1)" />
          <path d="M0,150 L55,140 L110,132 L165,138 L220,112 L275,96 L330,88 L385,66 L440,72 L495,50 L550,38 L600,26" fill="none" stroke="var(--lm-c1)" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M0,182 L55,176 L110,168 L165,172 L220,150 L275,152 L330,140 L385,128 L440,132 L495,116 L550,104 L600,92 L600,220 L0,220 Z" fill="url(#lm-fill-2)" />
          <path d="M0,182 L55,176 L110,168 L165,172 L220,150 L275,152 L330,140 L385,128 L440,132 L495,116 L550,104 L600,92" fill="none" stroke="var(--lm-c2)" stroke-width="2.5" stroke-linejoin="round" />
        </svg>
        <div class="flex gap-4 mt-3 text-xs text-muted">
          <span class="flex items-center gap-1.5"><span class="dot" style="background: var(--lm-c1)" /> Readers</span>
          <span class="flex items-center gap-1.5"><span class="dot" style="background: var(--lm-c2)" /> Subscribers</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd">
        <div class="card-title">Traffic sources</div>
        <button class="btn btn-ghost btn-icon btn-sm"><Icon name="more" label="Options" /></button>
      </div>
      <div class="card-p flex flex-col gap-3">
        <div v-for="s in sources" :key="s.label">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="flex items-center gap-2">
              <span class="dot" :style="{ background: `var(--lm-${s.series})` }" />
              {{ s.label }}
            </span>
            <span class="tnum text-muted">{{ s.pct }}%</span>
          </div>
          <div class="progress">
            <div
              class="progress-bar"
              :style="{ width: `${s.pct}%`, background: `var(--lm-${s.series})` }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card mt-4">
    <div class="card-hd">
      <div class="card-title">Activity</div>
      <div class="card-sub">Across your team</div>
    </div>
    <div class="card-p flex flex-col gap-3">
      <div v-for="a in activity" :key="a.what" class="flex items-start gap-3">
        <span class="avatar avatar-sm">{{ a.who.slice(0, 1) }}</span>
        <div class="min-w-0 flex-1">
          <div class="text-xs"><strong class="font-medium">{{ a.who }}</strong> {{ a.what }}</div>
          <div class="text-[0.6875rem] text-subtle">{{ a.when }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
