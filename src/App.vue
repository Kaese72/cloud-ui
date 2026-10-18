<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from './composables/useAuth.js'
import AppTopBar from './components/AppTopBar.vue'
import BrandMark from './components/BrandMark.vue'
import ThemeToggle from './components/ThemeToggle.vue'

const route = useRoute()
const { logout } = useAuth()

// Three layouts: the landing page brings its own chrome, public auth pages
// (login, register, password reset) get a slim header around a centred card,
// and everything else gets the signed-in app shell.
const layout = computed(() => {
  if (route.name === 'Landing') return 'bare'
  if (route.meta.public) return 'auth'
  return 'app'
})

async function handleLogout() {
  await logout()
  window.location.assign('/login')
}
</script>

<template>
  <router-view v-if="layout === 'bare'" />

  <div v-else-if="layout === 'auth'" class="auth-layout">
    <header class="auth-header">
      <router-link to="/" class="brand-link" title="About Humi">
        <BrandMark />
      </router-link>
      <ThemeToggle />
    </header>
    <main class="auth-main">
      <router-view />
    </main>
  </div>

  <div v-else class="app-layout">
    <AppTopBar @logout="handleLogout" />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
/* ---------- auth ---------- */
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse 70% 50% at 50% 100%, color-mix(in srgb, var(--warm) 12%, transparent), transparent 70%),
    var(--bg);
}
.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  height: 64px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}
.brand-link {
  text-decoration: none;
}
.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px 64px;
}

/* ---------- app ---------- */
.app-layout {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--warm) 6%, transparent), transparent 70%),
    var(--bg);
}
.app-main {
  padding: 48px 24px 80px;
}

@media (max-width: 640px) {
  .auth-header {
    padding: 0 16px;
  }
  .app-main {
    padding: 28px 16px 64px;
  }
}
</style>
