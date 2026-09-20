<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useAuth } from './composables/useAuth.js'

// ApplianceLogin is a pass-through redirect step, not a page a user lingers
// on - see appliance-registry's README, "Cloud login" section. The user is
// already signed in to the cloud (the router guard sent them through /login
// first if not); this asks appliance-registry for a single-use login code for
// the appliance and immediately sends the browser back to the appliance's own
// UI with it. Only the appliance, presenting its own secret, can redeem that
// code, and appliance-registry only issues it to a member of the group that
// owns the appliance.
const route = useRoute()
const { currentGroupId, selectGroup } = useAuth()
const error = ref(null)

// The appliance's own UI is the only place a login code should ever be sent.
const CALLBACK_PATH = '/cloud-login/callback'

function loginCodeUrl(applianceId) {
  return `/appliance-registry/v0/appliances/${encodeURIComponent(applianceId)}/login-code`
}

// A user can belong to several groups but is only ever "in" one at a time, and
// appliance-registry only issues codes for the appliance's owning group. If
// the active group isn't the owner (404), try the user's other groups, then
// put their active group back where it was.
async function requestLoginCode(applianceId) {
  try {
    return (await axios.post(loginCodeUrl(applianceId))).data.code
  } catch (err) {
    if (err.response?.status !== 404) throw err
  }

  const originalGroupId = currentGroupId.value
  const groups = (await axios.get('/cloud-user-registry/v0/groups')).data ?? []
  let switched = false
  try {
    for (const group of groups) {
      if (group.id === originalGroupId) continue
      await selectGroup(group.id)
      switched = true
      try {
        return (await axios.post(loginCodeUrl(applianceId))).data.code
      } catch (err) {
        if (err.response?.status !== 404) throw err
      }
    }
  } finally {
    if (switched && originalGroupId) await selectGroup(originalGroupId)
  }
  const notFound = new Error('none of your groups owns this appliance')
  notFound.notFound = true
  throw notFound
}

onMounted(async () => {
  const { state, return_to: returnTo, applianceId } = route.query
  if (!state || !returnTo || !applianceId) {
    error.value = 'Missing login parameters. Restart the login from the appliance.'
    return
  }
  let target
  try {
    target = new URL(returnTo)
  } catch {
    error.value = 'Invalid return address. Restart the login from the appliance.'
    return
  }
  if (!['http:', 'https:'].includes(target.protocol) || target.pathname !== CALLBACK_PATH) {
    error.value = 'Invalid return address. Restart the login from the appliance.'
    return
  }

  try {
    const code = await requestLoginCode(applianceId)
    target.searchParams.set('code', code)
    target.searchParams.set('state', state)
    window.location.href = target.toString()
  } catch (err) {
    if (err.notFound || err.response?.status === 404) {
      error.value = "You don't have access to this appliance. Only members of the group that owns it can log in to it."
    } else if (err.response?.status === 409) {
      error.value = 'This appliance is not active, so it cannot be logged in to.'
    } else {
      error.value = err.response?.data?.detail ?? err.message
    }
  }
})
</script>

<template>
  <div class="appliance-login-page">
    <div v-if="error" class="error">
      <h1>Login failed</h1>
      <p>{{ error }}</p>
    </div>
    <div v-else class="pending">
      <p>Logging you in to your appliance…</p>
    </div>
  </div>
</template>

<style scoped>
.appliance-login-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.error {
  color: #c62828;
  max-width: 420px;
}
.pending {
  color: #555;
}
</style>
