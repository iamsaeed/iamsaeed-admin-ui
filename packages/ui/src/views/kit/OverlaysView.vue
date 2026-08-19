<script setup lang="ts">
import { ref } from 'vue'
import KitBlock from '../../components/kit/KitBlock.vue'
import Icon from '../../components/ui/Icon.vue'

const modal = ref(false)
const sheet = ref(false)
const menuOpen = ref(false)
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Overlays</h1>
      <p class="page-sub">
        Every overlay sits above the scrim by token (<code class="font-mono">--lm-z-*</code>), so nothing
        needs a hand-picked z-index.
      </p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Dialog">
      <button class="btn btn-primary" @click="modal = true">Open dialog</button>
      <button class="btn btn-secondary" @click="sheet = true">Open confirm</button>
    </KitBlock>

    <KitBlock label="Dropdown menu">
      <div class="relative">
        <button class="btn btn-secondary" @click="menuOpen = !menuOpen">
          Actions <Icon name="chevron-down" :size="14" />
        </button>
        <div v-if="menuOpen" class="menu absolute left-0 top-full mt-1 z-(--lm-z-sticky)">
          <button class="menu-item"><Icon name="edit" :size="15" /> Edit</button>
          <button class="menu-item"><Icon name="copy" :size="15" /> Duplicate</button>
          <div class="menu-sep" />
          <button class="menu-item menu-item-danger"><Icon name="trash" :size="15" /> Delete</button>
        </div>
      </div>
    </KitBlock>

    <KitBlock label="Tooltip">
      <span class="tooltip">Publishes immediately</span>
      <span class="tooltip">⌘K to search</span>
    </KitBlock>

    <KitBlock label="Popover card">
      <div class="menu !w-72 !p-4">
        <div class="card-title mb-1">Keyboard shortcuts</div>
        <p class="text-xs text-muted mb-3">The ones worth learning first.</p>
        <dl class="flex flex-col gap-1.5 text-xs">
          <div class="flex justify-between"><dt class="text-muted">Search</dt><dd><kbd class="badge badge-neutral font-mono">⌘K</kbd></dd></div>
          <div class="flex justify-between"><dt class="text-muted">New post</dt><dd><kbd class="badge badge-neutral font-mono">N</kbd></dd></div>
          <div class="flex justify-between"><dt class="text-muted">Toggle theme</dt><dd><kbd class="badge badge-neutral font-mono">⌘J</kbd></dd></div>
        </dl>
      </div>
    </KitBlock>
  </div>

  <Teleport to="body">
    <div v-if="modal" class="scrim" @click="modal = false" />
    <div v-if="modal" class="modal" role="dialog" aria-modal="true" aria-label="Invite people">
      <div class="modal-handle" />
      <div class="modal-hd"><div class="card-title">Invite people</div><div class="card-sub">They'll get an email with a join link.</div></div>
      <div class="modal-body flex flex-col gap-4">
        <div class="form-group">
          <label class="form-label" for="ov-email">Email addresses</label>
          <textarea id="ov-email" class="form-textarea" placeholder="one@example.com, two@example.com" />
        </div>
        <div class="form-group">
          <label class="form-label" for="ov-role">Role</label>
          <select id="ov-role" class="form-select"><option>Editor</option><option>Author</option><option>Viewer</option></select>
        </div>
      </div>
      <div class="modal-ft">
        <button class="btn btn-secondary" @click="modal = false">Cancel</button>
        <button class="btn btn-primary" @click="modal = false">Send invites</button>
      </div>
    </div>

    <div v-if="sheet" class="scrim" @click="sheet = false" />
    <div v-if="sheet" class="modal" role="alertdialog" aria-modal="true" aria-label="Discard changes">
      <div class="modal-handle" />
      <div class="modal-hd"><div class="card-title">Discard changes?</div></div>
      <div class="modal-body"><p class="text-muted">Your edits since the last save will be lost.</p></div>
      <div class="modal-ft">
        <button class="btn btn-secondary" @click="sheet = false">Keep editing</button>
        <button class="btn btn-danger" @click="sheet = false">Discard</button>
      </div>
    </div>
  </Teleport>
</template>
