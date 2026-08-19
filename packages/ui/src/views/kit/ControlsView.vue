<script setup lang="ts">
import { ref } from 'vue'
import KitBlock from '../../components/kit/KitBlock.vue'

const checks = ref([true, false, true])
const radio = ref('b')
const toggles = ref([true, false])
const range = ref(60)
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Selection controls</h1>
      <p class="page-sub">All tinted by <code class="font-mono">accent-color</code>, so they follow the skin.</p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Checkboxes">
      <label v-for="(_, i) in checks" :key="i" class="flex items-center gap-2 text-xs">
        <input v-model="checks[i]" type="checkbox" />
        Option {{ i + 1 }}
      </label>
      <label class="flex items-center gap-2 text-xs text-subtle">
        <input type="checkbox" disabled /> Disabled
      </label>
    </KitBlock>

    <KitBlock label="Radios">
      <label v-for="v in ['a','b','c']" :key="v" class="flex items-center gap-2 text-xs">
        <input v-model="radio" type="radio" :value="v" name="kit-radio" />
        Choice {{ v.toUpperCase() }}
      </label>
    </KitBlock>

    <KitBlock label="Switches">
      <div class="flex flex-col gap-3">
        <label v-for="(t, i) in toggles" :key="i" class="flex items-center gap-3 text-xs">
          <button class="switch" role="switch" :aria-checked="t" @click="toggles[i] = !t" />
          {{ i === 0 ? 'Email notifications' : 'Weekly digest' }}
        </label>
      </div>
    </KitBlock>

    <KitBlock label="Range">
      <div class="w-full max-w-sm flex items-center gap-3">
        <input v-model.number="range" type="range" min="0" max="100" class="flex-1" />
        <span class="tnum text-xs text-muted w-8 text-right">{{ range }}</span>
      </div>
    </KitBlock>

    <KitBlock label="Segmented">
      <div class="btn-group">
        <button class="btn" aria-pressed="true">List</button>
        <button class="btn">Board</button>
        <button class="btn">Calendar</button>
      </div>
    </KitBlock>
  </div>
</template>
