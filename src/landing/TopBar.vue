<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import BrandMark from '../components/BrandMark.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import UserChip from '../components/UserChip.vue'

// links: [{ id, label }] - in-page sections to jump to.
const props = defineProps({
  links: { type: Array, default: () => [] },
})

const { isAuthenticated } = useAuth()

const scrolled = ref(false)
const progress = ref(0)
const activeId = ref(null)

let frame = null
function update() {
  frame = null
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? window.scrollY / max : 0
  scrolled.value = window.scrollY > 24
  let current = null
  for (const link of props.links) {
    const el = document.getElementById(link.id)
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = link.id
  }
  activeId.value = current
}
function schedule() {
  if (frame === null) frame = requestAnimationFrame(update)
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  update()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  if (frame !== null) cancelAnimationFrame(frame)
})
</script>

<template>
  <header class="topbar" :class="{ scrolled }">
    <div class="inner">
      <a href="#top" class="brand-link" @click.prevent="scrollToId('top')">
        <BrandMark />
      </a>

      <nav class="links">
        <a
          v-for="link in links"
          :key="link.id"
          :href="`#${link.id}`"
          :class="{ active: activeId === link.id }"
          @click.prevent="scrollToId(link.id)"
        >{{ link.label }}</a>
      </nav>

      <div class="auth">
        <ThemeToggle />
        <UserChip v-if="isAuthenticated" to="/home" title="Open your dashboard" arrow />
        <router-link v-else to="/login" class="login-btn">Log in</router-link>
      </div>
    </div>
    <div class="progress" :style="{ transform: `scaleX(${progress})` }" />
  </header>
</template>

<style scoped>
.topbar {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  transition: background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease;
  border-bottom: 1px solid transparent;
}
.topbar.scrolled {
  background: color-mix(in srgb, var(--bg) 62%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border-bottom-color: color-mix(in srgb, var(--ink) 6%, transparent);
}
.inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.brand-link {
  text-decoration: none;
}

.links {
  display: flex;
  gap: 4px;
  margin-left: auto;
}
.links a {
  position: relative;
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s, background 0.2s;
}
.links a:hover {
  color: var(--text);
}
.links a.active {
  color: var(--text);
  background: color-mix(in srgb, var(--ink) 7%, transparent);
}

.auth {
  display: flex;
  align-items: center;
  gap: 10px;
}
.login-btn {
  padding: 9px 20px;
  border-radius: 999px;
  background: var(--text);
  color: var(--bg);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px color-mix(in srgb, var(--warm) 35%, transparent);
}

.progress {
  position: absolute;
  left: 0;
  bottom: -1px;
  height: 2px;
  width: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, var(--warm), var(--green));
  opacity: 0;
  transition: opacity 0.3s;
}
.scrolled .progress {
  opacity: 1;
}

@media (max-width: 640px) {
  .inner {
    padding: 0 16px;
    gap: 12px;
  }
  .links {
    display: none;
  }
  .auth {
    margin-left: auto;
  }
}
</style>
