import { onMounted, onBeforeUnmount } from 'vue'

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const easeOut = t => 1 - Math.pow(1 - t, 3)
const easeIn = t => t * t * t
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const FORWARD_MS = 1900
const REVERSE_MS = 1400
// After jumping to the next section, keep swallowing wheel/touch input for a
// moment so trackpad momentum doesn't carry straight on to the next slide.
const MOMENTUM_GUARD_MS = 600

// useHeroIntro plays the "step through the front door" transition from the
// hero into `nextId` as a timed animation rather than tying it to the scroll
// position: the browser's snap glide is far too quick for it. The first
// scroll down at the top of the page (wheel, swipe or key) is intercepted,
// the intro plays (copy out, door opens, zoom through it, fade to the
// interior colour), and only then does the page jump - invisibly, since the
// screen is a solid colour by then - to the next section. Scrolling back up
// into the hero plays it in reverse.
//
// It drives --cue, --copy, --open, --zoom and --fade on the hero element.
// Returns stepInside() for buttons that should play the same transition, and
// handleWheel() for useSlideScroll's intercept hook (wheel input is routed
// through there so the two don't both react to the same gesture).
export function useHeroIntro(heroRef, nextId) {
  let progress = 0 // 0 = outside the house, 1 = through the door
  let frame = null
  let lockUntil = 0
  let touchStartY = null
  let reduced = false

  function render(t) {
    const el = heroRef.value
    if (!el) return
    const seg = (a, b) => clamp((t - a) / (b - a))
    el.style.setProperty('--cue', easeOut(seg(0, 0.15)).toFixed(4))
    el.style.setProperty('--copy', easeOut(seg(0, 0.32)).toFixed(4))
    el.style.setProperty('--open', easeInOut(seg(0.1, 0.42)).toFixed(4))
    el.style.setProperty('--zoom', easeIn(seg(0.3, 0.92)).toFixed(4))
    el.style.setProperty('--fade', seg(0.8, 1).toFixed(4))
  }

  function play(to, duration, done) {
    if (frame !== null) cancelAnimationFrame(frame)
    const from = progress
    const total = reduced ? 1 : Math.abs(to - from) * duration
    let start = null
    const step = (now) => {
      if (start === null) start = now
      const k = total ? Math.min(1, (now - start) / total) : 1
      progress = from + (to - from) * k
      render(progress)
      if (k < 1) {
        frame = requestAnimationFrame(step)
      } else {
        frame = null
        done?.()
      }
    }
    frame = requestAnimationFrame(step)
  }

  const playing = () => frame !== null
  const locked = () => playing() || performance.now() < lockUntil
  const atStart = () => window.scrollY < 4 && progress === 0

  function stepInside() {
    if (playing()) return
    const next = document.getElementById(nextId)
    if (!next) return
    play(1, FORWARD_MS, () => {
      window.scrollTo({ top: next.offsetTop, behavior: 'instant' })
      lockUntil = performance.now() + MOMENTUM_GUARD_MS
    })
  }

  // Claims the wheel gesture while the intro is playing (or just finished),
  // and starts it on the first scroll down from the top.
  function handleWheel(e, direction) {
    if (locked()) return true
    if (direction > 0 && atStart()) {
      stepInside()
      return true
    }
    return false
  }

  function onTouchStart(e) {
    touchStartY = e.touches[0]?.clientY ?? null
  }

  function onTouchMove(e) {
    if (locked()) {
      e.preventDefault()
    } else if (touchStartY !== null && touchStartY - e.touches[0].clientY > 8 && atStart()) {
      e.preventDefault()
      stepInside()
    }
  }

  function onKeyDown(e) {
    const scrollKeys = ['ArrowDown', 'PageDown', ' ']
    if (!scrollKeys.includes(e.key) || e.target !== document.body) return
    if (locked()) {
      e.preventDefault()
    } else if (atStart()) {
      e.preventDefault()
      stepInside()
    }
  }

  // Coming back up: once the hero is in view again, walk back out the door.
  function onScroll() {
    const el = heroRef.value
    if (!el || playing() || progress === 0) return
    if (window.scrollY < el.offsetHeight - 2) play(0, REVERSE_MS)
  }

  onMounted(() => {
    reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    render(0)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onBeforeUnmount(() => {
    if (frame !== null) cancelAnimationFrame(frame)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('scroll', onScroll)
  })

  return { stepInside, handleWheel }
}
