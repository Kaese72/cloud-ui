// v-fit: scales the element down (never up) until it fits inside its parent's
// content box, so a slide's content always fits on one screen, however short
// the window. The parent should centre it; the scale origin is the centre.
export const vFit = {
  mounted(el) {
    const parent = el.parentElement
    const fit = () => {
      const style = getComputedStyle(parent)
      const available = parent.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      // offsetHeight ignores transforms, so this is always the natural height.
      const scale = Math.min(1, available / el.offsetHeight)
      el.style.transform = scale < 1 ? `scale(${scale.toFixed(4)})` : ''
    }
    const observer = new ResizeObserver(fit)
    observer.observe(parent)
    observer.observe(el)
    el._fitObserver = observer
  },
  unmounted(el) {
    el._fitObserver?.disconnect()
  },
}
