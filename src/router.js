import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from './composables/useAuth.js'
import { savePendingEnroll } from './pendingEnroll.js'
import Home from './Home.vue';
import Groups from './Groups.vue';
import Appliances from './Appliances.vue';
import Invitations from './Invitations.vue';
import Account from './Account.vue';
import NotFound from './NotFound.vue';
import Login from './Login.vue';
import Register from './Register.vue';
import ForgotPassword from './ForgotPassword.vue';
import ResetPassword from './ResetPassword.vue';
import Enroll from './Enroll.vue';

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { public: true } },
  { path: '/register', name: 'Register', component: Register, meta: { public: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword, meta: { public: true } },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword, meta: { public: true } },
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: Home },
  { path: '/groups', name: 'Groups', component: Groups },
  { path: '/appliances', name: 'Appliances', component: Appliances },
  { path: '/invitations', name: 'Invitations', component: Invitations },
  { path: '/enroll', name: 'Enroll', component: Enroll },
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
    if (to.name === 'Enroll') savePendingEnroll(to.query)
    return { name: 'Login' }
  }
})

export default router;
