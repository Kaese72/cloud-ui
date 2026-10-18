<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuth } from './composables/useAuth.js'
import { useCurrentUser } from './composables/useCurrentUser.js'
import { vReveal } from './landing/reveal.js'
import { useHeroIntro } from './landing/useHeroIntro.js'
import { useSlideScroll } from './landing/useSlideScroll.js'
import TopBar from './landing/TopBar.vue'
import ApplianceScene from './landing/ApplianceScene.vue'
import CloudScene from './landing/CloudScene.vue'
import HumiH from './components/HumiH.vue'

const { isAuthenticated } = useAuth()
const { user } = useCurrentUser()

const navLinks = [
  { id: 'appliance', label: 'Appliance' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'layers', label: 'What you get' },
]

const root = ref(null)
const hero = ref(null)
const { stepInside, handleWheel } = useHeroIntro(hero, 'appliance')
useSlideScroll(root, { intercept: handleWheel })

const welcomeLetters = 'Welcome'.split('')

// Fixed pseudo-random layout so the fireflies don't jump around between renders.
let seed = 7
const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
const fireflies = Array.from({ length: 22 }, () => ({
  left: `${rand() * 100}%`,
  top: `${30 + rand() * 65}%`,
  size: `${2 + rand() * 3}px`,
  duration: `${6 + rand() * 8}s`,
  delay: `${-rand() * 10}s`,
  drift: `${(rand() - 0.5) * 80}px`,
}))

const homeFeatures = [
  { title: 'Local control', body: 'Lights, plugs and sensors are controlled over your own network.' },
  { title: 'Automations', body: 'Rules are evaluated on the Appliance, so they react instantly.' },
  { title: 'Works offline', body: 'If the internet goes down, your home carries on as normal.' },
  { title: 'Your data, your house', body: 'Readings and history stay on the Appliance.' },
]
const cloudFeatures = [
  { title: 'Remote access', body: 'Reach your home from anywhere through a private, encrypted tunnel.' },
  { title: 'One login', body: 'Sign in to your Appliances with your Humi Cloud account.' },
  { title: 'Share with your household', body: 'Invite the people you live with, as owners, admins or members.' },
  { title: 'Every home in one place', body: 'Cabin, apartment, office. All your Appliances side by side.' },
]

const firstName = computed(() => user.value?.name || '')

onMounted(() => document.documentElement.classList.add('landing-page'))
onBeforeUnmount(() => document.documentElement.classList.remove('landing-page'))
</script>

