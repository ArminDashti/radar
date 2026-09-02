import { createRouter, createWebHistory } from 'vue-router'
import { isAdmin, isAuthenticated } from '@/lib/auth'
import LoginView from '@/views/LoginView.vue'
import SignupView from '@/views/SignupView.vue'
import HostsView from '@/views/HostsView.vue'
import ProbesView from '@/views/ProbesView.vue'
import RequestHostView from '@/views/RequestHostView.vue'
import AdminLayoutView from '@/views/AdminLayoutView.vue'
import AdminHostsView from '@/views/AdminHostsView.vue'
import AdminProbesView from '@/views/AdminProbesView.vue'
import AdminHostRequestsView from '@/views/AdminHostRequestsView.vue'
import AboutMeView from '@/views/AboutMeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/hosts' },
    { path: '/hosts', component: HostsView, meta: { requiresAuth: false } },
    { path: '/endpoints', redirect: '/hosts' },
    { path: '/probes', component: ProbesView, meta: { requiresAuth: true } },
    { path: '/request-host', component: RequestHostView, meta: { requiresAuth: true } },
    {
      path: '/admin',
      component: AdminLayoutView,
      meta: { requiresAuth: true, requiresAdmin: true },
      redirect: '/admin/hosts',
      children: [
        { path: 'hosts', component: AdminHostsView, meta: { requiresAuth: true, requiresAdmin: true } },
        { path: 'probes', component: AdminProbesView, meta: { requiresAuth: true, requiresAdmin: true } },
        { path: 'requests', component: AdminHostRequestsView, meta: { requiresAuth: true, requiresAdmin: true } },
      ],
    },
    { path: '/about-me', component: AboutMeView },
    { path: '/login', component: LoginView },
    { path: '/signup', component: SignupView },
    { path: '/:pathMatch(.*)*', redirect: '/hosts' },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.requiresAdmin && !isAdmin.value) return { path: '/hosts' }
  if ((to.path === '/login' || to.path === '/signup') && isAuthenticated.value) return '/hosts'
})

export default router
