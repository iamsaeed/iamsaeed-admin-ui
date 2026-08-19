<script setup lang="ts">
import MediaGridView from './MediaGridView.vue'
import { DOCUMENTS } from './demo-data'
</script>

<template>
  <MediaGridView title="Documents" subtitle="PDFs, spreadsheets and archives." kind="document" :items="DOCUMENTS" />
</template>
