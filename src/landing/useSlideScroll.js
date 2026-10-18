import { onMounted, onBeforeUnmount } from 'vue'

const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// Wheel events closer together than this belong to the same gesture (a
// trackpad swipe and its momentum, or a fast spin of the wheel) and move at
// most one slide.
const GESTURE_GAP_MS = 160

// useSlideScroll makes each mouse-wheel gesture glide exactly one slide - to
// the next scroll-snap point inside rootRef in the wheel's direction - with an
// eased animation, instead of leaving it to the browser (whose wheel-vs-snap
// behaviour differs between browsers and input devices, and whose snap glide
// is quick and abrupt). Touch and keyboard keep the native CSS snapping.
//
// intercept(event, direction) runs first and may claim the gesture by
// returning true (the hero intro uses this to play its own transition).
export function useSlideScroll(rootRef, { intercept } = {}) {
  let frame = null
  let lastWheel = 0
  let reduced = false

  const animating = () => frame !== null

  function snapPoints() {
    const root = rootRef.value
    if (!root) return []
    const max = document.documentElement.scrollHeight - window.innerHeight
    const points = new Set()
    for (const el of root.querySelectorAll('*')) {
      const align = getComputedStyle(el).scrollSnapAlign
      if (!align || align === 'none') continue
      const rect = el.getBoundingClientRect()
      const y = align.includes('end')
        ? rect.bottom + window.scrollY - window.innerHeight
        : rect.top + window.scrollY
      points.add(Math.round(Math.min(max, Math.max(0, y))))
    }
    return [...points].sort((a, b) => a - b)
  }

  function glideTo(target) {
    const html = document.documentElement
    const from = window.scrollY
    const max = html.scrollHeight - window.innerHeight
    const distance = Math.min(Math.max(0, target), max) - from
    if (Math.abs(distance) < 1) return
    // Mandatory snapping would re-snap every intermediate frame; suspend it
    // for the glide and restore it once we're resting on a snap point.
    html.style.scrollSnapType = 'none'
    const duration = reduced ? 1 : Math.min(1300, 750 + (Math.abs(distance) / window.innerHeight) * 150)
    let start = null
    const step = (now) => {
      if (start === null) start = now
      const k = Math.min(1, (now - start) / duration)
      window.scrollTo({ top: from + distance * easeInOut(k), behavior: 'instant' })
      if (k < 1) {
        frame = requestAnimationFrame(step)
      } else {
        frame = null
        html.style.scrollSnapType = ''
      }
    }
    frame = requestAnimationFrame(step)
  }

  function onWheel(e) {
    if (e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    e.preventDefault()
    const now = performance.now()
    const newGesture = now - lastWheel > GESTURE_GAP_MS
    lastWheel = now
    if (animating() || !newGesture) return

    const direction = Math.sign(e.deltaY)
    if (intercept?.(e, direction)) return

    // Never move more than one screen per step, so a section taller than the
    // viewport (e.g. on a short laptop screen) is paged through, not skipped.
    const y = window.scrollY
    const points = snapPoints()
    const screen = window.innerHeight
    const target = direction > 0
      ? Math.min(points.find(p => p > y + 2) ?? y, y + screen)
      : Math.max(points.reverse().find(p => p < y - 2) ?? y, y - screen)
    glideTo(target)
  }

  onMounted(() => {
    reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    window.addEventListener('wheel', onWheel, { passive: false })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('wheel', onWheel)
    if (frame !== null) {
      cancelAnimationFrame(frame)
      document.documentElement.style.scrollSnapType = ''
    }
  })
}
