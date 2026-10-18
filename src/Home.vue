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
  <div class="page enter">
    <p class="kicker">Humi Cloud</p>
    <h1 class="page-title">Welcome home<span v-if="user?.name">, {{ user.name }}</span>.</h1>
    <p class="page-lede">Everything your Humi Cloud account connects, in one place.</p>

    <div v-if="error" class="alert alert-error">Could not load your account overview. Please try again later.</div>

    <section v-else-if="group" class="panel current-group">
      <p class="label">You are currently in</p>
      <div class="group-line">
        <span class="group-name">{{ group.name }}</span>
        <span v-if="group.owner" class="badge badge-owner">Owner</span>
        <span v-else-if="group.admin" class="badge badge-admin">Admin</span>
        <span v-else class="badge badge-member">Member</span>
      </div>
      <router-link to="/groups" class="btn btn-ghost btn-sm">Manage groups →</router-link>
    </section>

    <div class="shortcuts">
      <router-link to="/appliances" class="shortcut">
        <span class="shortcut-title">Appliances</span>
        <span class="shortcut-body">The Humi Appliances your group owns, and their Cloud connection.</span>
      </router-link>
      <router-link to="/groups" class="shortcut">
        <span class="shortcut-title">Groups</span>
        <span class="shortcut-body">Who you share your homes with, and what they can do.</span>
      </router-link>
      <router-link to="/invitations" class="shortcut">
        <span class="shortcut-title">Invitations</span>
        <span class="shortcut-body">Invitations from other households waiting for you.</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.current-group .label {
  margin: 0 0 6px;
}
.group-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}
.group-name {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.shortcuts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.shortcut {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 22px;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
  background: color-mix(in srgb, var(--ink) 3%, transparent);
  color: var(--text);
  text-decoration: none;
  transition: transform 0.2s, border-color 0.2s, background 0.2s;
}
.shortcut:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--green) 50%, transparent);
  background: color-mix(in srgb, var(--ink) 5%, transparent);
}
.shortcut-title {
  font-weight: 700;
  font-size: 1.05rem;
}
.shortcut-title::after {
  content: ' →';
  color: var(--green-ink);
}
.shortcut-body {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.45;
}
</style>
