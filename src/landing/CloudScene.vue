<script setup>
import { ref } from 'vue'
import { useScrollScene } from '../composables/useScrollScene.js'

const section = ref(null)
const step = ref(0)
const connected = ref(false)
// Until the visitor flips the switch themselves, scrolling drives it: it
// connects in the middle step and disconnects again in the last one, to show
// that home keeps working without the Cloud. Once touched, it's theirs.
const touched = ref(false)

const steps = [
  {
    title: 'Want more? Look up.',
    body: 'Humi Cloud is an optional companion to your Appliance. It adds conveniences. It never becomes something your home depends on.',
  },
  {
    title: 'One switch. Your call.',
    body: 'Connecting opens an encrypted tunnel, started from your Appliance and pointing outwards. Nothing gets into your home uninvited, and you can disconnect whenever you like.',
  },
  {
    title: 'Unplug, and nothing breaks.',
    body: 'Lights, sensors and rules keep running at home. The Cloud only ever adds things. It never takes over.',
  },
]

const features = [
  { label: 'Remote access', x: 16, y: 13, ox: '34cqw', oy: '10cqw' },
  { label: 'Cloud login', x: 84, y: 13, ox: '-34cqw', oy: '10cqw' },
  { label: 'Share with family', x: 18, y: 42, ox: '32cqw', oy: '-18cqw' },
  { label: 'All your homes', x: 82, y: 42, ox: '-32cqw', oy: '-18cqw' },
]

// One slide per step, as in ApplianceScene: slide k sits at p = k / last and
// its animations trigger halfway through the glide towards it.
const last = steps.length - 1

useScrollScene(section, {
  home: { at: -0.3, duration: 900 },
  sky: { at: -0.3, duration: 1200, delay: 250 }, // the cloud drifting in (not --cloud: that's the colour token)
  tunnel: { at: -0.3, duration: 800, delay: 900 },
  toggle: { at: -0.3, duration: 600, delay: 1200 },
}, (p) => {
  step.value = Math.max(0, Math.min(last, Math.round(p * last)))
  if (!touched.value) connected.value = step.value === 1
})

function toggle() {
  touched.value = true
  connected.value = !connected.value
}
</script>

<template>
  <section ref="section" id="cloud" class="scene" :class="{ connected }" :style="{ '--slides': steps.length }">
    <span v-for="(s, i) in steps" :key="i" class="snap" :style="{ top: `${i * 100}vh` }" aria-hidden="true" />
    <div class="stage">
      <div class="copy">
        <p class="kicker"><span class="num">02</span> The Cloud <span class="optional">optional</span></p>
        <div class="steps">
          <article
            v-for="(s, i) in steps"
            :key="i"
            class="step"
            :class="{ active: i === step, past: i < step }"
            :aria-hidden="i !== step"
          >
            <h2>{{ s.title }}</h2>
            <p>{{ s.body }}</p>
          </article>
        </div>
        <p class="hint" :class="{ show: step >= 1 }">
          <span class="hint-arrow">↗</span> Go on, flip the switch.
        </p>
      </div>

      <div class="visual">
        <svg class="layer" viewBox="0 0 600 600" aria-hidden="true">
          <defs>
            <linearGradient id="cloudFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color: var(--cloud-top)" />
              <stop offset="1" style="stop-color: var(--cloud-bottom)" />
            </linearGradient>
          </defs>

          <!-- tunnel -->
          <g class="tunnel-group">
            <path class="tunnel-base" d="M300 392 L300 212" />
            <path class="tunnel-flow" d="M300 392 L300 212" />
            <circle class="packet" r="4.5">
              <animateMotion path="M300 392 L300 212" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle class="packet down" r="4.5">
              <animateMotion path="M300 212 L300 392" dur="1.4s" begin="0.7s" repeatCount="indefinite" />
            </circle>
          </g>

          <!-- cloud -->
          <g class="cloud">
            <g class="cloud-shape">
              <circle cx="235" cy="150" r="48" />
              <circle cx="300" cy="118" r="64" />
              <circle cx="368" cy="152" r="46" />
              <rect x="190" y="140" width="222" height="68" rx="34" />
            </g>
            <text x="300" y="182" text-anchor="middle">Humi Cloud</text>
          </g>

          <!-- home -->
          <g class="home">
            <path class="home-glow" d="M300 392 L430 480 V570 H170 V480 Z" />
            <path class="home-walls" d="M300 392 L430 480 V570 H170 V480 Z" />
            <rect x="255" y="515" width="90" height="38" rx="11" class="mini-appliance" />
            <circle cx="331" cy="527" r="4" class="mini-led" />
            <rect x="196" y="500" width="30" height="24" rx="4" class="window" />
            <rect x="374" y="500" width="30" height="24" rx="4" class="window" />
          </g>
        </svg>

        <div
          v-for="(f, i) in features"
          :key="f.label"
          class="feature-chip"
          :style="{ left: `${f.x}%`, top: `${f.y}%`, '--ox': f.ox, '--oy': f.oy, '--i': i }"
        >{{ f.label }}</div>

        <button
          class="switch"
          role="switch"
          :aria-checked="connected"
          aria-label="Connect to Humi Cloud"
          @click="toggle"
        >
          <span class="track"><span class="thumb" /></span>
          <span class="switch-label">{{ connected ? 'Connected' : 'Off' }}</span>
        </button>

        <p class="home-status">
          <span class="check">✓</span> Home is running locally
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scene {
  --home: 0; --sky: 0; --tunnel: 0; --toggle: 0;
  position: relative;
  height: calc(var(--slides) * 100vh);
  background:
    radial-gradient(ellipse 70% 45% at 60% 15%, color-mix(in srgb, var(--cloud) 10%, transparent), transparent 70%),
    linear-gradient(180deg, var(--interior) 0%, var(--bg) 30%);
}
.stage {
  position: sticky;
  top: 0;
  height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: center;
  gap: 48px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 24px 0;
  box-sizing: border-box;
  overflow: hidden;
}

