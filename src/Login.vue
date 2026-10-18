<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth.js'
import { takePendingEnroll } from './pendingEnroll.js'

const router = useRouter()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login(username.value, password.value)
    const pendingEnroll = takePendingEnroll()
    if (pendingEnroll) {
      router.push({ name: pendingEnroll.name, query: pendingEnroll.query })
    } else {
      router.push({ name: 'Home' })
    }
  } catch (e) {
    if (e.response?.status === 401) {
      error.value = 'Invalid username or password.'
    } else {
      error.value = 'Login failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-card">
    <h1 class="auth-title">Welcome back.</h1>
    <p class="auth-subtitle">Log in to Humi Cloud.</p>

    <form @submit.prevent="handleSubmit">
      <div class="field">
        <label for="username">Username</label>
        <input
          id="username"
          v-model="username"
          class="input"
          type="text"
          autocomplete="username"
          required
          :disabled="loading"
        />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          class="input"
          type="password"
          autocomplete="current-password"
          required
          :disabled="loading"
        />
      </div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
        {{ loading ? 'Logging in…' : 'Log in' }}
      </button>
    </form>

    <div class="auth-links">
      <router-link to="/forgot-password">Forgot password?</router-link>
      <span>New here? <router-link to="/register" class="strong">Create an account</router-link></span>
    </div>
  </div>
</template>
