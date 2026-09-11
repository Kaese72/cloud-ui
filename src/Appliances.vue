<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const appliances = ref([])
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
    const response = await axios.get('/appliance-registry/v0/appliances')
    appliances.value = response.data ?? []
    error.value = null
  } catch (err) {
    error.value = err
  }
}

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
  <div class="appliances-page">
    <h1>Appliances</h1>
    <div v-if="error" class="error">Error: {{ error.message }}</div>
    <div v-if="actionError" class="error">{{ actionError }}</div>

    <section v-if="isAdmin" class="panel">
      <h2>Register a new appliance</h2>
      <div class="register-row">
        <input
          v-model="registerName"
          class="register-input"
          type="text"
          placeholder="Appliance name"
          :disabled="registering"
          @keyup.enter="register"
        />
        <button class="btn-register" :disabled="registering || !registerName" @click="register">
          {{ registering ? 'Registering…' : 'Register' }}
        </button>
      </div>
      <div v-if="registerError" class="error">{{ registerError }}</div>

      <div v-if="justRegistered" class="secret-reveal">
        <p class="secret-warning">
          Claim token — shown once, save it now. It's needed to claim this appliance during setup.
        </p>
        <dl>
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
      <h2>My appliances</h2>
      <div v-if="appliances.length === 0" class="empty">
        <p>No appliances registered yet.</p>
      </div>
      <ul v-else class="appliance-list">
        <li v-for="a in appliances" :key="a.id" class="appliance-card">
          <div class="appliance-info">
            <p class="appliance-name">
              {{ a.name }}
              <span class="badge" :class="`badge-${a.status}`">{{ a.status }}</span>
            </p>
            <p class="appliance-hostname">{{ a.hostname }}</p>
            <p class="appliance-meta">
              Registered {{ formatDate(a.createdAt) }}
              <template v-if="a.claimedAt"> · Claimed {{ formatDate(a.claimedAt) }}</template>
              <template v-if="a.lastSeenAt"> · Last seen {{ formatDate(a.lastSeenAt) }}</template>
            </p>
          </div>
          <div v-if="isAdmin" class="appliance-actions">
            <button
              v-if="a.status === 'active'"
              class="btn-rotate"
              :disabled="actionApplianceId === a.id"
              @click="rotate(a)"
            >
              Rotate secret
            </button>
            <button
              v-if="a.status !== 'revoked'"
              class="btn-revoke"
              :disabled="actionApplianceId === a.id"
              @click="revoke(a)"
            >
              Revoke
            </button>
          </div>
        </li>
      </ul>
    </section>

    <div v-if="justRotated" class="panel secret-reveal">
      <h2>New appliance secret</h2>
      <p class="secret-warning">
        Shown once, save it now. Update the appliance with this secret out-of-band.
      </p>
      <dl>
        <dt>Hostname</dt>
        <dd><code>{{ justRotated.hostname }}</code></dd>
        <dt>Tunnel URL</dt>
        <dd><code>{{ justRotated.tunnelUrl }}</code></dd>
        <dt>Appliance secret</dt>
        <dd><code>{{ justRotated.applianceSecret }}</code></dd>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.appliances-page {
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
.register-row {
  display: flex;
  gap: 0.5rem;
}
.register-input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
}
.btn-register, .btn-rotate {
  padding: 0.35rem 0.75rem;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-register:hover:not(:disabled), .btn-rotate:hover:not(:disabled) {
  background: #369b6f;
}
.btn-register:disabled, .btn-rotate:disabled {
  opacity: 0.6;
  cursor: default;
}
.empty {
  color: #999;
  font-style: italic;
  padding: 0.5rem 0;
}
.appliance-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.appliance-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  gap: 1rem;
}
.appliance-card:last-child { border-bottom: none; }
.appliance-name {
  margin: 0;
  font-weight: 600;
  color: #222e3a;
}
.appliance-hostname {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  color: #555;
}
.appliance-meta {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: #888;
}
.appliance-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: capitalize;
}
.badge-pending { background: #fff3cd; color: #856404; }
.badge-active { background: #d4edda; color: #1b5e20; }
.badge-revoked { background: #f8d7da; color: #842029; }
.btn-revoke {
  padding: 0.25rem 0.6rem;
  background: #fff;
  color: #c62828;
  border: 1px solid #c62828;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-revoke:hover:not(:disabled) { background: #c62828; color: #fff; }
.btn-revoke:disabled { opacity: 0.5; cursor: default; }
.secret-reveal dl {
  margin: 0.75rem 0 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.35rem 1rem;
}
.secret-reveal dt {
  font-size: 0.8rem;
  color: #888;
}
.secret-reveal dd {
  margin: 0;
  word-break: break-all;
}
.secret-warning {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  color: #856404;
  background: #fff3cd;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
}
.error {
  color: #c62828;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}
</style>
