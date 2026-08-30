<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuth } from './composables/useAuth.js'

const { currentUserId, selectGroup } = useAuth()

const groups = ref([])
const current = ref(null)
const members = ref([])

const error = ref(null)
const membersError = ref(null)
const switchingId = ref(null)

const editName = ref('')
const savingName = ref(false)
const nameError = ref(null)

const inviteUsername = ref('')
const inviting = ref(false)
const inviteError = ref(null)
const inviteSuccess = ref(null)

const memberActionError = ref(null)
const memberActionUserId = ref(null)

const otherGroups = computed(() => groups.value.filter(g => g.id !== current.value?.id))

onMounted(async () => {
  await Promise.all([fetchGroups(), fetchCurrentAndMembers()])
})

async function fetchGroups() {
  try {
    const response = await axios.get('/cloud-user-registry/v0/groups')
    groups.value = response.data ?? []
    error.value = null
  } catch (err) {
    error.value = err
  }
}

async function fetchCurrentAndMembers() {
  try {
    const response = await axios.get('/cloud-user-registry/v0/groups/current')
    current.value = response.data
    editName.value = response.data.name
    error.value = null
  } catch (err) {
    error.value = err
    current.value = null
    return
  }
  await fetchMembers()
}

async function fetchMembers() {
  try {
    const response = await axios.get('/cloud-user-registry/v0/groups/current/members')
    members.value = response.data ?? []
    membersError.value = null
  } catch (err) {
    membersError.value = err
  }
}

async function switchGroup(groupId) {
  if (current.value && groupId === current.value.id) return
  switchingId.value = groupId
  try {
    await selectGroup(groupId)
    await Promise.all([fetchGroups(), fetchCurrentAndMembers()])
  } catch (err) {
    error.value = err
  } finally {
    switchingId.value = null
  }
}

async function saveName() {
  if (!current.value || editName.value === current.value.name) return
  savingName.value = true
  nameError.value = null
  try {
    const response = await axios.patch('/cloud-user-registry/v0/groups/current', { name: editName.value })
    current.value = response.data
    editName.value = response.data.name
    await fetchGroups()
  } catch (err) {
    nameError.value = err.response?.data?.detail ?? err.message
  } finally {
    savingName.value = false
  }
}

async function sendInvite() {
  if (!inviteUsername.value) return
  inviting.value = true
  inviteError.value = null
  inviteSuccess.value = null
  try {
    await axios.post('/cloud-user-registry/v0/groups/current/invitations', { username: inviteUsername.value })
    inviteSuccess.value = `Invitation sent to ${inviteUsername.value}.`
    inviteUsername.value = ''
  } catch (err) {
    if (err.response?.status === 404) {
      inviteError.value = 'No user with that username exists.'
    } else if (err.response?.status === 409) {
      inviteError.value = 'That user is already a member, or already has a pending invitation.'
    } else {
      inviteError.value = err.response?.data?.detail ?? err.message
    }
  } finally {
    inviting.value = false
  }
}

async function toggleAdmin(member) {
  memberActionUserId.value = member.userId
  memberActionError.value = null
  try {
    await axios.put(`/cloud-user-registry/v0/groups/current/members/${member.userId}/admin`, { admin: !member.admin })
    await fetchMembers()
  } catch (err) {
    memberActionError.value = err.response?.data?.detail ?? err.message
  } finally {
    memberActionUserId.value = null
  }
}

async function removeMember(member) {
  const isSelf = member.userId === currentUserId.value
  if (isSelf && otherGroups.value.length === 0) {
    memberActionError.value = "You can't leave your only group."
    return
  }
  if (!confirm(isSelf ? `Leave "${current.value.name}"?` : `Remove ${member.username} from this group?`)) return

  memberActionUserId.value = member.userId
  memberActionError.value = null
  try {
    await axios.delete(`/cloud-user-registry/v0/groups/current/members/${member.userId}`)
    if (isSelf) {
      // Can't stay "in" a group we just left - hop to another one we belong to.
      await switchGroup(otherGroups.value[0].id)
    } else {
      await fetchMembers()
    }
  } catch (err) {
    memberActionError.value = err.response?.data?.detail ?? err.message
  } finally {
    memberActionUserId.value = null
  }
}
</script>

