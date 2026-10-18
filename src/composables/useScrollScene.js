import { onMounted, onBeforeUnmount } from 'vue'

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))

const easings = {
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  linear: t => t,
}

// How quickly scrubbed progress catches up with the real scroll position.
// Higher = more glide. Framerate independent.
const SCRUB_SMOOTHING_MS = 110

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// useScrollScene drives a "pinned" scroll scene: a section taller than the
// viewport whose content is position: sticky. The section's progress p is 0
// when its top reaches the viewport top and 1 when its bottom reaches the
// viewport bottom (it goes negative while the section is still below).
//
// Each named phase is written to the section as a CSS variable (--name, 0..1)
// so the CSS can animate purely off custom properties. A phase is either:
//
//   [start, end, easing?]          scrubbed - follows scroll between start and
//                                  end, smoothed so wheel steps glide.
//   { at, duration, delay?, easing? }
//                                  triggered - once p passes `at` it plays from
//                                  0 to 1 over `duration` ms on its own (and
//                                  back, without the delay, when p drops below).
//
// onProgress(p) is called with the raw progress whenever it changes, for the
// few things that need reactive state (e.g. which text step is showing).
export function useScrollScene(elRef, phases = {}, onProgress) {
  const scrubbed = []
  const triggered = []
  for (const [name, def] of Object.entries(phases)) {
    if (Array.isArray(def)) {
      const [start, end, easing = 'out'] = def
      scrubbed.push({ name, start, end, easing })
    } else {
      triggered.push({ name, delay: 0, easing: 'inOut', ...def, value: 0, target: 0, tween: null })
    }
  }

  let frame = null
  let lastTime = null
  let rawP = 0
  let shownP = null
  let reduced = false

  function measure() {
    const el = elRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const travel = rect.height - window.innerHeight
    rawP = travel > 0 ? -rect.top / travel : (rect.top <= 0 ? 1 : 0)
    onProgress?.(rawP)
  }

  function tick(now) {
    frame = null
    const el = elRef.value
    if (!el) return
    const dt = lastTime === null ? 16 : Math.min(now - lastTime, 100)
    lastTime = now
    let busy = false

    // Scrubbed phases follow a smoothed copy of the progress.
    const p = clamp(rawP)
    if (shownP === null || reduced) shownP = p
    else shownP += (p - shownP) * (1 - Math.exp(-dt / SCRUB_SMOOTHING_MS))
    if (Math.abs(p - shownP) < 0.0005) shownP = p
    else busy = true
    el.style.setProperty('--p', shownP.toFixed(4))
    for (const s of scrubbed) {
      const t = clamp((shownP - s.start) / (s.end - s.start))
      el.style.setProperty(`--${s.name}`, easings[s.easing](t).toFixed(4))
    }

    // Triggered phases tween in time once their threshold is crossed.
    for (const t of triggered) {
      const target = rawP >= t.at ? 1 : 0
      if (target !== t.target) {
        t.target = target
        const duration = reduced ? 1 : (target ? t.duration : t.duration * 0.6)
        t.tween = { from: t.value, start: now + (target && !reduced ? t.delay : 0), duration }
      }
      if (t.tween) {
        const k = clamp((now - t.tween.start) / t.tween.duration)
        t.value = t.tween.from + (t.target - t.tween.from) * easings[t.easing](k)
        if (k >= 1) t.tween = null
        else busy = true
      }
      el.style.setProperty(`--${t.name}`, t.value.toFixed(4))
    }

    if (busy) schedule()
    else lastTime = null
  }

  function schedule() {
    if (frame === null) frame = requestAnimationFrame(tick)
  }

  function onScroll() {
    measure()
    schedule()
  }

  onMounted(() => {
    reduced = prefersReducedMotion()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    if (frame !== null) cancelAnimationFrame(frame)
  })
}
