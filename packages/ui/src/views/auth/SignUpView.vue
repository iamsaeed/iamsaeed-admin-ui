<script setup lang="ts">
import { computed, ref } from 'vue'
import AuthLayout from '../../layouts/AuthLayout.vue'

const emit = defineEmits<{ submit: [payload: { name: string; email: string; password: string }]; navigate: [id: string] }>()

const name = ref('')
const email = ref('')
const password = ref('')

/** Cheap, honest strength meter — length, case mix, digits, symbols. */
const strength = computed(() => {
  const p = password.value
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^\w\s]/.test(p)) score++
  return Math.min(score, 4)
})
const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const barClass = ['bg-danger', 'bg-danger', 'bg-warn', 'bg-info', 'bg-success']
</script>

<template>
  <AuthLayout headline="Start publishing today." subline="Free for the first three seats.">
    <h1 class="page-title mb-1">Create your account</h1>
    <p class="text-muted text-xs mb-6">No card required.</p>

    <form class="flex flex-col gap-4" @submit.prevent="emit('submit', { name, email, password })">
      <div class="form-group">
        <label class="form-label" for="name">Full name</label>
        <input id="name" v-model="name" class="form-input" autocomplete="name" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="su-email">Email address</label>
        <input id="su-email" v-model="email" class="form-input" type="email" autocomplete="email" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="su-pw">Password</label>
        <input id="su-pw" v-model="password" class="form-input" type="password" autocomplete="new-password" required />
        <div v-if="password" class="mt-2">
          <div class="flex gap-1">
            <span
              v-for="i in 4"
              :key="i"
              class="h-1 flex-1 rounded-pill"
              :class="i <= strength ? barClass[strength] : 'bg-sunken'"
            />
          </div>
          <p class="form-hint">{{ labels[strength] }}</p>
        </div>
      </div>

      <label class="flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" class="mt-0.5" required />
        <span>I agree to the terms of service and privacy policy.</span>
      </label>

      <button type="submit" class="btn btn-primary btn-block btn-lg mt-2">Create account</button>
    </form>

    <p class="text-xs text-muted text-center mt-6">
      Already have an account?
      <button class="btn btn-link text-xs" @click="emit('navigate', 'auth.signin')">Sign in</button>
    </p>
  </AuthLayout>
</template>
