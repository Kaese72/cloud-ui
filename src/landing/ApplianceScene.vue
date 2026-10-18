<script setup>
import { ref } from 'vue'
import { useScrollScene } from '../composables/useScrollScene.js'

const section = ref(null)
const step = ref(0)

const steps = [
  {
    title: 'Meet the Appliance.',
    body: 'A small box that lives in your space. Plug it in, and it becomes the quiet heart of your home.',
  },
  {
    title: 'It speaks your devices’ language.',
    body: 'Philips Hue, IKEA Dirigera and more. The Appliance talks to your lights, plugs and sensors directly, over your own network.',
  },
  {
    title: 'Rules that run at home.',
    body: 'Lights on when someone walks into the hallway. Everything dimmed at bedtime. Automations run on the Appliance, so they react instantly and keep working when the internet doesn’t.',
  },
  {
    title: 'What happens at home, stays home.',
    body: 'Every reading, every switch, every rule lives on the Appliance. Nothing gets shipped off anywhere, and you don’t need an account to use it.',
  },
]

// Positions are in the 600×600 viewBox; the appliance sits at (300, 400).
// fx/fy is where each device flies in from, relative to its resting place.
const devices = [
  { kind: 'bulb', label: 'Lights', x: 140, y: 290, phase: 'dev1', fx: '-34cqw', fy: '-30cqw',
    icon: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z' },
  { kind: 'plug', label: 'Plugs', x: 460, y: 290, phase: 'dev2', fx: '34cqw', fy: '-30cqw',
    icon: 'M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0V7zM12 17v5' },
  { kind: 'sensor', label: 'Sensors', x: 140, y: 480, phase: 'dev3', fx: '-34cqw', fy: '30cqw',
    icon: 'M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0zM12 9v7' },
  { kind: 'blinds', label: 'Blinds', x: 460, y: 480, phase: 'dev4', fx: '34cqw', fy: '30cqw',
    icon: 'M3 3h18M5 3v13M19 3v13M5 7h14M5 11h14M5 15h14M12 16v5' },
]

// Data pulses: sensor readings travel in (green), commands travel out (amber).
const pulses = [
  { path: 'M140 480 L300 400', dir: 'in', begin: '0s' },
  { path: 'M460 290 L300 400', dir: 'in', begin: '0.7s' },
  { path: 'M140 290 L300 400', dir: 'in', begin: '1.3s' },
  { path: 'M300 400 L140 290', dir: 'out', begin: '0.4s' },
  { path: 'M300 400 L460 480', dir: 'out', begin: '1s' },
  { path: 'M300 400 L460 290', dir: 'out', begin: '1.6s' },
]

// One slide per step: the section is (steps) viewports tall, so its sticky
// travel is (steps - 1) viewports and slide k sits at p = k / (steps - 1).
// Each slide's animations trigger halfway through the glide towards it.
const last = steps.length - 1
const slideAt = k => (k - 0.5) / last

useScrollScene(section, {
  rise: { at: -0.25, duration: 1100 },
  dev1: { at: slideAt(1), duration: 900, delay: 0 },
  dev2: { at: slideAt(1), duration: 900, delay: 120 },
  dev3: { at: slideAt(1), duration: 900, delay: 240 },
  dev4: { at: slideAt(1), duration: 900, delay: 360 },
  pulse: { at: slideAt(2), duration: 700 },
  rules: { at: slideAt(2), duration: 900, delay: 350 },
  walls: { at: slideAt(3), duration: 1500, delay: 100 },
  lock: { at: slideAt(3), duration: 700, delay: 1100 },
}, (p) => {
  step.value = Math.max(0, Math.min(last, Math.round(p * last)))
})
</script>

<template>
  <section ref="section" id="appliance" class="scene" :style="{ '--slides': steps.length }">
    <span v-for="(s, i) in steps" :key="i" class="snap" :style="{ top: `${i * 100}vh` }" aria-hidden="true" />
    <div class="stage">
      <div class="copy">
        <p class="kicker"><span class="num">01</span> The Appliance</p>
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
        <div class="dots" aria-hidden="true">
          <span v-for="(s, i) in steps" :key="i" :class="{ on: i <= step }" />
        </div>
      </div>

      <div class="visual" aria-hidden="true">
        <svg class="layer" viewBox="0 0 600 600">
          <defs>
            <linearGradient id="wallFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color: var(--warm)" stop-opacity="0.10" />
              <stop offset="1" style="stop-color: var(--warm)" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <path class="walls-fill" d="M300 40 L570 240 V575 H30 V240 Z" fill="url(#wallFill)" />
          <path class="walls" pathLength="1" d="M300 40 L570 240 V575 H30 V240 Z" />
          <path
            v-for="d in devices"
            :key="d.kind"
            class="wire"
            pathLength="1"
            :d="`M${d.x} ${d.y} L300 400`"
            :style="{ '--d': `var(--${d.phase})` }"
          />
          <g class="pulses">
            <circle v-for="(pulse, i) in pulses" :key="i" r="5" :class="pulse.dir">
              <animateMotion :path="pulse.path" dur="2s" :begin="pulse.begin" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        <div
          v-for="d in devices"
          :key="d.kind"
          class="device"
          :class="d.kind"
          :style="{ left: `${d.x / 6}%`, top: `${d.y / 6}%`, '--d': `var(--${d.phase})`, '--fx': d.fx, '--fy': d.fy }"
        >
          <span class="icon">
            <svg viewBox="0 0 24 24"><path :d="d.icon" /></svg>
          </span>
          <span class="label">{{ d.label }}</span>
        </div>

        <div class="rule-chip">
          <span class="if">When</span> hallway motion
          <span class="then">→</span> lights on
        </div>

        <div class="lock-pill">
          <svg viewBox="0 0 24 24"><path d="M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></svg>
          Stays in your home
        </div>

        <div class="appliance">
          <span class="led" />
          <span class="wordmark">Humi</span>
          <span class="grille"><i /><i /><i /></span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scene {
  --rise: 0; --dev1: 0; --dev2: 0; --dev3: 0; --dev4: 0;
  --pulse: 0; --rules: 0; --walls: 0; --lock: 0;
  position: relative;
  height: calc(var(--slides) * 100vh);
  background:
    radial-gradient(ellipse 60% 50% at 70% 60%, color-mix(in srgb, var(--warm) calc((0.05 + var(--walls) * 0.07) * 100%), transparent), transparent 70%),
    var(--interior);
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
  color: var(--warm-ink);
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
  border: 1px solid color-mix(in srgb, var(--warm) 40%, transparent);
  font-size: 0.75rem;
  letter-spacing: 0;
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
.dots {
  display: flex;
  gap: 8px;
  margin-top: 32px;
}
.dots span {
  width: 28px;
  height: 3px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--ink) 12%, transparent);
  transition: background 0.6s ease 0.2s;
}
.dots span.on {
  background: var(--warm);
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
.walls {
  fill: none;
  stroke: var(--warm);
  stroke-width: 2.5;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: calc(1 - var(--walls));
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--warm) 60%, transparent));
  opacity: calc(var(--walls) * 10);
}
.walls-fill {
  opacity: var(--walls);
}
.wire {
  fill: none;
  stroke: color-mix(in srgb, var(--green) 55%, transparent);
  stroke-width: 2;
  stroke-dasharray: 1;
  stroke-dashoffset: calc(1 - var(--d));
  stroke-linecap: round;
}
.pulses {
  opacity: var(--pulse);
}
.pulses circle.in {
  fill: var(--green);
  filter: drop-shadow(0 0 6px var(--green));
}
.pulses circle.out {
  fill: var(--warm);
  filter: drop-shadow(0 0 6px var(--warm));
}

