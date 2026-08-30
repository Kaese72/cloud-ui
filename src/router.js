import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from './composables/useAuth.js'
import Home from './Home.vue';
import Groups from './Groups.vue';
import Invitations from './Invitations.vue';
import Account from './Account.vue';
import NotFound from './NotFound.vue';
import Login from './Login.vue';
import Register from './Register.vue';

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { public: true } },
  { path: '/register', name: 'Register', component: Register, meta: { public: true } },
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: Home },
  { path: '/groups', name: 'Groups', component: Groups },
  { path: '/invitations', name: 'Invitations', component: Invitations },
  { path: '/account', name: 'Account', component: Account },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const { isAuthenticated, isInitialized, init } = useAuth()

  // Attempt cookie-based token refresh on first navigation
  if (!isInitialized.value) {
    await init()
  }

  // Public routes are always accessible
  if (to.meta.public) return

  // Require authentication for all other routes
  if (!isAuthenticated.value) {
    return { name: 'Login' }
  }
})

export default router;