<template>
  <div ref="root" class="landing">
    <TopBar :links="navLinks" />

    <!-- ===== Hero ===== -->
    <section ref="hero" id="top" class="hero">
      <!-- A 1px anchor rather than snapping the section itself: a snap area
           taller than the viewport lets the browser scroll freely inside it. -->
      <span class="snap" aria-hidden="true" />
      <div class="hero-stage">
        <div class="fireflies" aria-hidden="true">
          <span
            v-for="(f, i) in fireflies"
            :key="i"
            :style="{ left: f.left, top: f.top, width: f.size, height: f.size, '--duration': f.duration, '--delay': f.delay, '--drift': f.drift }"
          />
        </div>

        <div class="hero-copy">
          <h1 class="headline">
            <span class="welcome" aria-label="Welcome">
              <span
                v-for="(letter, i) in welcomeLetters"
                :key="i"
                class="letter"
                :style="{ '--i': i }"
                aria-hidden="true"
              >{{ letter }}</span>
            </span>
            <span class="humi" aria-label="Humi."><HumiH /><span aria-hidden="true">umi.</span></span>
          </h1>
          <p class="eyebrow">Home automation that stays at home</p>
          <div class="hero-actions">
            <button class="btn btn-warm" @click="stepInside">Step inside</button>
            <router-link v-if="isAuthenticated" to="/home" class="btn btn-ghost">Open dashboard</router-link>
            <router-link v-else to="/register" class="btn btn-ghost">Create an account</router-link>
          </div>
        </div>

        <div class="house-wrap" aria-hidden="true">
          <svg class="house" viewBox="0 0 400 320">
            <defs>
              <linearGradient id="doorLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffe6b3" />
                <stop offset="1" stop-color="#ffb547" />
              </linearGradient>
              <radialGradient id="groundGlow">
                <stop offset="0" style="stop-color: var(--warm)" stop-opacity="0.35" />
                <stop offset="1" style="stop-color: var(--warm)" stop-opacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="200" cy="302" rx="190" ry="22" fill="url(#groundGlow)" />
            <path class="house-body" d="M70 150 L200 48 L330 150 V300 H70 Z" />
            <path class="house-line" pathLength="1" d="M70 150 L200 48 L330 150 V300 H70 Z" />
            <path class="house-line chimney" pathLength="1" d="M262 97 V64 H286 V116" />
            <g class="win win-1">
              <rect x="98" y="180" width="56" height="46" rx="5" />
              <path d="M126 180 V226 M98 203 H154" />
            </g>
            <g class="win win-2">
              <rect x="246" y="180" width="56" height="46" rx="5" />
              <path d="M274 180 V226 M246 203 H302" />
            </g>
            <rect class="doorway" x="177" y="222" width="46" height="78" rx="3" fill="url(#doorLight)" />
            <g class="door">
              <rect x="177" y="222" width="46" height="78" rx="3" />
              <!-- The Humi H (HumiH.vue's proportions at 28px): the font's H
                   with the roof and lit dot over it. -->
              <g class="door-mark">
                <text x="200" y="262" text-anchor="middle">H</text>
                <polyline points="186.5,238.2 200,229.5 213.5,238.2" />
                <circle cx="200" cy="236.6" r="1.7" />
              </g>
              <circle cx="217" cy="270" r="2.5" />
            </g>
          </svg>
        </div>

        <div class="cue-wrap">
          <button class="scroll-cue" @click="stepInside">
            <span class="mouse"><span class="wheel" /></span>
            Scroll to step inside
          </button>
        </div>

        <div class="hero-fade" aria-hidden="true" />
      </div>
    </section>

    <!-- ===== Scenes ===== -->
    <ApplianceScene />
    <CloudScene />

    <!-- ===== Two layers ===== -->
    <section id="layers" class="layers">
      <div class="layers-head">
        <h2 v-reveal>Two layers. One home.</h2>
        <p v-reveal style="--delay: 100ms">
          The Appliance does the essential work. The Cloud adds reach. You decide where the line goes.
        </p>
      </div>
      <div class="layer-grid">
        <article class="layer layer-home" v-reveal>
          <header>
            <span class="badge badge-home">Always</span>
            <h3>At home, on the Appliance</h3>
          </header>
          <ul>
            <li v-for="(f, i) in homeFeatures" :key="f.title" v-reveal :style="{ '--delay': `${150 + i * 90}ms` }">
              <span class="tick">✓</span>
              <div><strong>{{ f.title }}</strong><span>{{ f.body }}</span></div>
            </li>
          </ul>
        </article>
        <article class="layer layer-cloud" v-reveal style="--delay: 120ms">
          <header>
            <span class="badge badge-cloud">Optional</span>
            <h3>With Humi Cloud</h3>
          </header>
          <ul>
            <li v-for="(f, i) in cloudFeatures" :key="f.title" v-reveal :style="{ '--delay': `${270 + i * 90}ms` }">
              <span class="tick">+</span>
              <div><strong>{{ f.title }}</strong><span>{{ f.body }}</span></div>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <!-- ===== Call to action ===== -->
    <div class="finale">
    <section class="cta">
      <div class="cta-glow" aria-hidden="true" />
      <template v-if="isAuthenticated">
        <h2 v-reveal>Welcome home<span v-if="firstName">, {{ firstName }}</span>.</h2>
        <p v-reveal style="--delay: 100ms">Your Appliances are waiting where you left them.</p>
        <div class="cta-actions" v-reveal style="--delay: 200ms">
          <router-link to="/home" class="btn btn-warm btn-lg">Open your dashboard</router-link>
        </div>
      </template>
      <template v-else>
        <h2 v-reveal>Welcome <span class="humi">Humi.</span></h2>
        <p v-reveal style="--delay: 100ms">Already have an Appliance? Connect it to the Cloud in a minute.</p>
        <div class="cta-actions" v-reveal style="--delay: 200ms">
          <router-link to="/login" class="btn btn-warm btn-lg">Log in</router-link>
          <router-link to="/register" class="btn btn-ghost btn-lg">Create an account</router-link>
        </div>
      </template>
    </section>

    <footer class="footer">
      <span class="footer-brand">Humi</span>
      <!-- The top bar's Docs link is hidden on phones; this one isn't. -->
      <a href="/docs/" class="footer-link">Documentation</a>
      <span>Made to stay at home.</span>
    </footer>
    </div>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: clip;
}

