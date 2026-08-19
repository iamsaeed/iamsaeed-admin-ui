<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../../components/ui/Icon.vue'

const query = ref('')
const users = [
  { id: 1, name: 'Elena Marsh', email: 'elena@lumen.studio', role: 'Owner', status: 'Active', seen: 'now' },
  { id: 2, name: 'Marcus Tan', email: 'marcus@lumen.studio', role: 'Editor', status: 'Active', seen: '2h ago' },
  { id: 3, name: 'Priya Nair', email: 'priya@lumen.studio', role: 'Editor', status: 'Active', seen: '1d ago' },
  { id: 4, name: 'Sam Rodriguez', email: 'sam@lumen.studio', role: 'Author', status: 'Invited', seen: '—' },
  { id: 5, name: 'Jo Okafor', email: 'jo@lumen.studio', role: 'Viewer', status: 'Suspended', seen: '3w ago' },
]
const badgeFor = (s: string) =>
  ({ Active: 'badge-success', Invited: 'badge-info', Suspended: 'badge-danger' })[s] ?? 'badge-neutral'
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">All users</h1>
      <p class="page-sub">Everyone with access to this workspace.</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary"><Icon name="download" :size="15" /> Export</button>
      <button class="btn btn-primary"><Icon name="plus" :size="15" /> Invite people</button>
    </div>
  </div>

  <div class="toolbar">
    <div class="input-group flex-1 min-w-52">
      <span class="input-group-icon"><Icon name="search" :size="15" /></span>
      <input v-model="query" class="form-input" placeholder="Search people…" />
    </div>
    <select class="form-select w-auto"><option>All roles</option><option>Owner</option><option>Editor</option></select>
  </div>

  <div class="card">
    <div class="table-wrap">
      <table class="data-table data-table-stack" role="table">
        <thead>
          <tr role="row"><th role="columnheader">Person</th><th role="columnheader">Role</th><th role="columnheader">Status</th><th role="columnheader">Last seen</th><th role="columnheader" class="w-10"><span class="sr-only">Actions</span></th></tr>
        </thead>
        <tbody>
          <tr role="row" v-for="u in users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))" :key="u.id">
            <td role="cell" data-label="Person">
              <span class="flex items-center gap-3">
                <span class="avatar">{{ u.name.split(' ').map(n => n[0]).join('') }}</span>
                <span class="min-w-0">
                  <span class="block font-medium truncate">{{ u.name }}</span>
                  <span class="block text-[0.6875rem] text-subtle truncate">{{ u.email }}</span>
                </span>
              </span>
            </td>
            <td role="cell" data-label="Role"><span class="badge badge-neutral">{{ u.role }}</span></td>
            <td role="cell" data-label="Status"><span class="badge" :class="badgeFor(u.status)">{{ u.status }}</span></td>
            <td role="cell" data-label="Last seen" class="text-muted">{{ u.seen }}</td>
            <td role="cell" data-label=""><button class="btn btn-ghost btn-icon btn-sm"><Icon name="more" label="Actions" /></button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
