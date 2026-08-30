<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const invitations = ref([])
const error = ref(null)
const actionError = ref(null)
const actionId = ref(null)

onMounted(fetchInvitations)

async function fetchInvitations() {
  try {
    const response = await axios.get('/cloud-user-registry/v0/invitations')
    invitations.value = response.data ?? []
    error.value = null
  } catch (err) {
    error.value = err
  }
}

async function accept(invitation) {
  actionId.value = invitation.id
  actionError.value = null
  try {
    await axios.post(`/cloud-user-registry/v0/invitations/${invitation.id}/accept`)
    await fetchInvitations()
  } catch (err) {
    actionError.value = err.response?.data?.detail ?? err.message
  } finally {
    actionId.value = null
  }
}

async function decline(invitation) {
  actionId.value = invitation.id
  actionError.value = null
  try {
    await axios.post(`/cloud-user-registry/v0/invitations/${invitation.id}/decline`)
    await fetchInvitations()
  } catch (err) {
    actionError.value = err.response?.data?.detail ?? err.message
  } finally {
    actionId.value = null
  }
}
</script>

<template>
  <div class="invitations-page">
    <h1>Invitations</h1>
    <div v-if="error" class="error">Error: {{ error.message }}</div>
    <div v-if="actionError" class="error">{{ actionError }}</div>

    <div v-if="invitations.length === 0 && !error" class="empty">
      <p>No pending invitations.</p>
    </div>

    <ul v-else class="invitation-list">
      <li v-for="invitation in invitations" :key="invitation.id" class="invitation-card">
        <div class="invitation-info">
          <p class="group-name">{{ invitation.groupName }}</p>
          <p class="invited-by">Invited by {{ invitation.invitedByUsername }}</p>
        </div>
        <div class="invitation-actions">
          <button
            class="btn-accept"
            :disabled="actionId === invitation.id"
            @click="accept(invitation)"
          >
            Accept
          </button>
          <button
            class="btn-decline"
            :disabled="actionId === invitation.id"
            @click="decline(invitation)"
          >
            Decline
          </button>
        </div>
      </li>
    </ul>

    <p class="hint">
      Accepting joins the group, but doesn't switch you into it - use
      <router-link to="/groups">Groups</router-link> to switch over.
    </p>
  </div>
</template>

<style scoped>
.invitations-page {
  width: 100%;
  max-width: 640px;
}
.empty {
  color: #999;
  font-style: italic;
  padding: 1rem 0;
}
.invitation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.invitation-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
}
.group-name {
  margin: 0;
  font-weight: 600;
  color: #222e3a;
}
.invited-by {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  color: #888;
}
.invitation-actions {
  display: flex;
  gap: 0.5rem;
}
.btn-accept {
  padding: 0.4rem 0.9rem;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-accept:hover:not(:disabled) { background: #369b6f; }
.btn-decline {
  padding: 0.4rem 0.9rem;
  background: #fff;
  color: #c62828;
  border: 1px solid #c62828;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-decline:hover:not(:disabled) { background: #c62828; color: #fff; }
.btn-accept:disabled, .btn-decline:disabled { opacity: 0.6; cursor: default; }
.error {
  color: #c62828;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}
.hint {
  font-size: 0.85rem;
  color: #888;
  margin-top: 1.5rem;
}
</style>