<template>
  <div class="groups-page">
    <h1>Groups</h1>
    <div v-if="error" class="error">Error: {{ error.message }}</div>

    <section class="panel">
      <h2>My groups</h2>
      <ul class="group-switcher">
        <li v-for="g in groups" :key="g.id" :class="{ current: current && g.id === current.id }">
          <span class="group-switcher-name">{{ g.name }}</span>
          <span v-if="g.owner" class="badge badge-owner">Owner</span>
          <span v-else-if="g.admin" class="badge badge-admin">Admin</span>
          <button
            v-if="!current || g.id !== current.id"
            class="btn-switch"
            :disabled="switchingId === g.id"
            @click="switchGroup(g.id)"
          >
            {{ switchingId === g.id ? 'Switching…' : 'Switch to' }}
          </button>
          <span v-else class="current-label">Current</span>
        </li>
      </ul>
    </section>

    <section v-if="current" class="panel">
      <h2>Current group</h2>
      <div class="name-row">
        <input v-model="editName" class="name-input" :disabled="!current.admin || savingName" />
        <button
          v-if="current.admin"
          class="btn-save"
          :disabled="savingName || editName === current.name || !editName"
          @click="saveName"
        >
          {{ savingName ? 'Saving…' : 'Save' }}
        </button>
      </div>
      <div v-if="nameError" class="error">{{ nameError }}</div>

      <h3>Members</h3>
      <div v-if="membersError" class="error">Error: {{ membersError.message }}</div>
      <div v-if="memberActionError" class="error">{{ memberActionError }}</div>
      <table class="members-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.userId">
            <td>
              {{ member.username }}
              <span v-if="member.userId === currentUserId" class="badge-you">YOU</span>
            </td>
            <td>{{ [member.name, member.surname].filter(Boolean).join(' ') || '—' }}</td>
            <td>
              <span v-if="member.owner" class="badge badge-owner">Owner</span>
              <span v-else-if="member.admin" class="badge badge-admin">Admin</span>
              <span v-else class="badge badge-member">Member</span>
            </td>
            <td class="member-actions">
              <button
                v-if="current.admin && !member.owner"
                class="btn-toggle-admin"
                :disabled="memberActionUserId === member.userId"
                @click="toggleAdmin(member)"
              >
                {{ member.admin ? 'Revoke admin' : 'Make admin' }}
              </button>
              <button
                v-if="!member.owner && (current.admin || member.userId === currentUserId)"
                class="btn-remove"
                :disabled="memberActionUserId === member.userId"
                @click="removeMember(member)"
              >
                {{ member.userId === currentUserId ? 'Leave' : 'Remove' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <template v-if="current.admin">
        <h3>Invite a member</h3>
        <div class="invite-row">
          <input
            v-model="inviteUsername"
            class="invite-input"
            type="text"
            placeholder="Username"
            :disabled="inviting"
            @keyup.enter="sendInvite"
          />
          <button class="btn-invite" :disabled="inviting || !inviteUsername" @click="sendInvite">
            {{ inviting ? 'Sending…' : 'Invite' }}
          </button>
        </div>
        <div v-if="inviteError" class="error">{{ inviteError }}</div>
        <div v-if="inviteSuccess" class="success">{{ inviteSuccess }}</div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.groups-page {
  width: 100%;
  max-width: 760px;
}
.panel {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}
.panel h2 {
  margin-top: 0;
}
.group-switcher {
  list-style: none;
  padding: 0;
  margin: 0;
}
.group-switcher li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid #eee;
}
.group-switcher li:last-child { border-bottom: none; }
.group-switcher li.current { background: #f0f9f5; }
.group-switcher-name {
  flex: 1;
  font-weight: 500;
}
.current-label {
  font-size: 0.8rem;
  color: #369b6f;
  font-weight: 600;
}
.badge {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}
.badge-owner { background: #fff3cd; color: #856404; }
.badge-admin { background: #cfe2ff; color: #1565c0; }
.badge-member { background: #eee; color: #555; }
.badge-you {
  margin-left: 0.4rem;
  padding: 0.1rem 0.4rem;
  background: #1565c0;
  color: #fff;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: bold;
}
.btn-switch, .btn-save, .btn-invite {
  padding: 0.35rem 0.75rem;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-switch:hover:not(:disabled), .btn-save:hover:not(:disabled), .btn-invite:hover:not(:disabled) {
  background: #369b6f;
}
.btn-switch:disabled, .btn-save:disabled, .btn-invite:disabled {
  opacity: 0.6;
  cursor: default;
}
.name-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.name-input, .invite-input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
}
.name-input:disabled { background: #f5f5f5; }
.invite-row {
  display: flex;
  gap: 0.5rem;
}
.members-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.25rem;
}
.members-table th {
  text-align: left;
  font-size: 0.8rem;
  color: #888;
  padding: 0.4rem 0.5rem;
  border-bottom: 2px solid #eee;
}
.members-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}
.member-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.btn-toggle-admin {
  padding: 0.25rem 0.6rem;
  background: #fff;
  color: #1565c0;
  border: 1px solid #1565c0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-toggle-admin:hover:not(:disabled) { background: #1565c0; color: #fff; }
.btn-remove {
  padding: 0.25rem 0.6rem;
  background: #fff;
  color: #c62828;
  border: 1px solid #c62828;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-remove:hover:not(:disabled) { background: #c62828; color: #fff; }
.btn-toggle-admin:disabled, .btn-remove:disabled { opacity: 0.5; cursor: default; }
.error {
  color: #c62828;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}
.success {
  color: #1b5e20;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}
</style>
