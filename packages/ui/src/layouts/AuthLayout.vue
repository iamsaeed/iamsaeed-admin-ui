<script setup lang="ts">
/**
 * Split auth shell.
 *
 * Mobile-first: the phone gets the form alone, full-bleed — the decorative
 * art panel is the first thing to go, because on a 390px screen it would
 * push the actual task below the fold. It returns from `lg`.
 */
import Icon from '../components/ui/Icon.vue'

withDefaults(
  defineProps<{
    productName?: string
    productTag?: string
    /** Marketing copy for the art panel; desktop only. */
    headline?: string
    subline?: string
  }>(),
  { productName: 'Lumen', productTag: 'Admin' },
)
</script>

<template>
  <div class="min-h-dvh bg-bg text-fg lg:grid lg:grid-cols-2">
    <!-- Form column. This is the <main> landmark: the art column beside it is
         aria-hidden, so without this every auth page has no landmark at all
         and screen-reader users get no skip target. -->
    <main class="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
      <div class="w-full max-w-sm mx-auto">
        <div class="flex items-center gap-3 mb-8">
          <!-- Slot so a consuming product can render its own logo here. The
               default keeps the generic glyph, so a consumer that passes
               nothing is unchanged. -->
          <slot name="brand">
            <div
              class="grid place-items-center w-9 h-9 rounded-sm bg-accent text-on-accent"
              aria-hidden="true"
            >
              <Icon name="layers" :size="18" />
            </div>
          </slot>
          <div>
            <div class="font-display font-semibold leading-tight">{{ productName }}</div>
            <div class="text-[0.6875rem] text-subtle">{{ productTag }}</div>
          </div>
        </div>

        <slot />
      </div>
    </main>

    <!-- Art column — desktop only, and purely decorative. -->
    <div
      class="hidden lg:flex relative flex-col justify-end overflow-hidden bg-accent-soft p-16"
      aria-hidden="true"
    >
      <div
        class="absolute -top-24 -right-24 w-96 h-96 rounded-pill bg-accent opacity-20 blur-3xl"
      />
      <div
        class="absolute top-1/3 -left-16 w-72 h-72 rounded-pill bg-accent-hover opacity-15 blur-3xl"
      />
      <div class="relative">
        <p class="font-display text-3xl font-semibold tracking-tight text-fg text-balance">
          {{ headline || 'Everything your team publishes, in one place.' }}
        </p>
        <p class="mt-3 text-muted max-w-md">
          {{ subline || 'Drafts, reviews, scheduling and analytics — without the spreadsheet.' }}
        </p>
      </div>
    </div>
  </div>
</template>
