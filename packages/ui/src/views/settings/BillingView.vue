<script setup lang="ts">
import SettingsLayout from './SettingsLayout.vue'
import Icon from '../../components/ui/Icon.vue'

const emit = defineEmits<{ navigate: [id: string] }>()

const plans = [
  { name: 'Starter', price: '$0', per: 'forever', seats: '3 seats', current: false },
  { name: 'Team', price: '$29', per: 'per month', seats: '15 seats', current: true },
  { name: 'Scale', price: '$99', per: 'per month', seats: 'Unlimited', current: false },
]
const invoices = [
  { id: 'INV-2026-08', date: '1 Aug 2026', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2026-07', date: '1 Jul 2026', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2026-06', date: '1 Jun 2026', amount: '$29.00', status: 'Paid' },
]
</script>

<template>
  <SettingsLayout active="settings.billing" title="Billing" subtitle="Plan, payment method and invoices."
                  @navigate="emit('navigate', $event)">
    <div class="grid-auto mb-6">
      <div v-for="p in plans" :key="p.name" class="card card-p"
           :class="p.current ? '!border-accent' : ''">
        <div class="flex items-center justify-between mb-2">
          <span class="card-title">{{ p.name }}</span>
          <span v-if="p.current" class="badge badge-accent">Current</span>
        </div>
        <div class="kpi-value !text-2xl">{{ p.price }}</div>
        <div class="text-xs text-muted">{{ p.per }} · {{ p.seats }}</div>
        <button class="btn btn-block mt-4" :class="p.current ? 'btn-secondary' : 'btn-primary'" :disabled="p.current">
          {{ p.current ? 'Current plan' : 'Switch' }}
        </button>
      </div>
    </div>

    <div class="card card-p mb-6 flex-col !items-start sm:!flex-row sm:!items-center gap-4">
      <span class="kpi-icon"><Icon name="credit-card" :size="16" /></span>
      <div class="flex-1">
        <div class="font-medium">Visa ending 4242</div>
        <div class="text-xs text-muted">Expires 09/2028</div>
      </div>
      <button class="btn btn-secondary btn-block-mobile">Update</button>
    </div>

    <div class="card">
      <div class="card-hd"><div class="card-title">Invoices</div></div>
      <div class="table-wrap">
        <table class="data-table data-table-stack" role="table">
          <thead><tr role="row"><th role="columnheader">Invoice</th><th role="columnheader">Date</th><th role="columnheader" class="num">Amount</th><th role="columnheader">Status</th><th role="columnheader" class="w-10"><span class="sr-only">Download</span></th></tr></thead>
          <tbody>
            <tr role="row" v-for="i in invoices" :key="i.id">
              <td role="cell" data-label="Invoice"><code class="font-mono text-xs">{{ i.id }}</code></td>
              <td role="cell" data-label="Date" class="text-muted">{{ i.date }}</td>
              <td role="cell" data-label="Amount" class="num tnum">{{ i.amount }}</td>
              <td role="cell" data-label="Status"><span class="badge badge-success">{{ i.status }}</span></td>
              <td role="cell" data-label="">
                <button class="btn btn-ghost btn-icon btn-sm"><Icon name="download" :size="14" label="Download invoice" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </SettingsLayout>
</template>
