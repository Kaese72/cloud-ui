// v-reveal: adds `is-visible` to the element the first time it scrolls into
// view, so CSS can transition it into place. Stagger with a --delay style.
export const vReveal = {
  mounted(el) {
    el.classList.add('reveal')
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('is-visible')
        observer.disconnect()
      }
    }, { threshold: 0.15 })
    observer.observe(el)
    el._revealObserver = observer
  },
  unmounted(el) {
    el._revealObserver?.disconnect()
  },
}
