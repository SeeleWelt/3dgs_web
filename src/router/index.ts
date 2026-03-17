import { createRouter, createWebHistory, RouterView } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true, title: '登录' }
    },
    {
      path: '/',
      name: 'main',
      component: MainView,

      meta: { requiresAuth: true, title: '首页' },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
          meta: { title: '首页' }
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('../views/ProjectsView.vue'),
          meta: { title: '项目' }
        },
        {
          path: 'explore',
          name: 'explore',
          component: () => import('../views/ExploreView.vue'),
          meta: { title: '探索' }
        },
        {
          path: 'explore4d',
          name: 'explore4d',
          component: () => import('../views/Explore4DView.vue'),
          meta: { title: '4D探索' }
        },
        {
          path: 'tools',
          component: RouterView,
          children: [
            {
              path: 'profile',
              name: 'profile',
              component: () => import('../views/ProfileView.vue'),
              meta: { title: '个人资料' }
            }
            ,{
              path: 'invite',
              name: 'invite',
              component: () => import('../views/InviteLinkView.vue'),
              meta: { title: '邀请链接' }
            }
            ,{
              path: 'settings',
              name: 'settings',
              component: () => import('../views/SettingsView.vue'),
              meta: { title: '设置' }
            }
            ,
            {
              path: 'api',
              name: 'api',
              component: () => import('../views/ApiView.vue'),
              meta: { title: 'API' }
            },
            {
              path: 'developer',
              name: 'developer',
              meta: { title: '开发者中心' },
              component: () => import('../views/DeveloperView.vue')
            }
            ,
            {
              path: 'tutorial',
              name: 'tutorial',
              component: () => import('../views/TutorialView.vue'),
              meta: { title: '教程' }
            }
            ,{
              path: 'feedback',
              name: 'feedback',
              component: () => import('../views/FeedbackView.vue'),
              meta: { title: '反馈' }
            }
          ]
        }
      ]
    },
    {
      path: '/create',
      component: RouterView,
      meta: { requiresAuth: true, title: '创建' },
      children: [
        {
          path: '',
          redirect: '/create/3dgs-scan'
        },
        {
          path: 'mesh-scan',
          name: 'create-mesh-scan',
          component: () => import('../views/CreateMeshProjectView.vue'),
          meta: { title: 'Mesh扫描' }
        },
        {
          path: '3dgs-scan',
          name: 'create-3dgs-scan',
          component: () => import('../views/CreateProjectView.vue'),
          meta: { title: '3DGS扫描' }
        }
      ]
    },
    {
      path: '/share/link/:taskId',
      name: 'ShareLinkRenderTask',
      component: () => import('../views/ShareLinkRenderTask.vue'),
      meta: { requiresAuth: false, title: '分享链接' },
      props: true
    },
    {
      path: '/model/:taskId',
      name: 'model-detail',
      component: () => import('../views/RenderTask.vue'),
      meta: { requiresAuth: true, title: '模型详情' },
      props: true
    },
    {
      path: '/officialModel/:taskId',
      name: 'official-model-detail',
      component: () => import('../views/OfficialRenderTask.vue'),
      meta: { requiresAuth: true, title: '官方模型详情' },
      props: true
    },
    {
      path: '/AiModel/:taskId',
      name: 'ai-model-detail',
      component: () => import('../views/AiModel.vue'),
      meta: { requiresAuth: true, title: 'AI模型详情' },
      props: true
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { public: true, title: '页面不存在' }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 页面切换时滚动到顶部
  window.scrollTo(0, 0)

  // 设置页面标题
  const pageTitle = to.meta.title as string
  if (pageTitle) {
    document.title = ` MetaST -${pageTitle}`
  } else {
    document.title = 'MetaST'
  }

  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  if(to.path === '/login' && isAuthenticated) {
    // 如果已经登录但访问登录页，重定向到主页
    console.log("已登录，重定向到主页")
    next('/')
    return
  }

  if (to.meta.public) {
    next()
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
