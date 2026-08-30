<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth.js'

const router = useRouter()
const { register } = useAuth()

const username = ref('')
const password = ref('')
const name = ref('')
const surname = ref('')
const email = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    // Registration also creates a Group owned and administered by the new
    // User, and logs them straight in - no separate login step needed.
    await register({
      username: username.value,
      password: password.value,
      name: name.value,
      surname: surname.value,
      email: email.value,
    })
    router.push({ name: 'Home' })
  } catch (e) {
    if (e.response?.status === 409) {
      error.value = 'That username or email is already registered.'
    } else {
      error.value = 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-card">
      <h1 class="app-title">Humi Cloud</h1>
      <h2 class="register-heading">Create your account</h2>

      <form @submit.prevent="handleSubmit" class="register-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            required
            :disabled="loading"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            :disabled="loading"
          />
        </div>
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            autocomplete="given-name"
            required
            :disabled="loading"
          />
        </div>
        <div class="form-group">
          <label for="surname">Surname</label>
          <input
            id="surname"
            v-model="surname"
            type="text"
            autocomplete="family-name"
            required
            :disabled="loading"
          />
        </div>
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
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Creating account…' : 'Create account' }}
        </button>
        <router-link to="/login" class="back-link">← Back to login</router-link>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fa;
}

.register-card {
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

.register-heading {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  color: #666;
  text-align: center;
  font-weight: 400;
}

.register-form {
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
