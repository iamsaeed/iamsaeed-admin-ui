<script setup lang="ts">
import { ref } from 'vue'
import AuthLayout from '../../layouts/AuthLayout.vue'
import Icon from '../../components/ui/Icon.vue'

const emit = defineEmits<{ submit: [email: string]; navigate: [id: string] }>()

const email = ref('')
const sent = ref(false)

function send() {
  sent.value = true
  emit('submit', email.value)
}
</script>

<template>
  <AuthLayout headline="It happens." subline="We'll send you a link to get back in.">
    <template v-if="!sent">
      <h1 class="page-title mb-1">Reset your password</h1>
      <p class="text-muted text-xs mb-6">We'll email you a reset link.</p>

      <form class="flex flex-col gap-4" @submit.prevent="send()">
        <div class="form-group">
          <label class="form-label" for="fp-email">Email address</label>
          <input id="fp-email" v-model="email" class="form-input" type="email" autocomplete="email" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg">Send reset link</button>
      </form>
    </template>

    <template v-else>
      <div class="empty-state !items-start !text-left !px-0">
        <span class="empty-state-icon !bg-success-soft !text-success"><Icon name="check-circle" :size="22" /></span>
        <h1 class="page-title">Check your inbox</h1>
        <p class="text-muted text-xs">
          If an account exists for <strong class="text-fg">{{ email }}</strong>, a reset link is on its way.
        </p>
      </div>
    </template>

    <p class="text-xs text-muted text-center mt-6">
      <button class="btn btn-link text-xs" @click="emit('navigate', 'auth.signin')">
        <Icon name="arrow-left" :size="13" /> Back to sign in
      </button>
    </p>
  </AuthLayout>
</template>
