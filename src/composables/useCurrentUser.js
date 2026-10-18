import { ref, watch } from 'vue'
import axios from 'axios'
import { useAuth } from './useAuth.js'

const user = ref(null)
const failed = ref(false)
let pending = null

// Drop the cached user when the session ends, so a later login doesn't show
// the previous person's name.
watch(useAuth().isAuthenticated, (authenticated) => {
  if (!authenticated) {
    user.value = null
    failed.value = false
  }
})

// useCurrentUser lazily fetches /users/me once and shares it between callers -
// used for display only (e.g. the name in the landing page's top bar), so a
// failure just leaves `user` empty and sets `failed`.
export function useCurrentUser() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated.value && !user.value && !pending) {
    pending = axios.get('/cloud-user-registry/v0/users/me')
      .then((response) => { user.value = response.data })
      .catch(() => { failed.value = true })
      .finally(() => { pending = null })
  }
  return { user, failed }
}
