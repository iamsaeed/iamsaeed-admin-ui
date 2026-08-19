<script setup lang="ts">
import Icon from '../components/ui/Icon.vue'

const kpis = [
  { label: 'Sessions', value: '128,402', delta: '9.2%', up: true },
  { label: 'Bounce rate', value: '38.4%', delta: '1.8%', up: false },
  { label: 'Avg. session', value: '3m 12s', delta: '4.5%', up: true },
  { label: 'Conversions', value: '2,104', delta: '11.7%', up: true },
]
const pages = [
  { path: '/blog/designing-for-clarity', views: '12,480', pct: 92 },
  { path: '/pricing', views: '9,331', pct: 68 },
  { path: '/', views: '8,204', pct: 60 },
  { path: '/blog/the-case-for-oklch', views: '5,911', pct: 44 },
  { path: '/about', views: '3,118', pct: 24 },
]
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Analytics</h1>
      <p class="page-sub">Last 30 days compared with the previous period.</p>
    </div>
    <div class="page-actions">
      <div class="btn-group"><button class="btn">7d</button><button class="btn" aria-pressed="true">30d</button><button class="btn">90d</button></div>
      <button class="btn btn-secondary"><Icon name="download" :size="15" /> Export</button>
    </div>
  </div>

  <div class="grid-auto mb-4">
    <div v-for="k in kpis" :key="k.label" class="card kpi">
      <div class="kpi-label">{{ k.label }}</div>
      <div class="kpi-value">{{ k.value }}</div>
      <span class="kpi-delta" :class="k.up ? 'kpi-delta-up' : 'kpi-delta-down'">
        <Icon :name="k.up ? 'trend-up' : 'trend-down'" :size="11" /> {{ k.delta }}
      </span>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[3fr_2fr]">
    <div class="card">
      <div class="card-hd"><div class="card-title">Sessions over time</div></div>
      <div class="card-p">
        <svg viewBox="0 0 600 200" class="w-full h-auto" role="img" aria-label="Sessions over 30 days">
          <g stroke="var(--lm-border)" stroke-dasharray="3 4">
            <line x1="0" y1="50" x2="600" y2="50" /><line x1="0" y1="100" x2="600" y2="100" /><line x1="0" y1="150" x2="600" y2="150" />
          </g>
          <g fill="var(--lm-c1)">
            <rect v-for="(h, i) in [70,92,64,110,86,132,104,148,120,158,136,170]" :key="i"
                  :x="i * 50 + 10" :y="190 - h" width="30" :height="h" rx="3" />
          </g>
        </svg>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><div class="card-title">Top pages</div></div>
      <div class="card-p flex flex-col gap-3">
        <div v-for="p in pages" :key="p.path">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <code class="font-mono truncate text-muted">{{ p.path }}</code>
            <span class="tnum ml-3 shrink-0">{{ p.views }}</span>
          </div>
          <div class="progress"><div class="progress-bar" :style="{ width: `${p.pct}%` }" /></div>
        </div>
      </div>
    </div>
  </div>
</template>
