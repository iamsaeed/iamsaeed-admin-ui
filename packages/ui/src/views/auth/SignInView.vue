<script setup lang="ts">
import { ref } from 'vue'
import AuthLayout from '../../layouts/AuthLayout.vue'
import Icon from '../../components/ui/Icon.vue'

const emit = defineEmits<{ submit: [payload: { email: string; password: string }]; navigate: [id: string] }>()

const email = ref('')
const password = ref('')
const show = ref(false)
</script>

<template>
  <AuthLayout headline="Welcome back." subline="Pick up where your team left off.">
    <h1 class="page-title mb-1">Sign in</h1>
    <p class="text-muted text-xs mb-6">Enter your details to continue.</p>

    <form class="flex flex-col gap-4" @submit.prevent="emit('submit', { email, password })">
      <div class="form-group">
        <label class="form-label" for="email">Email address</label>
        <input id="email" v-model="email" class="form-input" type="email" autocomplete="email" required />
      </div>

      <div class="form-group">
        <div class="flex items-center justify-between mb-2">
          <label class="form-label !mb-0" for="password">Password</label>
          <button type="button" class="btn btn-link text-xs" @click="emit('navigate', 'auth.forgot')">
            Forgot?
          </button>
        </div>
        <div class="input-group">
          <input
            id="password"
            v-model="password"
            class="form-input !pl-(--lm-control-px) !pr-10"
            :type="show ? 'text' : 'password'"
            autocomplete="current-password"
            required
          />
          <button
            type="button"
            class="absolute right-2 btn btn-ghost btn-icon btn-sm"
            @click="show = !show"
          >
            <Icon :name="show ? 'eye-off' : 'eye'" :size="15" :label="show ? 'Hide password' : 'Show password'" />
          </button>
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-block btn-lg mt-2">Sign in</button>
    </form>

    <div class="flex items-center gap-3 my-6">
      <span class="flex-1 hairline" /><span class="text-[0.6875rem] text-subtle">OR</span><span class="flex-1 hairline" />
    </div>

    <div class="flex flex-col gap-2">
      <button class="btn btn-secondary btn-block"><Icon name="globe" :size="15" /> Continue with Google</button>
      <button class="btn btn-secondary btn-block"><Icon name="code" :size="15" /> Continue with GitHub</button>
    </div>

    <p class="text-xs text-muted text-center mt-6">
      No account?
      <button class="btn btn-link text-xs" @click="emit('navigate', 'auth.signup')">Create one</button>
    </p>
  </AuthLayout>
</template>