/* ---------- buttons ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 26px;
  border-radius: 999px;
  border: 1px solid transparent;
  font: inherit;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.25s, background 0.2s, border-color 0.2s;
}
.btn:hover {
  transform: translateY(-2px);
}
.btn-warm {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  box-shadow: 0 8px 30px color-mix(in srgb, var(--btn-primary-glow) 25%, transparent);
}
.btn-warm:hover {
  box-shadow: 0 12px 40px color-mix(in srgb, var(--btn-primary-glow) 45%, transparent);
}
.btn-ghost {
  background: color-mix(in srgb, var(--ink) 4%, transparent);
  border-color: color-mix(in srgb, var(--ink) 16%, transparent);
  color: var(--text);
}
.btn-ghost:hover {
  border-color: color-mix(in srgb, var(--ink) 35%, transparent);
  background: color-mix(in srgb, var(--ink) 8%, transparent);
}
.btn-lg {
  padding: 15px 32px;
  font-size: 1.05rem;
}

/* ---------- hero ---------- */
.hero {
  --cue: 0; --copy: 0; --open: 0; --zoom: 0; --fade: 0;
  position: relative;
  height: 100vh;
  background:
    radial-gradient(ellipse 80% 50% at 50% 100%, color-mix(in srgb, var(--warm-deep) 16%, transparent), transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--green) 6%, transparent), transparent 70%),
    var(--bg);
}
.snap {
  position: absolute;
  top: 0;
  left: 0;
  height: 1px;
  scroll-snap-align: start;
}
.hero-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr auto;
  justify-items: center;
}

.fireflies {
  position: absolute;
  inset: 0;
  opacity: calc((1 - var(--zoom) * 2) * var(--ambient));
  pointer-events: none;
}
.fireflies span {
  position: absolute;
  border-radius: 50%;
  background: var(--warm-light);
  box-shadow: 0 0 10px 2px color-mix(in srgb, var(--warm) 70%, transparent);
  animation: firefly var(--duration) ease-in-out var(--delay) infinite;
}

.hero-copy {
  align-self: center;
  padding: 96px 24px 0;
  text-align: center;
  opacity: calc(1 - var(--copy));
  transform: translateY(calc(var(--copy) * -90px)) scale(calc(1 - var(--copy) * 0.08));
  filter: blur(calc(var(--copy) * 8px));
}
.eyebrow {
  margin: 28px 0 0;
  color: var(--warm-ink);
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.8rem;
  animation: rise 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.9s both;
}
.headline {
  margin: 0;
  font-size: clamp(3.4rem, 11vw, 9.5rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.055em;
}
.welcome {
  display: inline-block;
  margin-right: 0.18em;
}
.letter {
  display: inline-block;
  animation: letter-in 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: calc(150ms + var(--i) * 55ms);
}
.humi {
  display: inline-block;
  background: var(--humi-gradient);
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding-right: 0.05em;
}
.hero .humi {
  animation:
    letter-in 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s both,
    shimmer 8s linear 1.6s infinite;
}
/* The roof rises about 0.35em above the headline's tight line box; the
   padding makes room for it above the headline and, when the headline wraps
   on narrow screens, under "Welcome". */
.hero .humi {
  --humi-ls: -0.055em;
  padding-top: 0.4em;
}
/* The H takes the gradient like the other letters, but the gradient only
   clips to text, so the roof is drawn in solid amber - lit like the house
   below it. */
.hero .humi :deep(.roof) {
  color: var(--warm);
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--warm) 45%, transparent));
}
.hero .humi :deep(.dot) {
  background: var(--warm-light);
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
  animation: rise 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 1.1s both;
}

