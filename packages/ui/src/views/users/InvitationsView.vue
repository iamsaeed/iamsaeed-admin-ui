<script setup lang="ts">
import Icon from '../../components/ui/Icon.vue'

const invites = [
  { id: 1, email: 'dana@acme.co', role: 'Editor', sent: '2 days ago', status: 'Pending' },
  { id: 2, email: 'ruth@acme.co', role: 'Author', sent: '5 days ago', status: 'Pending' },
  { id: 3, email: 'kofi@acme.co', role: 'Viewer', sent: '3 weeks ago', status: 'Expired' },
]
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Invitations</h1>
      <p class="page-sub">People who have been invited but haven't joined yet.</p>
    </div>
    <div class="page-actions"><button class="btn btn-primary"><Icon name="send" :size="15" /> Invite</button></div>
  </div>

  <div class="card card-p mb-6">
    <form class="form-row form-row-2 w-full items-end">
      <div class="form-group">
        <label class="form-label" for="inv-email">Email address</label>
        <input id="inv-email" class="form-input" type="email" placeholder="name@company.com" />
      </div>
      <div class="flex gap-2">
        <div class="form-group flex-1">
          <label class="form-label" for="inv-role">Role</label>
          <select id="inv-role" class="form-select"><option>Editor</option><option>Author</option><option>Viewer</option></select>
        </div>
        <button class="btn btn-primary self-end">Send</button>
      </div>
    </form>
  </div>

  <div class="card">
    <div class="table-wrap">
      <table class="data-table data-table-stack" role="table">
        <thead><tr role="row"><th role="columnheader">Email</th><th role="columnheader">Role</th><th role="columnheader">Sent</th><th role="columnheader">Status</th><th role="columnheader" class="w-10"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          <tr role="row" v-for="i in invites" :key="i.id">
            <td role="cell" data-label="Email" class="font-medium">{{ i.email }}</td>
            <td role="cell" data-label="Role"><span class="badge badge-neutral">{{ i.role }}</span></td>
            <td role="cell" data-label="Sent" class="text-muted">{{ i.sent }}</td>
            <td role="cell" data-label="Status">
              <span class="badge" :class="i.status === 'Pending' ? 'badge-warn' : 'badge-danger'">{{ i.status }}</span>
            </td>
            <td role="cell" data-label="">
              <span class="flex gap-1">
                <button class="btn btn-ghost btn-sm">Resend</button>
                <button class="btn btn-ghost btn-icon btn-sm"><Icon name="x" :size="14" label="Revoke" /></button>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
