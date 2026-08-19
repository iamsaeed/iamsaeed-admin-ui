<script setup lang="ts">
import ContentListView from './ContentListView.vue'
import { POSTS } from './demo-data'
</script>

<template>
  <ContentListView
    title="Posts"
    subtitle="Everything your team has written."
    create-label="New post"
    :rows="POSTS"
  />
</template>
