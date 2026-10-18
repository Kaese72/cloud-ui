<script setup>
import { ref } from 'vue'
import { useAuth } from './composables/useAuth.js'

const { requestPasswordReset } = useAuth()

const email = ref('')
const loading = ref(false)
const submitted = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    await requestPasswordReset(email.value)
  } finally {
    // Always show the same outcome, whether or not the address is
    // registered - see useAuth.requestPasswordReset.
    loading.value = false
    submitted.value = true
  }
}
</script>

<template>
  <div class="auth-card">
    <h1 class="auth-title">Reset your password.</h1>

    <template v-if="submitted">
      <p class="auth-subtitle">
        If an account exists for <strong>{{ email }}</strong>, we've sent a link to reset your
        password. It expires shortly, so use it soon.
      </p>
      <router-link to="/login" class="btn btn-ghost btn-block">Back to login</router-link>
    </template>

    <template v-else>
      <p class="auth-subtitle">
        Enter the email address on your account and we'll send you a link to reset your password.
      </p>
      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" class="input" type="email" autocomplete="email" required :disabled="loading" />
        </div>
        <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
          {{ loading ? 'Sending…' : 'Send reset link' }}
        </button>
      </form>
      <div class="auth-links">
        <router-link to="/login">← Back to login</router-link>
      </div>
    </template>
  </div>
</template>
