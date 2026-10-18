<script setup>
import BrandMark from './BrandMark.vue'
import ThemeToggle from './ThemeToggle.vue'
import UserChip from './UserChip.vue'

// Top bar for the signed-in app: same look as the landing page's, with the
// app sections as links and account / log out on the right.
defineEmits(['logout'])

const links = [
  { to: '/home', label: 'Home' },
  { to: '/groups', label: 'Groups' },
  { to: '/appliances', label: 'Appliances' },
  { to: '/invitations', label: 'Invitations' },
]
</script>

<template>
  <header class="app-topbar">
    <div class="inner">
      <router-link to="/" class="brand-link" title="About Humi">
        <BrandMark />
      </router-link>

      <nav class="links" aria-label="Main">
        <router-link v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</router-link>
      </nav>

      <div class="account">
        <ThemeToggle />
        <UserChip to="/account" title="Your account" />
        <button class="logout" title="Log out" aria-label="Log out" @click="$emit('logout')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 17l5-5-5-5M20 12H9" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 6%, transparent);
}
.inner {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 64px;
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
  margin-left: 12px;
}
.links a {
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.2s, background 0.2s;
}
.links a:hover {
  color: var(--text);
}
.links a.router-link-active {
  color: var(--text);
  background: color-mix(in srgb, var(--ink) 7%, transparent);
}

.account {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}
.logout {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid transparent;
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
}
.logout:hover {
  color: var(--danger-ink);
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  border-color: color-mix(in srgb, var(--danger) 30%, transparent);
}
.logout:focus-visible {
  outline: 2px solid var(--danger);
  outline-offset: 2px;
}
.logout svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Narrow screens: the section links drop to a second, scrollable row. */
@media (max-width: 760px) {
  .inner {
    flex-wrap: wrap;
    gap: 0 12px;
    padding: 0 16px;
  }
  .brand-link {
    height: 60px;
    display: flex;
    align-items: center;
  }
  .links {
    order: 3;
    width: 100%;
    margin: 0 -16px;
    padding: 0 16px 10px;
    overflow-x: auto;
    scrollbar-width: none;
  }
}
</style>
