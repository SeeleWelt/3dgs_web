import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true }
    },
    {
      path: '/',
      name: 'main',
      component: MainView,

      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('../views/ProjectsView.vue')
        },
        {
          path: 'explore',
          name: 'explore',
          component: () => import('../views/ExploreView.vue')
        },
        {
          path: 'explore4d',
          name: 'explore4d',
          component: () => import('../views/Explore4DView.vue')
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue')
        }
      ]
    },
    {
      path: '/create',
      name: 'create',
      component: () => import('../views/CreateProjectView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/model/:taskId',
      name: 'model-detail',
      component: () => import('../views/RenderTask.vue'),
      meta: { requiresAuth: true },
      props: true
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 直接从 localStorage 检查登录状态，避免 Pinia 未初始化问题
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  // 如果访问的是公开页面（如登录页）且已登录，则跳转到首页
  if (to.meta.public && isAuthenticated) {
    next('/')
    return
  }

  // 如果访问需要登录的页面且未登录，则跳转到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // 其他情况正常放行
  next()
})

export default router
