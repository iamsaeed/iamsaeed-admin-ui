<script setup lang="ts">
import ContentListView from './ContentListView.vue'
import { ARCHIVE } from './demo-data'
</script>

<template>
  <ContentListView
    title="Archive"
    subtitle="Retired content, kept for reference."
    create-label="New post"
    :rows="ARCHIVE"
  />
</template>
