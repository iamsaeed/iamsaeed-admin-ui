<script setup lang="ts">
import { ref } from 'vue'
import KitBlock from '../../components/kit/KitBlock.vue'
import Dialog from '../../components/ui/Dialog.vue'
import Icon from '../../components/ui/Icon.vue'

/*
 * These were hand-rolled markup until `Dialog` existed — scrim, Teleport, handle, header, body and
 * footer written out once per dialog, and neither of them trapped focus or closed on Escape while
 * both claimed `aria-modal="true"`. They are the component now, which doubles as the proof that one
 * component covers a form, a destructive confirm, and a question.
 */
const form = ref(false)
const discard = ref(false)
const reason = ref(false)
const menuOpen = ref(false)

const lastAnswer = ref('')

function onReason(value: string) {
  lastAnswer.value = value
  reason.value = false
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Overlays</h1>
      <p class="page-sub">
        Every overlay sits above the scrim by token (<code class="font-mono">--lm-z-*</code>), so nothing
        needs a hand-picked z-index. <code class="font-mono">Dialog</code> brings the focus trap and the
        Escape handler with it, so no screen has to remember them.
      </p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Dialog">
      <button class="btn btn-primary" @click="form = true">Form</button>
      <button class="btn btn-secondary" @click="discard = true">Confirm</button>
      <button class="btn btn-secondary" @click="reason = true">Ask a question</button>
    </KitBlock>

    <KitBlock v-if="lastAnswer" label="Last answer">
      <p class="text-sm text-muted">{{ lastAnswer }}</p>
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

  <!-- A form: the content is the default slot, the footer is the component's. -->
  <Dialog
    :open="form"
    title="Invite people"
    description="They'll get an email with a join link."
    confirm-label="Send invites"
    @confirm="form = false"
    @close="form = false"
  >
    <div class="form-group">
      <label class="form-label" for="ov-email">Email addresses</label>
      <textarea id="ov-email" class="form-textarea" placeholder="one@example.com, two@example.com" />
    </div>
    <div class="form-group">
      <label class="form-label" for="ov-role">Role</label>
      <select id="ov-role" class="form-select"><option>Editor</option><option>Author</option><option>Viewer</option></select>
    </div>
  </Dialog>

  <!-- Destructive: announced as an alertdialog, and only the confirming button carries the weight. -->
  <Dialog
    :open="discard"
    mode="confirm"
    tone="danger"
    title="Discard changes?"
    cancel-label="Keep editing"
    confirm-label="Discard"
    @confirm="discard = false"
    @close="discard = false"
  >
    <p class="text-muted">Your edits since the last save will be lost.</p>
  </Dialog>

  <!-- A question, in place of window.prompt. -->
  <Dialog
    :open="reason"
    mode="prompt"
    title="Why are you signing in as them?"
    description="You will be signed in as them until you come back."
    label="Reason"
    hint="This is written to the activity log, with your name and the time."
    confirm-label="Sign in as them"
    :min-length="5"
    multiline
    @confirm="onReason"
    @close="reason = false"
  />
</template>
