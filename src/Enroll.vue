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
  <div class="enroll-page">
    <div v-if="error" class="error">
      <h1>Enrollment failed</h1>
      <p>{{ error }}</p>
    </div>
    <div v-else class="pending">
      <p>Connecting your appliance…</p>
    </div>
  </div>
</template>

<style scoped>
.enroll-page {
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
