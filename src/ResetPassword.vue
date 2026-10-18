<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth.js'

const route = useRoute()
const router = useRouter()
const { confirmPasswordReset } = useAuth()

const token = route.query.token ?? ''
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const done = ref(false)

async function handleSubmit() {
  error.value = ''
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    await confirmPasswordReset(token, newPassword.value)
    done.value = true
  } catch (e) {
    if (e.response?.status === 400) {
      error.value = 'This reset link is invalid or has expired. Request a new one.'
    } else {
      error.value = 'Failed to reset password. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-card">
    <h1 class="auth-title">Choose a new password.</h1>

    <template v-if="!token">
      <p class="auth-subtitle">This reset link is missing its token. Request a new one from the login page.</p>
      <router-link to="/forgot-password" class="btn btn-ghost btn-block">Request a new link</router-link>
    </template>

    <template v-else-if="done">
      <p class="auth-subtitle">Your password has been reset. You can now log in with your new password.</p>
      <router-link to="/login" class="btn btn-primary btn-block">Go to login</router-link>
    </template>

    <template v-else>
      <p class="auth-subtitle">At least 8 characters.</p>
      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label for="new-password">New password</label>
          <input id="new-password" v-model="newPassword" class="input" type="password" autocomplete="new-password" minlength="8" required :disabled="loading" />
        </div>
        <div class="field">
          <label for="confirm-password">Confirm new password</label>
          <input id="confirm-password" v-model="confirmPassword" class="input" type="password" autocomplete="new-password" minlength="8" required :disabled="loading" />
        </div>
        <div v-if="error" class="alert alert-error">
          {{ error }}
          <router-link v-if="error.startsWith('This reset link')" to="/forgot-password">Request a new link</router-link>
        </div>
        <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
          {{ loading ? 'Saving…' : 'Reset password' }}
        </button>
      </form>
      <div class="auth-links">
        <router-link to="/login">← Back to login</router-link>
      </div>
    </template>
  </div>
</template>
