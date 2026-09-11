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
  <div class="forgot-password-page">
    <div class="forgot-password-card">
      <h1 class="app-title">Humi Cloud</h1>
      <h2 class="forgot-password-heading">Reset your password</h2>

      <div v-if="submitted" class="confirmation">
        <p>If an account exists for <strong>{{ email }}</strong>, we've sent a link to reset your password. It expires shortly, so use it soon.</p>
        <router-link to="/login" class="back-link">← Back to login</router-link>
      </div>
      <form v-else @submit.prevent="handleSubmit" class="forgot-password-form">
        <p class="instructions">Enter the email address on your account and we'll send you a link to reset your password.</p>
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            :disabled="loading"
          />
        </div>
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Sending…' : 'Send reset link' }}
        </button>
        <router-link to="/login" class="back-link">← Back to login</router-link>
      </form>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fa;
}

.forgot-password-card {
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

.forgot-password-heading {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  color: #666;
  text-align: center;
  font-weight: 400;
}

.instructions {
  margin: 0;
  font-size: 0.9rem;
  color: #555;
}

.forgot-password-form {
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
