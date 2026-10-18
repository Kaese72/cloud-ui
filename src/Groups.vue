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
  <div class="page enter">
    <h1 class="page-title">Groups</h1>
    <p class="page-lede">
      You're always in one group at a time. Members, invitations and Appliances on these pages
      belong to the current one.
    </p>
    <div v-if="error" class="alert alert-error">Error: {{ error.message }}</div>

    <section class="panel">
      <h2 class="panel-title">My groups</h2>
      <ul class="rows">
        <li v-for="g in groups" :key="g.id" class="row" :class="{ 'is-current': current && g.id === current.id }">
          <div class="row-main">
            <p class="row-title">
              {{ g.name }}
              <span v-if="g.owner" class="badge badge-owner">Owner</span>
              <span v-else-if="g.admin" class="badge badge-admin">Admin</span>
            </p>
          </div>
          <div class="row-actions">
            <button
              v-if="!current || g.id !== current.id"
              class="btn btn-ghost btn-sm"
              :disabled="switchingId === g.id"
              @click="switchGroup(g.id)"
            >
              {{ switchingId === g.id ? 'Switching…' : 'Switch to' }}
            </button>
            <span v-else class="current-label">● Current</span>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="current" class="panel">
      <h2 class="panel-title">Current group</h2>
      <div class="field">
        <label for="group-name">Name</label>
        <div class="inline-form">
          <input id="group-name" v-model="editName" class="input" :disabled="!current.admin || savingName" />
          <button
            v-if="current.admin"
            class="btn btn-primary"
            :disabled="savingName || editName === current.name || !editName"
            @click="saveName"
          >
            {{ savingName ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
      <div v-if="nameError" class="alert alert-error">{{ nameError }}</div>

      <h3 class="panel-subtitle">Members</h3>
      <div v-if="membersError" class="alert alert-error">Error: {{ membersError.message }}</div>
      <div v-if="memberActionError" class="alert alert-error">{{ memberActionError }}</div>
      <div class="table-scroll">
        <table class="table">
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
                <span v-if="member.userId === currentUserId" class="badge badge-neutral">You</span>
              </td>
              <td>{{ [member.name, member.surname].filter(Boolean).join(' ') || '—' }}</td>
              <td>
                <span v-if="member.owner" class="badge badge-owner">Owner</span>
                <span v-else-if="member.admin" class="badge badge-admin">Admin</span>
                <span v-else class="badge badge-member">Member</span>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    v-if="current.admin && !member.owner"
                    class="btn btn-ghost btn-sm"
                    :disabled="memberActionUserId === member.userId"
                    @click="toggleAdmin(member)"
                  >
                    {{ member.admin ? 'Revoke admin' : 'Make admin' }}
                  </button>
                  <button
                    v-if="!member.owner && (current.admin || member.userId === currentUserId)"
                    class="btn btn-danger btn-sm"
                    :disabled="memberActionUserId === member.userId"
                    @click="removeMember(member)"
                  >
                    {{ member.userId === currentUserId ? 'Leave' : 'Remove' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template v-if="current.admin">
        <h3 class="panel-subtitle">Invite a member</h3>
        <div class="inline-form">
          <input
            v-model="inviteUsername"
            class="input"
            type="text"
            placeholder="Username"
            aria-label="Username to invite"
            :disabled="inviting"
            @keyup.enter="sendInvite"
          />
          <button class="btn btn-primary" :disabled="inviting || !inviteUsername" @click="sendInvite">
            {{ inviting ? 'Sending…' : 'Invite' }}
          </button>
        </div>
        <div v-if="inviteError" class="alert alert-error">{{ inviteError }}</div>
        <div v-if="inviteSuccess" class="alert alert-success">{{ inviteSuccess }}</div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.row-title .badge {
  margin-left: 8px;
}
.current-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--green-ink);
}
td .badge {
  margin-left: 6px;
}
td:nth-child(3) .badge {
  margin-left: 0;
}
</style>
