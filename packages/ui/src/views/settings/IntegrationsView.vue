<script setup lang="ts">
import { ref } from 'vue'
import SettingsLayout from './SettingsLayout.vue'
import Icon from '../../components/ui/Icon.vue'

const emit = defineEmits<{ navigate: [id: string] }>()

const items = ref([
  { id: 'slack', name: 'Slack', icon: 'message-square', desc: 'Post publish events to a channel.', on: true },
  { id: 'github', name: 'GitHub', icon: 'code', desc: 'Sync docs from a repository.', on: true },
  { id: 'stripe', name: 'Stripe', icon: 'credit-card', desc: 'Subscriptions and invoices.', on: false },
  { id: 'mailchimp', name: 'Mailchimp', icon: 'mail', desc: 'Send new posts to your list.', on: false },
  { id: 'analytics', name: 'Analytics', icon: 'bar-chart', desc: 'Page views and referrers.', on: true },
  { id: 'webhooks', name: 'Webhooks', icon: 'plug', desc: 'Fire an HTTP request on any event.', on: false },
])
</script>

<template>
  <SettingsLayout active="settings.integrations" title="Integrations" subtitle="Connect the tools your team already uses."
                  @navigate="emit('navigate', $event)">
    <div class="grid-auto">
      <div v-for="i in items" :key="i.id" class="card card-p">
        <div class="flex items-start gap-3">
          <span class="kpi-icon shrink-0"><Icon :name="i.icon" :size="16" /></span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="card-title">{{ i.name }}</span>
              <span v-if="i.on" class="badge badge-success">Connected</span>
            </div>
            <p class="text-xs text-muted mt-1">{{ i.desc }}</p>
          </div>
          <button class="switch shrink-0" role="switch" :aria-checked="i.on"
                  :aria-label="`Toggle ${i.name}`" @click="i.on = !i.on" />
        </div>
      </div>
    </div>
  </SettingsLayout>
</template>
