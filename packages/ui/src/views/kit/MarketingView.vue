<script setup lang="ts">
import KitBlock from '../../components/kit/KitBlock.vue'
import Icon from '../../components/ui/Icon.vue'

const features = [
  { icon: 'zap', title: 'Fast by default', desc: 'No runtime CSS-in-JS, no chart library, no rebuild to reskin.' },
  { icon: 'sparkles', title: 'Themeable', desc: 'Three themes and eight skins from one stylesheet.' },
  { icon: 'shield', title: 'Accessible', desc: 'Focus rings, 44px targets, reduced motion, forced colours.' },
]
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Marketing blocks</h1>
      <p class="page-sub">Public-page sections built from the same tokens as the admin.</p>
    </div>
  </div>

  <div class="card card-p flex flex-col !items-stretch gap-8">
    <KitBlock label="Hero">
      <div class="w-full text-center py-10 px-4 rounded-lg bg-accent-soft">
        <span class="badge badge-accent pill mb-4">v0.1 is out</span>
        <h2 class="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance max-w-2xl mx-auto">
          One admin theme. Every project.
        </h2>
        <p class="text-muted mt-3 max-w-lg mx-auto">
          Install it as a dependency and stop porting the same design for the fifth time.
        </p>
        <div class="flex flex-col sm:flex-row gap-2 justify-center mt-6">
          <button class="btn btn-primary btn-lg">Get started</button>
          <button class="btn btn-secondary btn-lg">Read the docs</button>
        </div>
      </div>
    </KitBlock>

    <KitBlock label="Feature grid">
      <div class="grid-auto w-full">
        <div v-for="f in features" :key="f.title" class="card card-p">
          <span class="kpi-icon mb-3"><Icon :name="f.icon" :size="16" /></span>
          <div class="card-title">{{ f.title }}</div>
          <p class="text-xs text-muted mt-1">{{ f.desc }}</p>
        </div>
      </div>
    </KitBlock>

    <KitBlock label="Stat band">
      <div class="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-border">
        <div v-for="s in [['5','ports replaced'],['162','configurations'],['11 kB','gzipped'],['60','icons']]" :key="s[0]" class="text-center">
          <div class="kpi-value !text-2xl">{{ s[0] }}</div>
          <div class="text-[0.6875rem] text-subtle">{{ s[1] }}</div>
        </div>
      </div>
    </KitBlock>

    <KitBlock label="CTA">
      <div class="w-full card card-p !bg-accent !text-on-accent flex-col sm:!flex-row sm:!items-center gap-4">
        <div class="flex-1">
          <div class="font-display font-semibold text-lg">Ready to build?</div>
          <p class="text-sm opacity-90 mt-0.5">Add the package and import one stylesheet.</p>
        </div>
        <button class="btn !bg-[var(--lm-surface)] !text-fg btn-block-mobile">Install now</button>
      </div>
    </KitBlock>
  </div>
</template>
