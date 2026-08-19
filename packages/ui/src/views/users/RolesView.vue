<script setup lang="ts">
import Icon from '../../components/ui/Icon.vue'

const roles = [
  { name: 'Owner', people: 1, desc: 'Full access, including billing and deletion.', locked: true },
  { name: 'Admin', people: 2, desc: 'Everything except billing and workspace deletion.' },
  { name: 'Editor', people: 6, desc: 'Create, edit and publish any content.' },
  { name: 'Author', people: 11, desc: 'Create and edit their own content; cannot publish.' },
  { name: 'Viewer', people: 4, desc: 'Read-only access to published content.' },
]

const perms = ['Create content', 'Publish content', 'Manage media', 'Invite people', 'Manage billing']
const matrix: Record<string, boolean[]> = {
  Owner: [true, true, true, true, true],
  Admin: [true, true, true, true, false],
  Editor: [true, true, true, false, false],
  Author: [true, false, true, false, false],
  Viewer: [false, false, false, false, false],
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Roles &amp; permissions</h1>
      <p class="page-sub">What each role can do. Owner is fixed and cannot be edited.</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary"><Icon name="plus" :size="15" /> New role</button>
    </div>
  </div>

  <div class="grid-auto mb-6">
    <div v-for="r in roles" :key="r.name" class="card card-p">
      <div class="flex items-start justify-between mb-2">
        <div class="card-title">{{ r.name }}</div>
        <span v-if="r.locked" class="badge badge-neutral"><Icon name="lock" :size="11" /> Fixed</span>
      </div>
      <p class="text-xs text-muted mb-3">{{ r.desc }}</p>
      <div class="flex items-center justify-between">
        <span class="text-[0.6875rem] text-subtle">{{ r.people }} {{ r.people === 1 ? 'person' : 'people' }}</span>
        <button class="btn btn-ghost btn-sm" :disabled="r.locked">Edit</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd"><div class="card-title">Permission matrix</div></div>
    <div class="table-wrap">
      <table class="data-table" role="table">
        <thead>
          <tr role="row"><th role="columnheader">Permission</th><th role="columnheader" v-for="r in roles" :key="r.name" class="text-center">{{ r.name }}</th></tr>
        </thead>
        <tbody>
          <tr role="row" v-for="(p, i) in perms" :key="p">
            <td role="cell" class="font-medium">{{ p }}</td>
            <td role="cell" v-for="r in roles" :key="r.name" class="text-center">
              <Icon
                :name="matrix[r.name]![i] ? 'check-circle' : 'x'"
                :size="15"
                :class="matrix[r.name]![i] ? 'text-success mx-auto' : 'text-subtle mx-auto'"
                :label="matrix[r.name]![i] ? 'Allowed' : 'Denied'"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
