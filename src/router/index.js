import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/page/:id',
    name: 'page',
    component: () => import('../views/PageView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})
