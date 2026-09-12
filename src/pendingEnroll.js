// Bridges the /enroll route's query params (state, return_to) across a
// forced login redirect. The router guard can't preserve `to.query` itself
// (it just returns { name: 'Login' }, discarding the original target), so
// this stashes them under a fixed sessionStorage key instead - Login.vue
// checks for it after a successful login and resumes /enroll with the
// original query intact.
const STORAGE_KEY = 'pendingEnroll'

export function savePendingEnroll(query) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(query))
  } catch {
    // sessionStorage can be unavailable (private browsing, etc.) - enroll
    // will just have to be restarted from the appliance's UI in that case.
  }
}

// Reads and clears the stashed query, if any - single-use, like the state
// value it carries.
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
