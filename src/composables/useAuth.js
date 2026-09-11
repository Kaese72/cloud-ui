import { ref, computed } from 'vue'
import axios from 'axios'

const useToken = ref(null)
const isInitialized = ref(false)
let refreshIntervalId = null
let initPromise = null

const isAuthenticated = computed(() => useToken.value !== null)

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

const currentUserId = computed(() => {
  if (!useToken.value) return null
  return decodeJwtPayload(useToken.value)?.id ?? null
})

// The group a caller is currently interacting with - see the README's
// "one active group at a time" model. Every group-scoped API call (members,
// invitations, renaming) acts on this group, not on an id in the URL.
const currentGroupId = computed(() => {
  if (!useToken.value) return null
  return decodeJwtPayload(useToken.value)?.groupId ?? null
})

const LOGIN_URL = '/cloud-user-registry/v0/authentication/login'
const REGISTRATION_URL = '/cloud-user-registry/v0/registration'
const REQUEST_PASSWORD_RESET_URL = '/cloud-user-registry/v0/authentication/password-reset'
const CONFIRM_PASSWORD_RESET_URL = '/cloud-user-registry/v0/authentication/password-reset/confirm'
const REFRESH_INTERVAL_MS = 8 * 60 * 1000 // 8 min; use-token expires in 10 min

function setToken(token) {
  useToken.value = token
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

function clearToken() {
  useToken.value = null
  delete axios.defaults.headers.common['Authorization']
  if (refreshIntervalId !== null) {
    clearInterval(refreshIntervalId)
    refreshIntervalId = null
  }
}

async function attemptCookieRefresh() {
  try {
    const response = await axios.post(LOGIN_URL, {}, { withCredentials: true })
    setToken(response.data['use-token'])
    return true
  } catch {
    clearToken()
    return false
  }
}

function startRefreshInterval() {
  if (refreshIntervalId !== null) return
  refreshIntervalId = setInterval(attemptCookieRefresh, REFRESH_INTERVAL_MS)
}

export function useAuth() {
  async function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const success = await attemptCookieRefresh()
      if (success) startRefreshInterval()
      isInitialized.value = true
    })()
    return initPromise
  }

  async function login(username, password) {
    const response = await axios.post(LOGIN_URL, { username, password }, { withCredentials: true })
    setToken(response.data['use-token'])
    startRefreshInterval()
  }

  // register creates a User and a Group they own and administer, then logs
  // them in exactly as login would.
  async function register({ username, password, name, surname, email }) {
    const response = await axios.post(REGISTRATION_URL, { username, password, name, surname, email }, { withCredentials: true })
    setToken(response.data['use-token'])
    startRefreshInterval()
  }

  // selectGroup switches the active group to one the caller already
  // belongs to, re-issuing both tokens scoped to it.
  async function selectGroup(groupId) {
    const response = await axios.post(`/cloud-user-registry/v0/groups/${groupId}/select`, {}, { withCredentials: true })
    setToken(response.data['use-token'])
  }

  function logout() {
    clearToken()
  }

  // requestPasswordReset always resolves (the backend responds identically
  // whether or not the email is registered, to avoid leaking which
  // addresses have accounts) - callers should show a generic "check your
  // email" message rather than branching on the result.
  async function requestPasswordReset(email) {
    await axios.post(REQUEST_PASSWORD_RESET_URL, { email })
  }

  // confirmPasswordReset redeems a reset token (from the emailed link) for
  // a new password. It does not log the user in - they still need to sign
  // in afterwards.
  async function confirmPasswordReset(token, newPassword) {
    await axios.post(CONFIRM_PASSWORD_RESET_URL, { token, newPassword })
  }

  return {
    useToken,
    isAuthenticated,
    isInitialized,
    currentUserId,
    currentGroupId,
    init,
    login,
    register,
    selectGroup,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
  }
}
