# Your first screen

A complete, working admin screen — nav, shell, and a page built from the component classes.
Copy these four files, adjust the names, and you have a running admin.

Assumes you have finished [INTEGRATION.md](./INTEGRATION.md) steps 1 and 2 (stylesheet imported,
FOUC guard in `<head>`).

---

## 1. Nav data

Navigation is **data**, and every destination is a **route name, never a path**. A URL change
should be a router concern, never a nav-file edit.

```ts
// src/data/nav.ts
import type { BottomNavItem, NavSchema, UserMenuItem } from '@iamsaeed/admin-ui'

export const NAV: NavSchema = [
  {
    id: 'main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', to: 'dashboard' },
      { id: 'invoices', label: 'Invoices', icon: 'receipt', to: 'invoices', badge: 4 },
    ],
  },
  {
    id: 'crm',
    label: 'Customers',          // section heading; omit for an unlabelled group
    items: [
      {
        id: 'companies',
        label: 'Companies',
        icon: 'network',
        children: [              // a parent with children is an expandable group
          { id: 'companies.all', label: 'All companies', to: 'companies.all' },
          { id: 'companies.new', label: 'Add company', to: 'companies.new' },
        ],
      },
      { id: 'contacts', label: 'Contacts', icon: 'users', to: 'contacts' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: 'settings', to: 'settings' },
    ],
  },
]

// Phone thumb-zone bar. Capped at 5 — or 4 when you also show "More".
export const BOTTOM_NAV: BottomNavItem[] = [
  { id: 'dashboard', label: 'Home', icon: 'home' },
  { id: 'invoices', label: 'Invoices', icon: 'receipt', badge: 4 },
  { id: 'contacts', label: 'Contacts', icon: 'users' },
]

// Omit this prop entirely to get the default Settings + Sign out.
export const USER_MENU: UserMenuItem[] = [
  { id: 'profile', label: 'Your profile', icon: 'user' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'sign-out', label: 'Sign out', icon: 'log-out', danger: true, separated: true },
]
```

Available icon names are listed in [COMPONENTS.md → Icon names](./COMPONENTS.md#icon-names). An
unknown name renders nothing rather than throwing.

---

## 2. The shell

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AdminLayout, TweaksPanel, useSidebar } from '@iamsaeed/admin-ui'
import { NAV, BOTTOM_NAV, USER_MENU } from './data/nav'

const router = useRouter()
const route = useRoute()
const { setOpenGroup } = useSidebar()

const tweaksOpen = ref(false)

/* The shell never reads $route itself — you tell it what is active. */
const activeId = computed(() => (route.name as string) ?? '')

const title = computed(() => {
  for (const section of NAV) {
    for (const item of section.items) {
      if (item.id === activeId.value) return item.label
      const child = item.children?.find(c => c.id === activeId.value)
      if (child) return child.label
    }
  }
  return 'Admin'
})

/* Keep the group containing the current route expanded, so a deep link does
   not land on a page whose nav parent is collapsed. */
watch(activeId, id => {
  const parent = NAV.flatMap(s => s.items).find(i => i.children?.some(c => c.id === id))
  if (parent) setOpenGroup(parent.id)
}, { immediate: true })

function onNavigate(id: string) {
  if (router.hasRoute(id)) router.push({ name: id })
}
</script>

<template>
  <AdminLayout
    :nav="NAV"
    :bottom-nav="BOTTOM_NAV"
    :active-id="activeId"
    :title="title"
    :user-menu-items="USER_MENU"
    product-name="Acme"
    product-tag="Admin"
    version="v1.0.0"
    user-name="Ahmad"
    user-email="ahmad@example.com"
    @navigate="onNavigate"
    @open-tweaks="tweaksOpen = true"
    @user-menu-select="id => id === 'sign-out' ? signOut() : onNavigate(id)"
    @search="q => router.push({ name: 'search', query: { q } })"
  >
    <RouterView />
  </AdminLayout>

  <!-- Only if you want to give your users theme control. -->
  <TweaksPanel :open="tweaksOpen" @close="tweaksOpen = false" />
</template>
```

Auth screens render **outside** the shell — they are their own full-page layout. Mark those routes
with `meta: { bare: true }` and branch on it:

```vue
<RouterView v-if="route.meta.bare" />
<template v-else> …AdminLayout as above… </template>
```

---

## 3. A page

Almost all of a screen is plain HTML wearing the component classes. No Vue component is needed for
a card, a table, a form or a KPI tile.

```vue
<!-- src/views/InvoicesView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, Icon } from '@iamsaeed/admin-ui'

const rows = ref([
  { id: '1', company: 'Meridian Logistics', sub: 'Freight · Dubai', owner: 'Sara N.', amount: '48,200', status: 'paid' },
  { id: '2', company: 'Kestrel Interiors', sub: 'Fit-out · Sharjah', owner: 'Ahmad S.', amount: '12,750', status: 'overdue' },
])

const confirmOpen = ref(false)
const target = ref<string | null>(null)
const deleting = ref(false)

function askDelete(id: string) {
  target.value = id
  confirmOpen.value = true
}

