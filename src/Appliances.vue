<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'

const appliances = ref([])
const showRevoked = ref(false)
const error = ref(null)
const isAdmin = ref(false)

const registerName = ref('')
const registering = ref(false)
const registerError = ref(null)
const justRegistered = ref(null) // { id, claimToken, claimTokenExpiresAt }

const actionApplianceId = ref(null)
const actionError = ref(null)
const justRotated = ref(null) // { id, applianceSecret, hostname, tunnelUrl }

onMounted(async () => {
  await Promise.all([fetchAppliances(), fetchIsAdmin()])
})

async function fetchIsAdmin() {
  try {
    const response = await axios.get('/cloud-user-registry/v0/groups/current')
    isAdmin.value = !!response.data.admin
  } catch {
    isAdmin.value = false
  }
}

async function fetchAppliances() {
  try {
    const response = await axios.get('/appliance-registry/v0/appliances', {
      params: showRevoked.value ? { includeRevoked: true } : {},
    })
    appliances.value = response.data ?? []
    error.value = null
  } catch (err) {
    error.value = err
  }
}

watch(showRevoked, fetchAppliances)

async function register() {
  if (!registerName.value) return
  registering.value = true
  registerError.value = null
  justRegistered.value = null
  try {
    const response = await axios.post('/appliance-registry/v0/appliances', { name: registerName.value })
    justRegistered.value = {
      id: response.data.id,
      claimToken: response.data.claimToken,
      claimTokenExpiresAt: response.data.claimTokenExpiresAt,
    }
    registerName.value = ''
    await fetchAppliances()
  } catch (err) {
    registerError.value = err.response?.data?.detail ?? err.message
  } finally {
    registering.value = false
  }
}

async function revoke(appliance) {
  if (!confirm(`Revoke "${appliance.name}"? It will lose cloud connectivity until re-claimed.`)) return
  actionApplianceId.value = appliance.id
  actionError.value = null
  try {
    await axios.post(`/appliance-registry/v0/appliances/${appliance.id}/revoke`)
    await fetchAppliances()
  } catch (err) {
    actionError.value = err.response?.data?.detail ?? err.message
  } finally {
    actionApplianceId.value = null
  }
}

async function rotate(appliance) {
  if (!confirm(`Rotate the secret for "${appliance.name}"? The appliance will need to be updated with the new secret out-of-band.`)) return
  actionApplianceId.value = appliance.id
  actionError.value = null
  justRotated.value = null
  try {
    const response = await axios.post(`/appliance-registry/v0/appliances/${appliance.id}/rotate`)
    justRotated.value = {
      id: appliance.id,
      applianceSecret: response.data.applianceSecret,
      hostname: response.data.hostname,
      tunnelUrl: response.data.tunnelUrl,
    }
  } catch (err) {
    actionError.value = err.response?.data?.detail ?? err.message
  } finally {
    actionApplianceId.value = null
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—'
}
</script>

<template>
  <div class="page enter">
    <h1 class="page-title">Appliances</h1>
    <p class="page-lede">The Humi Appliances your current group owns, and their connection to the Cloud.</p>
    <div v-if="error" class="alert alert-error">Error: {{ error.message }}</div>
    <div v-if="actionError" class="alert alert-error">{{ actionError }}</div>

    <section v-if="isAdmin" class="panel">
      <h2 class="panel-title">Register a new Appliance</h2>
      <div class="inline-form">
        <input
          v-model="registerName"
          class="input"
          type="text"
          placeholder="Appliance name"
          aria-label="Appliance name"
          :disabled="registering"
          @keyup.enter="register"
        />
        <button class="btn btn-primary" :disabled="registering || !registerName" @click="register">
          {{ registering ? 'Registering…' : 'Register' }}
        </button>
      </div>
      <div v-if="registerError" class="alert alert-error">{{ registerError }}</div>

      <div v-if="justRegistered" class="secret">
        <div class="alert alert-warning">
          Claim token, shown once. Save it now: it's needed to claim this Appliance during setup.
        </div>
        <dl class="details">
          <dt>Appliance ID</dt>
          <dd><code>{{ justRegistered.id }}</code></dd>
          <dt>Claim token</dt>
          <dd><code>{{ justRegistered.claimToken }}</code></dd>
          <dt>Expires</dt>
          <dd>{{ formatDate(justRegistered.claimTokenExpiresAt) }}</dd>
        </dl>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2 class="panel-title">My Appliances</h2>
        <label class="check">
          <input v-model="showRevoked" type="checkbox" />
          Show revoked
        </label>
      </div>
      <p v-if="appliances.length === 0" class="empty">
        {{ showRevoked ? 'No Appliances registered yet.' : 'No active or pending Appliances.' }}
      </p>
      <ul v-else class="rows">
        <li v-for="a in appliances" :key="a.id" class="row">
          <span class="device" :class="`device-${a.status}`" aria-hidden="true"><span class="led" /></span>
          <div class="row-main">
            <p class="row-title">
              {{ a.name }}
              <span class="badge" :class="`badge-${a.status}`">{{ a.status }}</span>
            </p>
            <p class="row-meta">{{ a.hostname }}</p>
            <p class="row-meta faint">
              Registered {{ formatDate(a.createdAt) }}
              <template v-if="a.claimedAt"> · Claimed {{ formatDate(a.claimedAt) }}</template>
              <template v-if="a.lastSeenAt"> · Last seen {{ formatDate(a.lastSeenAt) }}</template>
            </p>
          </div>
          <div class="row-actions">
            <a
              v-if="a.status === 'active'"
              class="btn btn-ghost btn-sm"
              :href="`https://${a.hostname}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit ↗
            </a>
            <template v-if="isAdmin">
              <button
                v-if="a.status === 'active'"
                class="btn btn-ghost btn-sm"
                :disabled="actionApplianceId === a.id"
                @click="rotate(a)"
              >
                Rotate secret
              </button>
              <button
                v-if="a.status !== 'revoked'"
                class="btn btn-danger btn-sm"
                :disabled="actionApplianceId === a.id"
                @click="revoke(a)"
              >
                Revoke
              </button>
            </template>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="justRotated" class="panel">
      <h2 class="panel-title">New Appliance secret</h2>
      <div class="alert alert-warning">
        Shown once. Save it now and update the Appliance with this secret out-of-band.
      </div>
      <dl class="details">
        <dt>Hostname</dt>
        <dd><code>{{ justRotated.hostname }}</code></dd>
        <dt>Tunnel URL</dt>
        <dd><code>{{ justRotated.tunnelUrl }}</code></dd>
        <dt>Appliance secret</dt>
        <dd><code>{{ justRotated.applianceSecret }}</code></dd>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.secret {
  margin-top: 18px;
}
.row-title .badge {
  margin-left: 8px;
}
.faint {
  color: var(--faint);
  font-size: 0.8rem;
}
/* A small Appliance with its status LED, like the one on the landing page. */
.device {
  position: relative;
  flex-shrink: 0;
  width: 46px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(160deg, #26364a, #141e2b 70%);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.led {
  position: absolute;
  top: 6px;
  right: 7px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5f6d7d;
}
.device-active .led {
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  animation: breathe 2.4s ease-in-out infinite;
}
.device-pending .led {
  background: var(--warm);
  box-shadow: 0 0 6px var(--warm);
}
.device-revoked {
  opacity: 0.45;
}
@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
@media (prefers-reduced-motion: reduce) {
  .device-active .led { animation: none; }
}
</style>
