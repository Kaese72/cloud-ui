<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from './composables/useAuth.js'

const route = useRoute()
const { logout } = useAuth()

const isPublicRoute = computed(() => route.meta.public === true)

function handleLogout() {
  logout()
  window.location.assign('/login')
}
</script>

<template>
  <!-- Public routes (login, register) render full-page without the app shell -->
  <router-view v-if="isPublicRoute" />

  <div v-else class="app-layout">
    <nav class="sidebar">
      <ul>
        <li>
          <router-link to="/home">
            <span class="nav-icon">🏠</span>
            <span class="nav-label">Home</span>
          </router-link>
        </li>
        <li>
          <router-link to="/groups">
            <span class="nav-icon">👥</span>
            <span class="nav-label">Groups</span>
          </router-link>
        </li>
        <li>
          <router-link to="/invitations">
            <span class="nav-icon">✉️</span>
            <span class="nav-label">Invitations</span>
          </router-link>
        </li>
        <li>
          <router-link to="/account">
            <span class="nav-icon">👤</span>
            <span class="nav-label">Account</span>
          </router-link>
        </li>
        <li>
          <a @click.prevent="handleLogout" href="#" title="Log out">
            <span class="nav-icon">🚪</span>
            <span class="nav-label">Log out</span>
          </a>
        </li>
      </ul>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  position: relative;
  height: 100vh;
  min-height: 0;
}
.sidebar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 48px;
  background: #222e3a;
  color: #fff;
  padding: 1.5rem 0 1.5rem 0;
  height: 100vh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  flex-shrink: 0;
  transition: width 0.25s ease;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}
.sidebar:hover {
  width: 200px;
}
.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sidebar li {
  margin: 0.5rem 0;
}
.sidebar a {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  color: #fff;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s;
}
.sidebar a.router-link-active {
  font-weight: bold;
  color: #42b983;
}
.nav-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}
.nav-label {
  font-size: 1.1rem;
  opacity: 1;
  transition: opacity 0.15s ease;
}
.sidebar:not(:hover) .nav-label {
  opacity: 0;
}
.main-content {
  flex: 1;
  margin-left: 48px;
  padding: 1.5rem;
  background: #f7f9fa;
  overflow-y: auto;
  min-height: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
</style>
<style>
body, html, #app {
  margin: 0;
}
</style>