async function remove() {
  deleting.value = true
  // …call your API…
  rows.value = rows.value.filter(r => r.id !== target.value)
  deleting.value = false
  confirmOpen.value = false
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Invoices</h1>
        <p class="page-sub">32 open · 4 overdue</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary">Export</button>
        <button class="btn btn-primary btn-block-mobile">New invoice</button>
      </div>
    </header>

    <!-- KPI row: two-up on phones, auto-fill from md -->
    <div class="grid-auto">
      <div class="card kpi">
        <p class="kpi-label">Outstanding</p>
        <p class="kpi-value">₹4,82,000</p>
        <span class="kpi-delta kpi-delta-up">+12.4%</span>
      </div>
      <div class="card kpi">
        <p class="kpi-label">Overdue</p>
        <p class="kpi-value">₹61,900</p>
        <span class="kpi-delta kpi-delta-down">-3.1%</span>
      </div>
    </div>

    <div class="toolbar" style="margin-top: 1.5rem">
      <div class="input-group">
        <span class="input-group-icon"><Icon name="search" :size="16" /></span>
        <input class="form-input" type="search" placeholder="Search invoices…" />
      </div>
      <span class="chip">Overdue</span>
    </div>

    <div class="card">
      <!--
        data-table-stack re-flows to compact blocks below 768px.
        The explicit roles are REQUIRED: changing `display` on table elements
        strips their implicit ARIA roles, so without these the table stops
        being a table to assistive tech at phone width.
      -->
      <table class="data-table data-table-stack" role="table">
        <thead>
          <tr role="row">
            <th role="columnheader">Company</th>
            <th role="columnheader">Owner</th>
            <th role="columnheader" class="num">Amount</th>
            <th role="columnheader">Status</th>
            <th role="columnheader"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" role="row">
            <td role="cell" data-label="Company">
              <span class="td-title">{{ row.company }}</span>
              <span class="td-sub">{{ row.sub }}</span>
            </td>
            <td role="cell" data-label="Owner">{{ row.owner }}</td>
            <td role="cell" data-label="Amount" class="num">{{ row.amount }}</td>
            <td role="cell" data-label="Status">
              <span class="badge" :class="row.status === 'paid' ? 'badge-success' : 'badge-danger'">
                {{ row.status }}
              </span>
            </td>
            <td role="cell" class="td-action">
              <button class="btn btn-ghost btn-sm btn-icon" :aria-label="`Delete ${row.company}`"
                      @click="askDelete(row.id)">
                <Icon name="trash" :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!rows.length" class="empty-state">
        <div class="empty-state-icon"><Icon name="receipt" :size="22" /></div>
        <p class="empty-state-title">No invoices yet</p>
        <p class="empty-state-body">They appear here once a deal is won.</p>
      </div>
    </div>

    <!-- Never window.confirm: it cannot be styled, ignores the theme,
         and freezes the page. Dialog ships the focus trap and Escape. -->
    <Dialog
      :open="confirmOpen"
      mode="confirm"
      tone="danger"
      title="Delete this invoice?"
      description="This cannot be undone."
      confirm-label="Delete"
      :busy="deleting"
      @confirm="remove"
      @close="confirmOpen = false"
    />
  </div>
</template>
```

Every class used above is documented in [CLASSES.md](./CLASSES.md).

---

## 4. Per-tenant branding (optional)

```ts
import { useTheme } from '@iamsaeed/admin-ui'

const { setAccentHue, setSkin } = useTheme()

setSkin('teal')                  // one of the eight named skins
setAccentHue(tenant.brandHue)    // or any hue 0–360 from your database
```

No rebuild, no extra CSS, and contrast holds — lightness is fixed in the tokens and lightness is
what carries contrast, so a brand colour cannot silently produce an unreadable button.

---

## What to do next

- Skim [CLASSES.md](./CLASSES.md) once. It is the API you will use most, and it has a list of
  plausible-but-wrong class names worth knowing before you guess one.
- Browse the 37 ready-made screens in [COMPONENTS.md → Views](./COMPONENTS.md#views) — copy one
  and swap its data source rather than starting a screen from blank.
- Run the style guide (`npm run dev` in this repo, port 5200) to see every component in every
  theme, skin, density and radius.

---

## Five mistakes that cost the most time

1. **Guessing a class name.** `.card-header` and `.btn-outline` do not exist. Check
   [CLASSES.md](./CLASSES.md) — a wrong name fails silently, with no error and no style.
2. **Shrinking an input below 16px on phones.** iOS Safari zooms on focus and strands the user
   mid-form. The stylesheet already steps down to 13px from 640px; leave it alone.
3. **Hand-rolling a modal with `aria-modal="true"` and no focus trap.** The attribute promises
   assistive tech the page behind is inert; without a trap, Tab walks a screen-reader user into
   content they cannot see. Use `Dialog`.
4. **Using `.data-table-stack` without the explicit ARIA roles.** The re-flow strips the table's
   implicit roles in every major browser.
5. **Writing a raw colour.** No hex, no `rgb()`, no `oklch()` literal beside these classes. Every
   colour comes from a token — that is the whole reason a skin is a one-line change.
