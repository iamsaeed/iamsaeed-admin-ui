<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../../components/ui/Icon.vue'
import KitBlock from '../../components/kit/KitBlock.vue'
import DateRangePicker from '../../components/ui/DateRangePicker.vue'
import RichTextEditor from '../../components/editor/RichTextEditor.vue'
import PhoneInput from '../../components/ui/PhoneInput.vue'
import SearchSelect from '../../components/ui/SearchSelect.vue'
import Typeahead from '../../components/ui/Typeahead.vue'
import type { SearchSelectOption } from '../../components/ui/SearchSelect.vue'
import { toE164 } from '../../utils/phone'
import { addDays, todayIn } from '../../utils/dateRange'

const on = ref(true)

const today = todayIn()
const range = ref({ from: addDays(today, -6), to: today })
const open = ref({ from: '', to: '' })
const capped = ref({ from: '', to: '' })

const phone = ref({ national: '9161459446', iso: 'IN' })
const phoneFresh = ref({ national: '', iso: 'US' })
const phoneBad = ref({ national: '123', iso: 'GB' })

const LABELS = ['bug', 'billing', 'UI polish', 'api', 'accessibility', 'analytics', 'auth', 'backend', 'checkout', 'docs', 'emails', 'export', 'mobile', 'performance', 'reports', 'search', 'security', 'settings']
const labelOptions = LABELS.map((l) => ({ value: l, label: l }))
const label = ref('')
const labelReq = ref('billing')

/* A pretend directory of 60 companies behind a slow, uneven "server": each search takes 150-1400 ms, and honours the abort signal. */
const COMPANIES = Array.from({ length: 60 }, (_, i) => `${['Acme', 'Harbourline', 'Northwind', 'Bluebird', 'Summit', 'Cedar', 'Orchard', 'Kestrel', 'Lumen', 'Ironwood'][i % 10]} ${['Logistics', 'Dental', 'Properties', 'Foods', 'Studios', 'Holdings'][Math.floor(i / 10)]}`)
const company = ref<SearchSelectOption | null>(null)
const seen = ref({ sent: 0, stopped: 0, answered: 0, last: '' })
function searchCompanies(text: string, signal: AbortSignal): Promise<SearchSelectOption[]> {
  seen.value.sent++
  seen.value.last = text
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      seen.value.answered++
      const q = text.toLowerCase()
      resolve(COMPANIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 8).map((c) => ({ value: c, label: c })))
    }, 150 + Math.random() * 1250)
    signal.addEventListener('abort', () => { clearTimeout(timer); seen.value.stopped++; reject(new DOMException('Aborted', 'AbortError')) })
  })
}
const failing = (): Promise<SearchSelectOption[]> => Promise.reject(new Error('The search service is not answering. Try again.'))