.house-wrap {
  align-self: end;
  width: min(400px, 72vw, 40vh);
  margin-bottom: 9vh;
}
.house {
  display: block;
  width: 100%;
  overflow: visible;
  transform-origin: 50% 81.6%;
  transform: scale(calc(1 + var(--zoom) * 40));
}
.house-body {
  fill: var(--surface);
  animation: fade-in 1.2s ease 0.6s both;
}
.house-line {
  fill: none;
  stroke: var(--warm);
  stroke-width: 3;
  stroke-linejoin: round;
  stroke-linecap: round;
  stroke-dasharray: 1;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--warm) 55%, transparent));
  animation: draw 1.8s cubic-bezier(0.6, 0, 0.3, 1) 0.3s both;
}
.chimney {
  animation-delay: 1.6s;
  animation-duration: 0.6s;
}
.win rect {
  fill: var(--warm);
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--warm) 90%, transparent));
}
.win path {
  stroke: var(--surface);
  stroke-width: 3;
}
.win {
  animation: light-on 0.7s steps(1) both;
}
.win-1 { animation-delay: 2s; }
.win-2 { animation-delay: 2.45s; }
.doorway {
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--warm) calc((0.2 + var(--open) * 0.8) * 100%), transparent));
}
.door {
  transform-box: fill-box;
  transform-origin: left center;
  transform: scaleX(calc(1 - var(--open) * 0.82));
}
.door rect {
  fill: var(--door);
  stroke: var(--warm);
  stroke-width: 2;
}
.door circle {
  fill: var(--warm);
}
.door-mark {
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--warm) 90%, transparent));
  animation: fade-in 0.8s ease 2.9s both;
}
.door-mark text {
  fill: var(--warm);
  font-size: 28px;
  font-weight: 800;
}
.door-mark polyline {
  fill: none;
  stroke: var(--warm);
  stroke-width: 3.9;
}
.door-mark circle {
  fill: var(--warm-light);
}

/* The wrapper carries the scroll-driven fade; the button's own entry
   animation would otherwise pin its opacity at 1. */
.cue-wrap {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  opacity: calc(1 - var(--cue));
}
.scroll-cue {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  color: var(--muted);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  animation: fade-in 1s ease 2.8s both;
}
.mouse {
  position: relative;
  width: 18px;
  height: 28px;
  border: 2px solid color-mix(in srgb, var(--ink) 30%, transparent);
  border-radius: 10px;
  box-sizing: border-box;
}
.wheel {
  position: absolute;
  left: 50%;
  top: 5px;
  width: 3px;
  height: 6px;
  margin-left: -1.5px;
  border-radius: 2px;
  background: var(--warm);
  animation: wheel 1.6s ease-in-out infinite;
}

.hero-fade {
  position: absolute;
  inset: 0;
  background: var(--interior);
  opacity: var(--fade);
  pointer-events: none;
}

/* ---------- layers ---------- */
/* Like every other slide, the last two fill exactly one screen: a shorter
   tail would make the final wheel step a small nudge to the page bottom. */
.layers {
  scroll-snap-align: start;
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 1100px;
  margin: 0 auto;
  padding: 88px 24px 40px;
}
.layers-head {
  text-align: center;
  margin-bottom: 44px;
}
.layers-head h2 {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  letter-spacing: -0.04em;
}
.layers-head p {
  max-width: 44ch;
  margin: 18px auto 0;
  color: var(--muted);
  font-size: 1.15rem;
  line-height: 1.6;
}
.layer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.layer {
  position: relative;
  padding: 30px 34px;
  border-radius: 28px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--ink) 4%, transparent), color-mix(in srgb, var(--ink) 1%, transparent));
  border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
  overflow: hidden;
}
.layer::before {
  content: '';
  position: absolute;
  inset: -40% -20% auto;
  height: 70%;
  pointer-events: none;
}
.layer-home::before {
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--warm) 14%, transparent), transparent 65%);
}
.layer-cloud {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--cloud) 25%, transparent);
}
.layer-cloud::before {
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--cloud) 12%, transparent), transparent 65%);
}
.layer header {
  position: relative;
  margin-bottom: 24px;
}
.layer h3 {
  margin: 14px 0 0;
  font-size: 1.6rem;
  letter-spacing: -0.03em;
}
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.badge-home {
  background: color-mix(in srgb, var(--warm) 15%, transparent);
  color: var(--warm-ink);
}
.badge-cloud {
  border: 1px dashed color-mix(in srgb, var(--cloud) 50%, transparent);
  color: var(--cloud-ink);
}
.layer ul {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}
.layer li {
  display: flex;
  gap: 14px;
}
.layer li strong {
  display: block;
  margin-bottom: 3px;
  font-size: 1.05rem;
}
.layer li span {
  color: var(--muted);
  line-height: 1.5;
}
.tick {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
}
.layer-home .tick {
  background: color-mix(in srgb, var(--warm) 15%, transparent);
  color: var(--warm-ink) !important;
}
.layer-cloud .tick {
  background: color-mix(in srgb, var(--cloud) 12%, transparent);
  color: var(--cloud-ink) !important;
}

