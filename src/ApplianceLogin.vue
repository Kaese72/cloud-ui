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

// The appliance's own UI is the only place a login code should ever be sent -
// specifically, one of its own cloud-login-code callback pages. There are two:
// the ordinary "log in with Humi Cloud" flow, and authentication's "link this
// appliance user to a cloud account" flow - both redeem the code the same way,
// so both are allowed here.
const ALLOWED_CALLBACK_PATHS = ['/cloud-login/callback', '/cloud-link/callback']

// Where the code goes is the whole security of this flow. The appliance's
// cloud-login start endpoint is unauthenticated and accepts any return_to, and
// the appliance redeems whatever code and state it is handed - so a code sent
// to an attacker's host is a login as this user. Only the appliance's
// registered hostname (as told by appliance-registry, over https) is trusted
// silently. Anything else - legitimately, the appliance's LAN address - is
// shown to the user to confirm first.
const confirmHost = ref(null)
let pendingTarget = null

function loginCodeUrl(applianceId) {
  return `/appliance-registry/v0/appliances/${encodeURIComponent(applianceId)}/login-code`
}

// A user can belong to several groups but is only ever "in" one at a time, and
// appliance-registry only issues codes for the appliance's owning group. If
// the active group isn't the owner (404), try the user's other groups, then
// put their active group back where it was. Resolves to the login-code
// response ({ code, expiresAt, hostname }).
async function requestLoginCode(applianceId) {
  try {
    return (await axios.post(loginCodeUrl(applianceId))).data
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
        return (await axios.post(loginCodeUrl(applianceId))).data
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

// isRegisteredHost reports whether target is exactly the appliance's
// registered hostname, over https on the default port.
function isRegisteredHost(target, hostname) {
  return (
    !!hostname &&
    target.protocol === 'https:' &&
    target.port === '' &&
    target.hostname.toLowerCase() === hostname.toLowerCase()
  )
}

function proceed() {
  if (pendingTarget) window.location.href = pendingTarget.toString()
}

function cancel() {
  pendingTarget = null
  confirmHost.value = null
  error.value = 'Login cancelled. Nothing was sent to the other address.'
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
  if (!['http:', 'https:'].includes(target.protocol) || !ALLOWED_CALLBACK_PATHS.includes(target.pathname) || target.username || target.password) {
    error.value = 'Invalid return address. Restart the login from the appliance.'
    return
  }

  try {
    const { code, hostname } = await requestLoginCode(applianceId)
    target.searchParams.set('code', code)
    target.searchParams.set('state', state)
    if (isRegisteredHost(target, hostname)) {
      window.location.href = target.toString()
      return
    }
    // Held in memory only, and sent nowhere unless the user confirms. An
    // abandoned code simply expires.
    pendingTarget = target
    confirmHost.value = { host: target.host, secure: target.protocol === 'https:', hostname }
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
  <div class="status enter">
    <div v-if="error" class="panel status-card">
      <h1 class="page-title">Login failed</h1>
      <div class="alert alert-error">{{ error }}</div>
    </div>
    <div v-else-if="confirmHost" class="panel status-card">
      <h1 class="page-title">Confirm address</h1>
      <p>You are about to log in to your Appliance at</p>
      <p class="confirm-host"><code>{{ confirmHost.host }}</code></p>
      <div class="alert alert-warning">
        This is not your Appliance's Humi Cloud address<template v-if="confirmHost.hostname"> (<code>{{ confirmHost.hostname }}</code>)</template>.
        Only continue if you opened your Appliance at this address yourself, for example on your home network.
        Whoever controls this address is logged in as you.
      </div>
      <p v-if="!confirmHost.secure" class="confirm-note">This address does not use HTTPS.</p>
      <div class="confirm-actions">
        <button type="button" class="btn btn-ghost" @click="cancel">Cancel</button>
        <button type="button" class="btn btn-primary" @click="proceed">Continue to {{ confirmHost.host }}</button>
      </div>
    </div>
    <div v-else class="status-card">
      <div class="spinner" aria-hidden="true" />
      <p class="pending-text">Logging you in to your Appliance…</p>
    </div>
  </div>
</template>

<style scoped>
.status {
  min-height: 55vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-card {
  max-width: 440px;
  text-align: center;
}
.status-card .page-title {
  font-size: 2rem;
}
.spinner {
  width: 38px;
  height: 38px;
  margin: 0 auto 18px;
  border-radius: 50%;
  border: 3px solid color-mix(in srgb, var(--ink) 12%, transparent);
  border-top-color: var(--green);
  animation: spin 0.9s linear infinite;
}
.confirm-host {
  font-size: 1.15rem;
  word-break: break-all;
}
.confirm-note {
  color: var(--muted);
}
.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 18px;
}
.pending-text {
  margin: 0;
  color: var(--muted);
  font-size: 1.05rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .spinner { animation-duration: 3s; }
}
</style>
