<script setup lang="ts">
import MediaGridView from './MediaGridView.vue'
import { VIDEOS } from './demo-data'
</script>

<template>
  <MediaGridView title="Videos" subtitle="Uploaded and embedded video." kind="video" :items="VIDEOS" />
</template>
