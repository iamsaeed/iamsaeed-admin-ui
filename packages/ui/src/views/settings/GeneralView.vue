<script setup lang="ts">
import SettingsLayout from './SettingsLayout.vue'
const emit = defineEmits<{ navigate: [id: string] }>()
</script>

<template>
  <SettingsLayout active="settings.general" title="General" subtitle="Name, URL and defaults."
                  @navigate="emit('navigate', $event)">
    <div class="card card-p flex flex-col !items-stretch gap-4 mb-4">
      <div class="form-group">
        <label class="form-label" for="ws-name">Workspace name</label>
        <input id="ws-name" class="form-input" value="Lumen Studio" />
      </div>
      <div class="form-group">
        <label class="form-label" for="ws-url">Public URL</label>
        <input id="ws-url" class="form-input" value="lumen.studio" />
        <p class="form-hint">Used for canonical links and share previews.</p>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label" for="ws-tz">Timezone</label>
          <select id="ws-tz" class="form-select"><option>Asia/Kolkata</option><option>UTC</option><option>America/New_York</option></select>
        </div>
        <div class="form-group">
          <label class="form-label" for="ws-lang">Default language</label>
          <select id="ws-lang" class="form-select"><option>English</option><option>Hindi</option><option>Arabic</option></select>
        </div>
      </div>
    </div>

    <div class="card card-p flex flex-col !items-stretch gap-3 mb-4">
      <div class="card-title">Danger zone</div>
      <div class="alert alert-danger">
        <div class="flex-1">
          <div class="font-medium">Delete this workspace</div>
          <div class="text-xs mt-0.5">All content, media and members are removed permanently.</div>
        </div>
      </div>
      <button class="btn btn-danger self-start">Delete workspace</button>
    </div>

    <div class="flex gap-2 justify-end">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Save changes</button>
    </div>
  </SettingsLayout>
</template>
