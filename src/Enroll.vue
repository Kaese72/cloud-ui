<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

// Enroll is the redirect step between an appliance's local UI and the cloud -
// see cloud-connect's README, "Enrollment" section. It registers a new
// Appliance in the user's current group and sends the browser back to the
// appliance's local UI with a single-use exchange code; it never shows or
// stores the code itself.
//
// Whoever receives the exchange code can redeem it for the new Appliance's
// secret, i.e. run an appliance inside this user's group under a trusted
// *.humi.kaese.space hostname. And this page is reached through a link
// anyone can craft. So it never enrolls on page load: it validates
// return_to, shows the user where the code will go, and only enrolls once
// they confirm. Unlike /appliance-login, there's no registered hostname to
// compare against yet - the appliance doesn't have one until enrollment
// finishes - so the user's confirmation is the only check on the host.
const ENROLL_CALLBACK_PATH = '/cloud-connect/callback'

const route = useRoute()
const error = ref(null)
const confirmHost = ref(null)
const working = ref(false)
let pendingTarget = null
let pendingState = null

onMounted(() => {
  const { state, return_to: returnTo } = route.query
  if (!state || !returnTo) {
    error.value = 'Missing enrollment parameters. Restart "Connect to Cloud" from the appliance.'
    return
  }
  let target
  try {
    target = new URL(returnTo)
  } catch {
    error.value = 'Invalid return address. Restart "Connect to Cloud" from the appliance.'
    return
  }
  if (!['http:', 'https:'].includes(target.protocol) || target.pathname !== ENROLL_CALLBACK_PATH || target.username || target.password) {
    error.value = 'Invalid return address. Restart "Connect to Cloud" from the appliance.'
    return
  }
  pendingTarget = target
  pendingState = state
  confirmHost.value = { host: target.host, secure: target.protocol === 'https:' }
})

async function proceed() {
  if (!pendingTarget || working.value) return
  working.value = true
  try {
    const name = `Appliance ${new Date().toLocaleDateString()}`
    const response = await axios.post('/appliance-registry/v0/appliances/enroll', { name })
    const { applianceId, exchangeCode } = response.data
    pendingTarget.searchParams.set('code', exchangeCode)
    pendingTarget.searchParams.set('state', pendingState)
    pendingTarget.searchParams.set('applianceId', applianceId)
    window.location.href = pendingTarget.toString()
  } catch (err) {
    confirmHost.value = null
    error.value = err.response?.data?.detail ?? err.message
  } finally {
    working.value = false
  }
}

function cancel() {
  pendingTarget = null
  confirmHost.value = null
  error.value = 'Enrollment cancelled. No Appliance was registered.'
}
</script>

<template>
  <div class="status enter">
    <div v-if="error" class="panel status-card">
      <h1 class="page-title">Enrollment failed</h1>
      <div class="alert alert-error">{{ error }}</div>
    </div>
    <div v-else-if="confirmHost" class="panel status-card">
      <h1 class="page-title">Connect Appliance?</h1>
      <p>This will add a new Appliance to your current group and connect the Appliance at</p>
      <p class="confirm-host"><code>{{ confirmHost.host }}</code></p>
      <div class="alert alert-warning">
        Only continue if you just clicked "Connect to Cloud" on your own Appliance, and this is the address you opened it at.
        Whoever controls this address gets an Appliance in your group.
      </div>
      <p v-if="!confirmHost.secure" class="confirm-note">This address does not use HTTPS. That's normal on a home network.</p>
      <div class="confirm-actions">
        <button type="button" class="btn btn-ghost" :disabled="working" @click="cancel">Cancel</button>
        <button type="button" class="btn btn-primary" :disabled="working" @click="proceed">Connect {{ confirmHost.host }}</button>
      </div>
    </div>
    <div v-else class="status-card">
      <div class="spinner" aria-hidden="true" />
      <p class="pending-text">Connecting your Appliance…</p>
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