/* ---- copy ---- */
.kicker {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 20px;
  color: var(--cloud-ink);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.8rem;
}
.num {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--cloud) 40%, transparent);
  font-size: 0.75rem;
  letter-spacing: 0;
}
.optional {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px dashed color-mix(in srgb, var(--cloud) 50%, transparent);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}
.steps {
  display: grid;
}
.snap {
  position: absolute;
  left: 0;
  height: 1px;
  scroll-snap-align: start;
}
.step {
  grid-area: 1 / 1;
  opacity: 0;
  transform: translateY(40px);
  filter: blur(8px);
  transition: opacity 0.45s ease, transform 0.5s ease-in, filter 0.45s ease;
  pointer-events: none;
}
.step.past {
  transform: translateY(-32px);
}
.step.active {
  opacity: 1;
  transform: none;
  filter: none;
  pointer-events: auto;
  transition: opacity 0.9s ease 0.25s, transform 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.25s, filter 0.9s ease 0.25s;
}
.step h2 {
  margin: 0 0 16px;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.05;
  letter-spacing: -0.035em;
  color: var(--text);
}
.step p {
  margin: 0;
  max-width: 34ch;
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  line-height: 1.6;
  color: var(--muted);
}
.hint {
  margin: 28px 0 0;
  color: var(--cloud-ink);
  font-weight: 500;
  opacity: 0;
  transform: translateX(-12px);
  transition: opacity 0.5s, transform 0.5s;
}
.hint.show {
  opacity: 1;
  transform: none;
}
.hint-arrow {
  display: inline-block;
  animation: nudge 1.6s ease-in-out infinite;
}

/* ---- visual ---- */
.visual {
  position: relative;
  width: min(580px, 100%, 78vh);
  aspect-ratio: 1;
  justify-self: center;
  container-type: inline-size;
}
.layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.home {
  opacity: var(--home);
  transform: translateY(calc((1 - var(--home)) * 60px));
}
.home-walls {
  fill: none;
  stroke: var(--warm);
  stroke-width: 2.5;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--warm) 50%, transparent));
}
.home-glow {
  fill: color-mix(in srgb, var(--warm) 8%, transparent);
}
.mini-appliance {
  fill: #1d2a3a;
  stroke: color-mix(in srgb, var(--ink) 15%, transparent);
}
.mini-led {
  fill: var(--green);
  filter: drop-shadow(0 0 4px var(--green));
  animation: breathe 2.4s ease-in-out infinite;
}
.window {
  fill: var(--warm);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--warm) 80%, transparent));
}

