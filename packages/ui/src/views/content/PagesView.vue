<script setup lang="ts">
import ContentListView from './ContentListView.vue'
import { PAGES } from './demo-data'
</script>

<template>
  <ContentListView
    title="Pages"
    subtitle="Standalone pages outside the blog."
    create-label="New page"
    :rows="PAGES"
  />
</template>