/* ---------- cta ---------- */
.finale {
  scroll-snap-align: start;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.cta {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  padding: 100px 24px;
  text-align: center;
  overflow: hidden;
}
.cta-glow {
  position: absolute;
  left: 50%;
  bottom: -40%;
  width: 900px;
  height: 600px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--warm-deep) 22%, transparent), transparent 65%);
  pointer-events: none;
  animation: glow 6s ease-in-out infinite;
}
.cta h2 {
  position: relative;
  margin: 0;
  font-size: clamp(2.8rem, 8vw, 6rem);
  letter-spacing: -0.05em;
  line-height: 1;
}
.cta .humi {
  animation: shimmer 8s linear infinite;
}
.cta p {
  position: relative;
  margin: 20px auto 0;
  color: var(--muted);
  font-size: 1.15rem;
}
.cta-actions {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 36px;
}

.footer {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  justify-content: space-between;
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 24px 40px;
  border-top: 1px solid color-mix(in srgb, var(--ink) 6%, transparent);
  color: var(--faint);
  font-size: 0.9rem;
}
.footer-brand {
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--muted);
}
.footer-link {
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
}
.footer-link:hover {
  color: var(--text);
}

/* ---------- reveal (v-reveal) ---------- */
.reveal {
  opacity: 0;
  transform: translateY(36px);
  transition:
    opacity 0.8s ease var(--delay, 0ms),
    transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) var(--delay, 0ms);
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}

/* ---------- keyframes ---------- */
@keyframes letter-in {
  from { opacity: 0; transform: translateY(0.5em) rotate(8deg); filter: blur(8px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes rise {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: none; }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
@keyframes light-on {
  0% { opacity: 0.08; }
  30% { opacity: 1; }
  45% { opacity: 0.3; }
  60%, 100% { opacity: 1; }
}
@keyframes shimmer {
  from { background-position: 0% 0; }
  to { background-position: 250% 0; }
}
@keyframes firefly {
  0%, 100% { transform: translate(0, 0); opacity: 0; }
  20% { opacity: 1; }
  50% { transform: translate(var(--drift), -40px); opacity: 0.6; }
  80% { opacity: 1; }
}
@keyframes wheel {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(9px); opacity: 0; }
}
@keyframes glow {
  0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.08); }
}

@media (max-width: 760px) {
  .layer-grid {
    grid-template-columns: 1fr;
  }
  .layer {
    padding: 28px 22px;
  }
  .layers {
    padding-top: 88px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .letter, .humi, .eyebrow, .hero-actions, .house-line, .house-body, .win, .scroll-cue,
  .fireflies span, .wheel, .cta-glow, .cta .humi, .door-mark {
    animation: none !important;
  }
  /* Skip the zoom-through-the-door; the fade still hands over to the next section. */
  .house {
    transform: none;
  }
  .reveal {
    transform: none;
    transition: opacity 0.3s ease;
  }
}
</style>

<style>
/* Each slide of the landing page is a snap point, so one wheel notch or swipe
   glides to the next slide instead of nudging the animation along. */
html.landing-page {
  scroll-snap-type: y mandatory;
  background: var(--bg);
  color-scheme: var(--scheme);
}
</style>
