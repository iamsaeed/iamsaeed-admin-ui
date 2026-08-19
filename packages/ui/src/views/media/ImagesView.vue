<script setup lang="ts">
import MediaGridView from './MediaGridView.vue'
import { IMAGES } from './demo-data'
</script>

<template>
  <MediaGridView title="Images" subtitle="Photography and graphics." kind="image" :items="IMAGES" />
</template>
