<script setup lang="ts">
import ContentListView from './ContentListView.vue'
import { DRAFTS } from './demo-data'
</script>

<template>
  <ContentListView
    title="Drafts"
    subtitle="Work in progress — not visible to readers."
    create-label="New draft"
    :rows="DRAFTS"
  />
</template>
