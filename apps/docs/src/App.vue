<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AdminLayout, TweaksPanel, useSidebar } from '@iamsaeed/admin-ui'
import { BOTTOM_NAV, DOCS_NAV, NOTIFICATIONS } from './data/nav'

const router = useRouter()
const route = useRoute()
const { setOpenGroup } = useSidebar()

const tweaksOpen = ref(false)

/** Auth screens render standalone — they are their own full-page layout. */
const isBare = computed(() => route.meta.bare === true)

const activeId = computed(() => (route.name as string) ?? '')

const title = computed(() => {
  for (const section of DOCS_NAV) {
    for (const item of section.items) {
      if (item.id === activeId.value) return item.label
      const child = item.children?.find((c) => c.id === activeId.value)
      if (child) return child.label
    }
  }
  return 'Admin UI'
})

/* Keep the sidebar group containing the current route expanded, so a deep
   link doesn't land the user on a page whose nav parent is collapsed. */
watch(
  activeId,
  (id) => {
    const parent = DOCS_NAV.flatMap((s) => s.items).find((i) =>
      i.children?.some((c) => c.id === id),
    )
    if (parent) setOpenGroup(parent.id)
  },
  { immediate: true },
)

function onNavigate(id: string) {
  if (router.hasRoute(id)) router.push({ name: id })
}
</script>

<template>
  <!-- Auth screens: no shell -->
  <RouterView v-if="isBare" @navigate="onNavigate" />

  <template v-else>
    <AdminLayout
      :nav="DOCS_NAV"
      :bottom-nav="BOTTOM_NAV"
      :active-id="activeId"
      :title="title"
      product-name="Admin UI"
      product-tag="Style guide"
      version="v0.1.0"
      user-name="Ahmad"
      user-email="ahmad@codewithus.com"
      :notifications="NOTIFICATIONS"
      @navigate="onNavigate"
      @open-tweaks="tweaksOpen = true"
    >
      <RouterView @navigate="onNavigate" />
    </AdminLayout>

    <TweaksPanel :open="tweaksOpen" @close="tweaksOpen = false" />
  </template>
</template>
