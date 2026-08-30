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
  <div class="account-page">
    <h1>Account</h1>
    <div v-if="error">Error: {{ error.message }}</div>
    <div v-else-if="user" class="account-info">
      <div class="info-section">
        <h3>General Information</h3>
        <ul>
          <li><strong>ID:</strong> {{ user.id }}</li>
          <li><strong>Username:</strong> {{ user.username }}</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>Profile</h3>
        <div class="form-row">
          <label>Name</label>
          <input v-model="form.name" type="text" class="form-input" :disabled="saving" />
        </div>
        <div class="form-row">
          <label>Surname</label>
          <input v-model="form.surname" type="text" class="form-input" :disabled="saving" />
        </div>
        <div class="form-row">
          <label>Email</label>
          <input v-model="form.email" type="email" class="form-input" :disabled="saving" />
        </div>
        <div v-if="saveError" class="save-error">{{ saveError }}</div>
        <div class="form-actions">
          <button class="save-button" :disabled="saving || !isDirty()" @click="saveUser">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button class="cancel-button" :disabled="saving || !isDirty()" @click="resetForm">Reset</button>
        </div>
      </div>

      <div class="info-section">
        <h3>Security</h3>
        <button class="btn-change-password" @click="openPasswordDialog">Change password</button>
      </div>
    </div>
    <div v-else>Loading...</div>

    <div v-if="showPasswordDialog" class="dialog-backdrop" @click.self="closePasswordDialog">
      <div class="dialog">
        <h3>Change password</h3>
        <input
          v-model="passwordForm.currentPassword"
          class="dialog-input"
          type="password"
          placeholder="Current password"
          autocomplete="current-password"
          :disabled="changingPassword"
        />
        <input
          v-model="passwordForm.newPassword"
          class="dialog-input"
          type="password"
          placeholder="New password"
          autocomplete="new-password"
          :disabled="changingPassword"
        />
        <input
          v-model="passwordForm.confirmPassword"
          class="dialog-input"
          type="password"
          placeholder="Confirm new password"
          autocomplete="new-password"
          :disabled="changingPassword"
          @keyup.enter="changePassword"
        />
        <div v-if="passwordError" class="dialog-error">{{ passwordError }}</div>
        <div class="dialog-actions">
          <button
            class="dialog-save-button"
            :disabled="changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword"
            @click="changePassword"
          >
            {{ changingPassword ? 'Saving...' : 'Save' }}
          </button>
          <button class="dialog-cancel-button" :disabled="changingPassword" @click="closePasswordDialog">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-page {
  width: 100%;
  max-width: 560px;
}
.account-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-section {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.info-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.1rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

strong {
  color: #555;
  margin-right: 0.5rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.form-row label {
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.3rem;
}

.form-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-input:disabled { background: #f0f0f0; }

.save-error {
  color: #c62828;
  font-size: 0.85rem;
  margin-bottom: 0.6rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.save-button {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  background: #2d8cff;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
}

.save-button:disabled {
  background: #9bbcf2;
  cursor: not-allowed;
}

.cancel-button {
  padding: 0.4rem 0.8rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: #f4f4f4;
  color: #222;
  cursor: pointer;
  font-size: 0.9rem;
}

.cancel-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-change-password {
  padding: 0.4rem 0.8rem;
  background: #1565c0;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-change-password:hover { background: #0d47a1; }

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
.dialog {
  width: 360px;
  max-width: calc(100vw - 2rem);
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ddd;
  padding: 1rem;
}
.dialog h3 {
  margin-top: 0;
  margin-bottom: 0.8rem;
}
.dialog-input {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  margin-bottom: 0.6rem;
}
.dialog-input:disabled { background: #f5f5f5; }
.dialog-error {
  color: #c62828;
  font-size: 0.85rem;
  margin-bottom: 0.6rem;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.dialog-save-button,
.dialog-cancel-button {
  padding: 0.45rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
}
.dialog-save-button {
  border: 1px solid #2e7d32;
  background: #2e7d32;
  color: #fff;
}
.dialog-save-button:disabled,
.dialog-cancel-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.dialog-cancel-button {
  border: 1px solid #d0d0d0;
  background: #f4f4f4;
  color: #222;
}
</style>
