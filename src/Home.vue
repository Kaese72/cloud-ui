<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const user = ref(null)
const group = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    const [userResp, groupResp] = await Promise.all([
      axios.get('/cloud-user-registry/v0/users/me'),
      axios.get('/cloud-user-registry/v0/groups/current'),
    ])
    user.value = userResp.data
    group.value = groupResp.data
  } catch (err) {
    error.value = err
  }
})
</script>

<template>
  <div class="home-container">
    <h1>Welcome{{ user ? `, ${user.name}` : '' }}</h1>
    <p v-if="error">Could not load your account overview. Please try again later.</p>
    <div v-else-if="group" class="current-group-card">
      <p class="label">You are currently in</p>
      <p class="group-name">{{ group.name }}</p>
      <p class="role">
        <span v-if="group.owner" class="badge badge-owner">Owner</span>
        <span v-else-if="group.admin" class="badge badge-admin">Admin</span>
        <span v-else class="badge badge-member">Member</span>
      </p>
      <router-link to="/groups" class="manage-link">Manage groups →</router-link>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
}
.current-group-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem 2rem;
  margin-top: 1rem;
  min-width: 260px;
}
.label {
  margin: 0;
  font-size: 0.85rem;
  color: #888;
}
.group-name {
  margin: 0.25rem 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #222e3a;
}
.role {
  margin: 0.5rem 0 1rem;
}
.badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.badge-owner { background: #fff3cd; color: #856404; }
.badge-admin { background: #cfe2ff; color: #1565c0; }
.badge-member { background: #eee; color: #555; }
.manage-link {
  font-size: 0.9rem;
  color: #42b983;
  text-decoration: none;
}
.manage-link:hover {
  text-decoration: underline;
}
</style>