const message = ref('<h2>Spring cleaning offer</h2><p>Hi {{first_name}}, we look after buildings like {{building}}.</p><ul><li>Common areas</li><li>Windows</li></ul>')
const editor = ref<InstanceType<typeof RichTextEditor> | null>(null)
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Inputs & forms</h1>
      <p class="page-sub">
        Fields are 16px on phones — anything smaller makes iOS Safari zoom on focus and strands the
        user mid-form.
      </p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Text">
      <div class="w-full max-w-sm form-group">
        <label class="form-label" for="f1">Email address</label>
        <input id="f1" class="form-input" type="email" placeholder="you@example.com" />
        <p class="form-hint">We never share this.</p>
      </div>
    </KitBlock>

    <KitBlock label="With leading icon">
      <div class="w-full max-w-sm input-group">
        <span class="input-group-icon"><Icon name="search" :size="15" /></span>
        <input class="form-input" placeholder="Search posts…" />
      </div>
    </KitBlock>

    <KitBlock label="Invalid">
      <div class="w-full max-w-sm form-group">
        <label class="form-label" for="f2">Slug</label>
        <input id="f2" class="form-input" aria-invalid="true" value="not a slug!" />
        <p class="form-error">Lowercase letters, numbers and hyphens only.</p>
      </div>
    </KitBlock>

    <KitBlock label="Select & textarea">
      <div class="w-full max-w-sm form-group">
        <label class="form-label" for="f3">Status</label>
        <select id="f3" class="form-select">
          <option>Draft</option><option>Published</option><option>Archived</option>
        </select>
      </div>
      <div class="w-full max-w-sm form-group">
        <label class="form-label" for="f4">Excerpt</label>
        <textarea id="f4" class="form-textarea" placeholder="A short summary…" />
      </div>
    </KitBlock>

    <KitBlock label="Disabled">
      <input class="form-input max-w-sm" value="Read only" aria-label="Read-only example" disabled />
    </KitBlock>

    <KitBlock label="Switch">
      <button
        class="switch"
        role="switch"
        :aria-checked="on"
        aria-label="Publish immediately"
        @click="on = !on"
      />
      <span class="text-xs text-muted" aria-hidden="true">Publish immediately</span>
    </KitBlock>

    <KitBlock label="Two-column row — stacks below md">
      <div class="form-row form-row-2 w-full max-w-xl">
        <div class="form-group">
          <label class="form-label" for="f5">First name</label>
          <input id="f5" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label" for="f6">Last name</label>
          <input id="f6" class="form-input" />
        </div>
      </div>
    </KitBlock>
    <KitBlock label="Date range — presets, two months, month/year views, typed dates">
      <div class="flex flex-col gap-2">
        <DateRangePicker v-model:from="range.from" v-model:to="range.to" label="Decided" :max="today" shiftable />
        <span class="text-xs text-muted">from={{ range.from || '∅' }} · to={{ range.to || '∅' }}</span>
      </div>
    </KitBlock>

    <KitBlock label="Date range — empty, no presets, up to 31 days">
      <DateRangePicker v-model:from="capped.from" v-model:to="capped.to" label="Period" :presets="[]" :max-days="31" :max="today" />
    </KitBlock>

    <KitBlock label="Rich text editor — Visual and HTML tabs, link, button, picture, merge fields">
      <div class="flex flex-col gap-3 w-full">
        <RichTextEditor ref="editor" v-model="message" label="Email message" placeholder="Write your message…" :min-height="10" />
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="chip" @click="editor?.insertText('{{first_name}}')">First name</button>
          <button type="button" class="chip" @click="editor?.insertText('{{building}}')">Building</button>
          <span class="text-xs text-muted">Chips call <code class="font-mono">insertText</code>; the value is plain HTML.</span>
        </div>
        <pre class="text-xs text-muted whitespace-pre-wrap">{{ message }}</pre>
      </div>
    </KitBlock>

    <KitBlock label="Rich text editor — disabled, and without the HTML tab">
      <div class="grid gap-3 md:grid-cols-2 w-full">
        <RichTextEditor model-value="<p>Locked wording.</p>" label="Locked" disabled :min-height="6" />
        <RichTextEditor model-value="<p>No HTML tab here.</p>" label="No raw HTML" :allow-html="false" :min-height="6" />
      </div>
    </KitBlock>

    <KitBlock label="Search select — a select with a search box (labels, people, projects)">
      <div class="grid gap-4 md:grid-cols-3 w-full">
        <div>
          <label class="form-label" for="kit-ss">Label filter</label>
          <SearchSelect id="kit-ss" v-model="label" :options="labelOptions" placeholder="Any label" search-placeholder="Search labels" label="Filter by label" />
          <p class="form-hint">Chosen: {{ label || 'nothing (any label)' }}</p>
        </div>
        <div>
          <label class="form-label" for="kit-ss-req">Required (no empty choice)</label>
          <SearchSelect id="kit-ss-req" v-model="labelReq" :options="labelOptions" :clearable="false" label="Label" />
        </div>
        <div>
          <label class="form-label" for="kit-ss-off">Locked</label>
          <SearchSelect id="kit-ss-off" model-value="api" :options="labelOptions" label="Label" disabled />
        </div>
      </div>
    </KitBlock>

    <KitBlock label="Typeahead — search as you type; only the last search counts">
      <div class="grid gap-4 md:grid-cols-2 w-full">
        <div>
          <label class="form-label" for="kit-ta">Company (slow pretend server, 150–1400 ms)</label>
          <Typeahead id="kit-ta" v-model="company" :search="searchCompanies" :min-chars="2" :delay="300" placeholder="Try “ac”, then “acme”" label="Company" />
          <p class="form-hint">Chosen: {{ company?.label ?? 'nobody yet' }}</p>
          <p class="form-hint" data-testid="kit-ta-stats">
            Searches sent: <strong>{{ seen.sent }}</strong> · stopped because you kept typing: <strong>{{ seen.stopped }}</strong> · answered: <strong>{{ seen.answered }}</strong><template v-if="seen.last"> · last asked for “{{ seen.last }}”</template>
          </p>
          <p class="form-hint">Type fast: one search goes out when you pause, not one per key. If a slow older answer comes back late, it is thrown away.</p>
        </div>
        <div>
          <label class="form-label" for="kit-ta-bad">When the service fails</label>
          <Typeahead id="kit-ta-bad" :search="failing" :delay="200" placeholder="Type anything" label="Company" />
        </div>
      </div>
    </KitBlock>

    <KitBlock label="Phone number — country list, search, type +91… to switch country">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="form-label" for="kit-phone">Mobile</label>
          <PhoneInput id="kit-phone" v-model="phone.national" v-model:country-code="phone.iso" />
          <p class="form-hint">Stored as {{ toE164(phone.iso, phone.national) || 'nothing yet' }}</p>
        </div>
        <div>
          <label class="form-label" for="kit-phone-2">Mobile — preferred countries</label>
          <PhoneInput id="kit-phone-2" v-model="phoneFresh.national" v-model:country-code="phoneFresh.iso" :preferred-countries="['AE', 'SA', 'PK', 'IN']" />
        </div>
      </div>
    </KitBlock>

    <KitBlock label="Phone number — error and disabled">
      <div class="grid gap-4 md:grid-cols-2">
        <PhoneInput v-model="phoneBad.national" v-model:country-code="phoneBad.iso" label="Mobile" error="Enter a full mobile number." />
        <PhoneInput model-value="9161459446" country-code="IN" label="Locked" disabled />
      </div>
    </KitBlock>

    <KitBlock label="Date range — error and disabled">
      <div class="flex flex-wrap gap-3">
        <DateRangePicker v-model:from="open.from" v-model:to="open.to" label="Due" error="Choose the dates the report covers." required />
        <DateRangePicker label="Locked" disabled />
      </div>
    </KitBlock>
  </div>
</template>