.cloud {
  opacity: calc(var(--sky) * 0.55);
  transform: translateY(calc((1 - var(--sky)) * -180px));
  transition: opacity 0.9s ease;
}
.connected .cloud {
  opacity: var(--sky);
}
.cloud-shape {
  fill: url(#cloudFill);
  filter: var(--cloud-off-filter);
  transition: filter 1s ease;
}
.connected .cloud-shape {
  filter: drop-shadow(0 0 18px color-mix(in srgb, var(--cloud) 55%, transparent));
  animation: float 6s ease-in-out infinite;
}
.cloud text {
  fill: var(--cloud-label);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.tunnel-group {
  opacity: var(--tunnel);
}
.tunnel-base {
  stroke: var(--track);
  stroke-width: 3;
  stroke-dasharray: 4 10;
  stroke-linecap: round;
  transition: stroke 0.5s;
}
.tunnel-flow {
  stroke: var(--green);
  stroke-width: 3;
  stroke-dasharray: 14 10;
  stroke-linecap: round;
  opacity: 0;
  filter: drop-shadow(0 0 6px var(--green));
  transition: opacity 0.9s ease;
  animation: flow 0.8s linear infinite;
}
.connected .tunnel-flow {
  opacity: 1;
}
.packet {
  fill: #b9ffe0;
  opacity: 0;
  transition: opacity 0.4s;
}
.packet.down {
  fill: var(--warm);
}
.connected .packet {
  opacity: 1;
}

.feature-chip {
  position: absolute;
  white-space: nowrap;
  padding: 1.5cqw 2.8cqw;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--cloud) 40%, transparent);
  color: var(--text);
  font-size: 2.6cqw;
  font-weight: 600;
  box-shadow: 0 0 4cqw color-mix(in srgb, var(--cloud) 15%, transparent);
  transform: translate(-50%, -50%) translate(var(--ox), var(--oy)) scale(0.2);
  opacity: 0;
  transition:
    transform 0.7s cubic-bezier(0.5, 0, 0.75, 0),
    opacity 0.5s ease 0.15s;
  transition-delay: calc((3 - var(--i)) * 70ms);
  pointer-events: none;
}
.connected .feature-chip {
  transform: translate(-50%, -50%);
  opacity: 1;
  transition:
    transform 1s cubic-bezier(0.34, 1.4, 0.64, 1),
    opacity 0.6s ease;
  transition-delay: calc(400ms + var(--i) * 140ms);
}

.switch {
  position: absolute;
  left: 50%;
  top: 50.3%;
  display: flex;
  align-items: center;
  gap: 1.6cqw;
  padding: 1.2cqw 2.6cqw 1.2cqw 1.2cqw;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
  color: var(--muted);
  font: inherit;
  font-size: 2.6cqw;
  font-weight: 600;
  cursor: pointer;
  transform: translate(-50%, -50%) scale(calc(0.5 + 0.5 * var(--toggle)));
  opacity: var(--toggle);
  box-shadow: 0 2cqw 6cqw color-mix(in srgb, var(--shadow-ink) 50%, transparent);
  transition: border-color 0.4s, color 0.4s, box-shadow 0.4s;
}
.switch:hover {
  border-color: color-mix(in srgb, var(--cloud) 60%, transparent);
}
.switch:focus-visible {
  outline: 2px solid var(--cloud);
  outline-offset: 3px;
}
.connected .switch {
  color: var(--text);
  border-color: color-mix(in srgb, var(--green) 70%, transparent);
  box-shadow: 0 0 6cqw color-mix(in srgb, var(--green) 35%, transparent);
}
.track {
  position: relative;
  width: 8cqw;
  height: 4.4cqw;
  border-radius: 999px;
  background: var(--track);
  transition: background 0.35s;
}
.connected .track {
  background: var(--green);
}
.thumb {
  position: absolute;
  top: 0.5cqw;
  left: 0.5cqw;
  width: 3.4cqw;
  height: 3.4cqw;
  border-radius: 50%;
  background: #f8f7f4;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.connected .thumb {
  transform: translateX(3.6cqw);
}
.switch-label {
  min-width: 13cqw;
  text-align: left;
}

.home-status {
  position: absolute;
  left: 50%;
  top: 98%;
  margin: 0;
  white-space: nowrap;
  transform: translate(-50%, -50%);
  font-size: 2.5cqw;
  font-weight: 600;
  color: var(--warm-ink);
  opacity: var(--home);
}
.check {
  display: inline-grid;
  place-items: center;
  width: 3.4cqw;
  height: 3.4cqw;
  margin-right: 0.8cqw;
  border-radius: 50%;
  background: color-mix(in srgb, var(--warm) 15%, transparent);
  font-size: 2cqw;
}
.scene:not(.connected) .home-status {
  animation: reassure 2.4s ease-in-out infinite;
}

@keyframes flow {
  to { stroke-dashoffset: -24; }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
@keyframes nudge {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(3px, -3px); }
}
@keyframes reassure {
  0%, 100% { text-shadow: none; }
  50% { text-shadow: 0 0 12px color-mix(in srgb, var(--warm) 70%, transparent); }
}

@media (max-width: 860px) {
  .stage {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    align-content: center;
    gap: 16px;
    padding-top: 72px;
  }
  .visual {
    order: -1;
    width: min(100%, 52vh);
  }
  .step h2 {
    font-size: clamp(1.6rem, 7vw, 2.2rem);
  }
  .hint {
    margin-top: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mini-led, .tunnel-flow, .connected .cloud-shape, .hint-arrow, .scene:not(.connected) .home-status {
    animation: none;
  }
  .step { transition: opacity 0.2s; transform: none !important; filter: none !important; }
}
</style>