.device {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6cqw;
  transform:
    translate(-50%, -50%)
    translate(calc((1 - var(--d)) * var(--fx)), calc((1 - var(--d)) * var(--fy)))
    scale(calc(0.4 + 0.6 * var(--d)))
    rotate(calc((1 - var(--d)) * 90deg));
  opacity: var(--d);
}
.icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 13cqw;
  height: 13cqw;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid color-mix(in srgb, var(--ink) 10%, transparent);
  box-shadow: 0 1.5cqw 4cqw color-mix(in srgb, var(--shadow-ink) 40%, transparent);
}
.icon svg {
  position: relative;
  z-index: 1;
  width: 48%;
  height: 48%;
  fill: none;
  stroke: var(--icon);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bulb .icon::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffd88f 0%, var(--warm-deep) 60%, #e38a1c 100%);
  box-shadow: 0 0 6cqw 1.5cqw color-mix(in srgb, var(--warm-deep) 55%, transparent);
  opacity: var(--rules);
}
.bulb .icon svg {
  stroke: color-mix(in srgb, #3a2405 calc(var(--rules) * 100%), var(--icon));
}
.label {
  font-size: 2.3cqw;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.appliance {
  position: absolute;
  left: 50%;
  top: 66.67%;
  width: 28cqw;
  height: 17cqw;
  border-radius: 4.5cqw;
  background: linear-gradient(160deg, #26364a, #141e2b 70%);
  border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--ink) 15%, transparent),
    0 3cqw 8cqw color-mix(in srgb, var(--shadow-ink) 50%, transparent),
    0 0 calc(4cqw + var(--pulse) * 8cqw) color-mix(in srgb, var(--green) calc((0.1 + var(--pulse) * 0.25) * 100%), transparent);
  transform:
    translate(-50%, -50%)
    translateY(calc((1 - var(--rise)) * 60cqw))
    rotate(calc((1 - var(--rise)) * -18deg))
    scale(calc(0.7 + 0.3 * var(--rise)));
  opacity: var(--rise);
}
.led {
  position: absolute;
  top: 2.6cqw;
  right: 2.8cqw;
  width: 1.6cqw;
  height: 1.6cqw;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 2cqw var(--green);
  animation: breathe 2.4s ease-in-out infinite;
}
.wordmark {
  position: absolute;
  left: 3cqw;
  bottom: 2.4cqw;
  font-size: 3.6cqw;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #f3efe8; /* printed on the device, which is dark in both themes */
  opacity: 0.85;
}
.grille {
  position: absolute;
  right: 3cqw;
  bottom: 3cqw;
  display: flex;
  gap: 0.8cqw;
}
.grille i {
  width: 0.7cqw;
  height: 4cqw;
  border-radius: 1cqw;
  background: color-mix(in srgb, var(--ink) 12%, transparent);
}

.rule-chip {
  position: absolute;
  left: 50%;
  top: 34%;
  white-space: nowrap;
  padding: 1.6cqw 2.8cqw;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--warm) 35%, transparent);
  color: var(--text);
  font-size: 2.5cqw;
  font-weight: 500;
  transform: translate(-50%, -50%) translateY(calc((1 - var(--rules)) * 5cqw)) scale(calc(0.85 + 0.15 * var(--rules)));
  opacity: var(--rules);
  box-shadow: 0 0 5cqw color-mix(in srgb, var(--warm) calc((var(--rules) * 0.2) * 100%), transparent);
}
.rule-chip .if {
  color: var(--green-ink);
  font-weight: 700;
  margin-right: 0.6cqw;
}
.rule-chip .then {
  color: var(--warm-ink);
  margin: 0 0.6cqw;
}

.lock-pill {
  position: absolute;
  left: 50%;
  top: 21%;
  display: flex;
  align-items: center;
  gap: 1.2cqw;
  white-space: nowrap;
  padding: 1.3cqw 2.6cqw;
  border-radius: 999px;
  background: var(--warm);
  color: var(--on-warm);
  font-size: 2.4cqw;
  font-weight: 700;
  transform: translate(-50%, -50%) scale(calc(0.6 + 0.4 * var(--lock)));
  opacity: var(--lock);
  box-shadow: 0 0 6cqw color-mix(in srgb, var(--warm) 45%, transparent);
}
.lock-pill svg {
  width: 2.8cqw;
  height: 2.8cqw;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linejoin: round;
}

@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
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
  .dots {
    margin-top: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .led { animation: none; }
  .step { transition: opacity 0.2s; transform: none !important; filter: none !important; }
}
</style>
