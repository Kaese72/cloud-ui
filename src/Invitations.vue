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
  <div class="page page-narrow enter">
    <h1 class="page-title">Invitations</h1>
    <p class="page-lede">Groups that have invited you to join them.</p>
    <div v-if="error" class="alert alert-error">Error: {{ error.message }}</div>
    <div v-if="actionError" class="alert alert-error">{{ actionError }}</div>

    <section class="panel">
      <p v-if="invitations.length === 0 && !error" class="empty">No pending invitations.</p>
      <ul v-else class="rows">
        <li v-for="invitation in invitations" :key="invitation.id" class="row">
          <div class="row-main">
            <p class="row-title">{{ invitation.groupName }}</p>
            <p class="row-meta">Invited by {{ invitation.invitedByUsername }}</p>
          </div>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" :disabled="actionId === invitation.id" @click="accept(invitation)">
              Accept
            </button>
            <button class="btn btn-danger btn-sm" :disabled="actionId === invitation.id" @click="decline(invitation)">
              Decline
            </button>
          </div>
        </li>
      </ul>
    </section>

    <p class="hint">
      Accepting joins the group but doesn't switch you into it. Use
      <router-link to="/groups">Groups</router-link> to switch over.
    </p>
  </div>
</template>
