<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../components/ui/Icon.vue'

const filter = ref('pending')
const comments = [
  { id: 1, who: 'Dana Reyes', on: 'Designing for clarity', when: '20m ago', state: 'pending',
    body: 'This finally made the oklch thing click for me. Is there a follow-up planned on chroma clamping?' },
  { id: 2, who: 'Kofi Mensah', on: 'The case for oklch', when: '2h ago', state: 'pending',
    body: 'Great write-up. One nit: the contrast table in section 3 seems to be missing the sepia column.' },
  { id: 3, who: 'Ruth Alvarez', on: 'Shipping a design system', when: '1d ago', state: 'approved',
    body: 'We adopted this approach last quarter and it cut our theme bugs dramatically.' },
  { id: 4, who: 'anon', on: 'Pricing', when: '2d ago', state: 'spam',
    body: 'CHEAP FOLLOWERS VISIT MY SITE NOW' },
]
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Comments</h1>
      <p class="page-sub">Moderate what readers leave on your content.</p>
    </div>
  </div>

  <div class="tabs mb-5">
    <button v-for="f in ['pending','approved','spam']" :key="f" class="tab"
            :class="filter === f ? 'is-active' : ''" @click="filter = f">
      <span class="capitalize">{{ f }}</span>
    </button>
  </div>

  <div class="flex flex-col gap-3">
    <article v-for="c in comments.filter(c => c.state === filter)" :key="c.id" class="card card-p">
      <div class="flex items-start gap-3">
        <span class="avatar">{{ c.who.slice(0, 1).toUpperCase() }}</span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-baseline gap-x-2">
            <span class="font-medium">{{ c.who }}</span>
            <span class="text-[0.6875rem] text-subtle">on “{{ c.on }}” · {{ c.when }}</span>
          </div>
          <p class="mt-1.5 text-muted">{{ c.body }}</p>
          <div class="flex flex-wrap gap-2 mt-3">
            <button class="btn btn-soft btn-sm"><Icon name="check" :size="13" /> Approve</button>
            <button class="btn btn-secondary btn-sm"><Icon name="message-square" :size="13" /> Reply</button>
            <button class="btn btn-ghost btn-sm text-danger"><Icon name="trash" :size="13" /> Delete</button>
          </div>
        </div>
      </div>
    </article>

    <div v-if="!comments.some(c => c.state === filter)" class="card empty-state">
      <span class="empty-state-icon"><Icon name="message-square" :size="22" /></span>
      <div class="font-medium text-fg">Nothing {{ filter }}</div>
    </div>
  </div>
</template>
