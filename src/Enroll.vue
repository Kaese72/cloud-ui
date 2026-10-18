<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

// Enroll is a pass-through redirect step, not a page a user lingers on -
// see cloud-connect's README, "Enrollment" section. It registers a new
// Appliance and immediately sends the browser back to the appliance's own
// local UI with a single-use exchange code; it never shows or stores the
// code itself.
const route = useRoute()
const error = ref(null)

onMounted(async () => {
  const { state, return_to: returnTo } = route.query
  if (!state || !returnTo) {
    error.value = 'Missing enrollment parameters. Restart "Connect to Cloud" from the appliance.'
    return
  }
  try {
    const name = `Appliance ${new Date().toLocaleDateString()}`
    const response = await axios.post('/appliance-registry/v0/appliances/enroll', { name })
    const { applianceId, exchangeCode } = response.data
    const url = new URL(returnTo)
    url.searchParams.set('code', exchangeCode)
    url.searchParams.set('state', state)
    url.searchParams.set('applianceId', applianceId)
    window.location.href = url.toString()
  } catch (err) {
    error.value = err.response?.data?.detail ?? err.message
  }
})
</script>

<template>
  <div class="status enter">
    <div v-if="error" class="panel status-card">
      <h1 class="page-title">Enrollment failed</h1>
      <div class="alert alert-error">{{ error }}</div>
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
