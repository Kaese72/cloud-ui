import { onMounted, onBeforeUnmount } from 'vue'

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const easeOut = t => 1 - Math.pow(1 - t, 3)
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const FORWARD_MS = 900
const REVERSE_MS = 800
// After gliding to the next section, keep swallowing wheel/touch input for a
// moment so trackpad momentum doesn't carry straight on to the next slide.
const MOMENTUM_GUARD_MS = 600

// useHeroIntro plays the "open the front door" intro before leaving the hero
// for `nextId`. The first scroll down at the top of the page (wheel, swipe or
// key) is intercepted, the copy fades out and the door swings open, and then
// the page glides down to the next section with glideTo - the same glide as
// every other slide. Scrolling back up into the hero closes the door again.
//
// It drives --cue, --copy and --open on the hero element.
// Returns stepInside() for buttons that should play the same transition, and
// handleWheel() for useSlideScroll's intercept hook (wheel input is routed
// through there so the two don't both react to the same gesture).
export function useHeroIntro(heroRef, nextId, glideTo) {
  let progress = 0 // 0 = door closed, 1 = door open
  let frame = null
  let gliding = false
  let lockUntil = 0
  let touchStartY = null
  let reduced = false

  function render(t) {
    const el = heroRef.value
    if (!el) return
    const seg = (a, b) => clamp((t - a) / (b - a))
    el.style.setProperty('--cue', easeOut(seg(0, 0.3)).toFixed(4))
    el.style.setProperty('--copy', easeOut(seg(0, 0.6)).toFixed(4))
    el.style.setProperty('--open', easeInOut(seg(0.2, 1)).toFixed(4))
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
  const locked = () => playing() || gliding || performance.now() < lockUntil
  const atStart = () => window.scrollY < 4 && progress === 0

  function stepInside() {
    if (playing()) return
    const next = document.getElementById(nextId)
    if (!next) return
    play(1, FORWARD_MS, () => {
      gliding = true
      glideTo(next.offsetTop, () => {
        gliding = false
        lockUntil = performance.now() + MOMENTUM_GUARD_MS
      })
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

  // Coming back up: once the hero is in view again, close the door.
  function onScroll() {
    const el = heroRef.value
    if (!el || playing() || gliding || progress === 0) return
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
