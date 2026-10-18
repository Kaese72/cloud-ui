<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const user = ref(null)
const form = ref({ name: '', surname: '', email: '' })
const error = ref(null)
const saving = ref(false)
const saveError = ref(null)

const showPasswordDialog = ref(false)
const changingPassword = ref(false)
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const passwordError = ref(null)

onMounted(fetchUser)

async function fetchUser() {
  try {
    const response = await axios.get('/cloud-user-registry/v0/users/me')
    user.value = response.data
    error.value = null
    resetForm()
  } catch (err) {
    error.value = err
  }
}

function resetForm() {
  form.value = {
    name: user.value?.name ?? '',
    surname: user.value?.surname ?? '',
    email: user.value?.email ?? '',
  }
}

function isDirty() {
  if (!user.value) return false
  return form.value.name !== user.value.name ||
    form.value.surname !== user.value.surname ||
    form.value.email !== user.value.email
}

async function saveUser() {
  saving.value = true
  saveError.value = null
  try {
    const response = await axios.put('/cloud-user-registry/v0/users/me', {
      name: form.value.name,
      surname: form.value.surname,
      email: form.value.email,
    })
    user.value = response.data
    resetForm()
  } catch (err) {
    saveError.value = err.response?.data?.detail ?? err.message
  } finally {
    saving.value = false
  }
}

function openPasswordDialog() {
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  passwordError.value = null
  showPasswordDialog.value = true
}

function closePasswordDialog() {
  if (changingPassword.value) return
  showPasswordDialog.value = false
}

async function changePassword() {
  const { currentPassword, newPassword, confirmPassword } = passwordForm.value
  if (!currentPassword || !newPassword || !confirmPassword) return
  if (newPassword !== confirmPassword) {
    passwordError.value = 'New passwords do not match.'
    return
  }
  changingPassword.value = true
  passwordError.value = null
  try {
    await axios.put('/cloud-user-registry/v0/users/me/password', {
      currentPassword,
      newPassword,
    })
    showPasswordDialog.value = false
  } catch (err) {
    passwordError.value = err.response?.data?.detail ?? err.message
  } finally {
    changingPassword.value = false
  }
}
</script>

<template>
  <div class="page page-narrow enter">
    <h1 class="page-title">Account</h1>
    <p class="page-lede">Your Humi Cloud profile and sign-in details.</p>
    <div v-if="error" class="alert alert-error">Error: {{ error.message }}</div>

    <template v-else-if="user">
      <section class="panel">
        <h2 class="panel-title">General</h2>
        <dl class="details">
          <dt>Username</dt>
          <dd>{{ user.username }}</dd>
          <dt>ID</dt>
          <dd><code>{{ user.id }}</code></dd>
        </dl>
      </section>

      <section class="panel">
        <h2 class="panel-title">Profile</h2>
        <div class="field">
          <label for="profile-name">Name</label>
          <input id="profile-name" v-model="form.name" type="text" class="input" :disabled="saving" />
        </div>
        <div class="field">
          <label for="profile-surname">Surname</label>
          <input id="profile-surname" v-model="form.surname" type="text" class="input" :disabled="saving" />
        </div>
        <div class="field">
          <label for="profile-email">Email</label>
          <input id="profile-email" v-model="form.email" type="email" class="input" :disabled="saving" />
        </div>
        <div v-if="saveError" class="alert alert-error">{{ saveError }}</div>
        <div class="form-actions">
          <button class="btn btn-primary" :disabled="saving || !isDirty()" @click="saveUser">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <button class="btn btn-ghost" :disabled="saving || !isDirty()" @click="resetForm">Reset</button>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Security</h2>
        <button class="btn btn-ghost" @click="openPasswordDialog">Change password</button>
      </section>
    </template>
    <p v-else class="empty">Loading…</p>

    <div v-if="showPasswordDialog" class="dialog-backdrop" @click.self="closePasswordDialog">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="password-dialog-title">
        <h3 id="password-dialog-title" class="dialog-title">Change password</h3>
        <div class="field">
          <label for="current-password">Current password</label>
          <input
            id="current-password"
            v-model="passwordForm.currentPassword"
            class="input"
            type="password"
            autocomplete="current-password"
            :disabled="changingPassword"
          />
        </div>
        <div class="field">
          <label for="new-password">New password</label>
          <input
            id="new-password"
            v-model="passwordForm.newPassword"
            class="input"
            type="password"
            autocomplete="new-password"
            :disabled="changingPassword"
          />
        </div>
        <div class="field">
          <label for="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            v-model="passwordForm.confirmPassword"
            class="input"
            type="password"
            autocomplete="new-password"
            :disabled="changingPassword"
            @keyup.enter="changePassword"
          />
        </div>
        <div v-if="passwordError" class="alert alert-error">{{ passwordError }}</div>
        <div class="dialog-actions">
          <button class="btn btn-ghost" :disabled="changingPassword" @click="closePasswordDialog">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword"
            @click="changePassword"
          >
            {{ changingPassword ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
