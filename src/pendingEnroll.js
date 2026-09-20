// Bridges a redirect-driven route's query params (state, return_to, ...) across
// a forced login redirect. Used by /enroll and /appliance-login, both of which
// are entered from an appliance's own UI. The router guard can't preserve
// `to.query` itself (it just returns { name: 'Login' }, discarding the
// original target), so this stashes the route name and query under a fixed
// sessionStorage key instead - Login.vue checks for it after a successful
// login and resumes the original route with its query intact.
const STORAGE_KEY = 'pendingEnroll'

export function savePendingEnroll(name, query) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ name, query }))
  } catch {
    // sessionStorage can be unavailable (private browsing, etc.) - the flow
    // will just have to be restarted from the appliance's UI in that case.
  }
}

// Reads and clears the stashed { name, query }, if any - single-use, like the
// state value it carries.
export function takePendingEnroll() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(STORAGE_KEY)
    return JSON.parse(raw)
  } catch {
    return null
  }
}
