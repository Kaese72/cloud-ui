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
  <div class="auth-card">
    <h1 class="auth-title">Create your account.</h1>
    <p class="auth-subtitle">One Humi Cloud account for all your Appliances.</p>

    <form @submit.prevent="handleSubmit">
      <div class="field">
        <label for="username">Username</label>
        <input id="username" v-model="username" class="input" type="text" autocomplete="username" required :disabled="loading" />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" v-model="password" class="input" type="password" autocomplete="new-password" minlength="8" required :disabled="loading" />
      </div>
      <div class="name-pair">
        <div class="field">
          <label for="name">Name</label>
          <input id="name" v-model="name" class="input" type="text" autocomplete="given-name" required :disabled="loading" />
        </div>
        <div class="field">
          <label for="surname">Surname</label>
          <input id="surname" v-model="surname" class="input" type="text" autocomplete="family-name" required :disabled="loading" />
        </div>
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="email" required :disabled="loading" />
      </div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
        {{ loading ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <div class="auth-links">
      <span>Already have an account? <router-link to="/login" class="strong">Log in</router-link></span>
    </div>
  </div>
</template>

<style scoped>
.name-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 14px;
}
.name-pair .field + .field {
  margin-top: 0;
}
.name-pair + .field {
  margin-top: 14px;
}
</style>
