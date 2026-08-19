<script setup lang="ts">
import KitBlock from '../../components/kit/KitBlock.vue'
import Icon from '../../components/ui/Icon.vue'

const bars = [70, 92, 64, 110, 86, 132, 104, 148]
const donut = [
  { label: 'Organic', pct: 42, c: 'c1' },
  { label: 'Direct', pct: 24, c: 'c2' },
  { label: 'Referral', pct: 18, c: 'c3' },
  { label: 'Social', pct: 16, c: 'c4' },
]
/** Build stroke-dasharray offsets for a donut without a chart library. */
const circumference = 2 * Math.PI * 40
let acc = 0
const segments = donut.map((d) => {
  const seg = { ...d, dash: (d.pct / 100) * circumference, offset: -(acc / 100) * circumference }
  acc += d.pct
  return seg
})
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Charts &amp; metrics</h1>
      <p class="page-sub">
        Inline SVG using <code class="font-mono">--lm-c1…c5</code>. No chart library means no second,
        hard-coded palette to keep in sync.
      </p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Sparklines">
      <div v-for="(t, i) in ['Up', 'Down']" :key="t" class="flex items-center gap-3">
        <svg viewBox="0 0 100 28" class="w-28 h-7">
          <path :d="i === 0 ? 'M0,22 L14,19 L28,20 L42,13 L56,15 L70,8 L84,9 L100,3'
                            : 'M0,6 L14,9 L28,7 L42,14 L56,12 L70,19 L84,18 L100,24'"
                fill="none" :stroke="i === 0 ? 'var(--lm-success)' : 'var(--lm-danger)'" stroke-width="2" />
        </svg>
        <span class="kpi-delta" :class="i === 0 ? 'kpi-delta-up' : 'kpi-delta-down'">
          <Icon :name="i === 0 ? 'trend-up' : 'trend-down'" :size="11" /> {{ i === 0 ? '12.4%' : '3.1%' }}
        </span>
      </div>
    </KitBlock>

    <KitBlock label="Bars">
      <svg viewBox="0 0 420 160" class="w-full max-w-lg h-auto" role="img" aria-label="Bar chart">
        <g stroke="var(--lm-border)" stroke-dasharray="3 4">
          <line x1="0" y1="40" x2="420" y2="40" /><line x1="0" y1="90" x2="420" y2="90" />
        </g>
        <g fill="var(--lm-c1)">
          <rect v-for="(h, i) in bars" :key="i" :x="i * 52 + 8" :y="150 - h" width="34" :height="h" rx="3" />
        </g>
      </svg>
    </KitBlock>

    <KitBlock label="Donut">
      <div class="flex items-center gap-6 flex-wrap">
        <svg viewBox="0 0 100 100" class="w-32 h-32 -rotate-90" role="img" aria-label="Traffic sources">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--lm-sunken)" stroke-width="14" />
          <circle v-for="s in segments" :key="s.label" cx="50" cy="50" r="40" fill="none"
                  :stroke="`var(--lm-${s.c})`" stroke-width="14"
                  :stroke-dasharray="`${s.dash} ${circumference}`" :stroke-dashoffset="s.offset" />
        </svg>
        <ul class="flex flex-col gap-2">
          <li v-for="d in donut" :key="d.label" class="flex items-center gap-2 text-xs">
            <span class="dot" :style="{ background: `var(--lm-${d.c})` }" />
            <span class="text-muted">{{ d.label }}</span>
            <span class="tnum ml-2">{{ d.pct }}%</span>
          </li>
        </ul>
      </div>
    </KitBlock>

    <KitBlock label="Meters">
      <div class="w-full max-w-sm flex flex-col gap-3">
        <div v-for="(v, i) in [82, 54, 27]" :key="i">
          <div class="flex justify-between text-xs mb-1"><span class="text-muted">Metric {{ i + 1 }}</span><span class="tnum">{{ v }}%</span></div>
          <div class="progress">
            <div class="progress-bar" :style="{ width: `${v}%`, background: v > 70 ? 'var(--lm-success)' : v > 40 ? 'var(--lm-warn)' : 'var(--lm-danger)' }" />
          </div>
        </div>
      </div>
    </KitBlock>
  </div>
</template>
