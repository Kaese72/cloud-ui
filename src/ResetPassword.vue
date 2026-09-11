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
  <div class="reset-password-page">
    <div class="reset-password-card">
      <h1 class="app-title">Humi Cloud</h1>
      <h2 class="reset-password-heading">Choose a new password</h2>

      <div v-if="!token" class="confirmation">
        <p>This reset link is missing its token. Request a new one from the login page.</p>
        <router-link to="/forgot-password" class="back-link">← Request a new link</router-link>
      </div>
      <div v-else-if="done" class="confirmation">
        <p>Your password has been reset. You can now log in with your new password.</p>
        <router-link to="/login" class="back-link">→ Go to login</router-link>
      </div>
      <form v-else @submit.prevent="handleSubmit" class="reset-password-form">
        <div class="form-group">
          <label for="new-password">New password</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            :disabled="loading"
          />
        </div>
        <div class="form-group">
          <label for="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            :disabled="loading"
          />
        </div>
        <div v-if="error" class="error-msg">
          {{ error }}
          <router-link v-if="error.startsWith('This reset link')" to="/forgot-password">Request a new link</router-link>
        </div>
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Saving…' : 'Reset password' }}
        </button>
        <router-link to="/login" class="back-link">← Back to login</router-link>
      </form>
    </div>
  </div>
</template>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fa;
}

.reset-password-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.10);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
}

.app-title {
  margin: 0 0 0.25rem;
  font-size: 1.8rem;
  color: #222e3a;
  text-align: center;
}

.reset-password-heading {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  color: #666;
  text-align: center;
  font-weight: 400;
}

.reset-password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.9rem;
  color: #444;
  font-weight: 500;
}

.form-group input {
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
}

.form-group input:focus {
  border-color: #42b983;
}

.form-group input:disabled {
  background: #f5f5f5;
}

.error-msg {
  background: #fdecea;
  border: 1px solid #f5c6cb;
  border-radius: 5px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: #721c24;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.submit-btn {
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 0.65rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.25rem;
}

.submit-btn:hover:not(:disabled) {
  background: #369b6f;
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: default;
}

.confirmation {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.9rem;
  color: #333;
}

.back-link {
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  text-decoration: none;
}

.back-link:hover {
  color: #42b983;
}
</style>
