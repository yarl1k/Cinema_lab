import { createRouter, createWebHistory } from 'vue-router'
import { authClient } from '@/lib/auth-client'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import("../views/movies/MoviesView.vue")
    },
    {
      path: '/movies/:id',
      name: 'movie-details',
      component: () => import("../views/movies/MoviesDetailsView.vue")
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import("../views/AdminView.vue"),
      meta: { requiresAdmin: true }
    },
    {
      path: '/booking/:sessionId',
      name: 'booking',
      component: () => import("../views/booking/BookingView.vue")
    },
    // Auth routes
    {
      path: '/login',
      name: 'login',
      component: () => import("../views/auth/LoginView.vue"),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import("../views/auth/RegisterView.vue"),
      meta: { guestOnly: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import("../views/auth/ForgotPasswordView.vue"),
      meta: { guestOnly: true }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import("../views/auth/ResetPasswordView.vue"),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import("../views/auth/ProfileView.vue"),
      meta: { requiresAuth: true }
    },
  ]
})

router.beforeEach(async (to) => {
  // Fetch session once
  const { data } = await authClient.getSession();

  if (to.meta.requiresAuth && !data) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresAdmin) {
    if (!data) return { name: 'login', query: { redirect: to.fullPath } };
    const userRole = (data.user as { role?: string }).role;
    if (!userRole || !['manager', 'admin', 'superadmin'].includes(userRole)) {
      return { name: 'home' };
    }
  }

  if (to.meta.guestOnly && data) {
    return { name: 'home' };
  }
})

export default router