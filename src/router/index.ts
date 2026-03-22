import { createRouter, createWebHistory, RouterView } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'
import i18n from '../i18n'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true, titleKey: 'routes.login' }
    },
    {
      path: '/',
      name: 'main',
      component: MainView,

      meta: { requiresAuth: true, titleKey: 'routes.home' },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
          meta: { titleKey: 'routes.home' }
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('../views/ProjectsView.vue'),
          meta: { titleKey: 'routes.projects' }
        },
        {
          path: 'explore',
          name: 'explore',
          component: () => import('../views/ExploreView.vue'),
          meta: { titleKey: 'routes.explore' }
        },
        {
          path: 'explore4d',
          name: 'explore4d',
          component: () => import('../views/Explore4DView.vue'),
          meta: { titleKey: 'routes.explore4d' }
        },
        {
          path: 'tools',
          component: RouterView,
          children: [
            {
              path: 'profile',
              name: 'profile',
              component: () => import('../views/ProfileView.vue'),
              meta: { titleKey: 'routes.profile' }
            }
            ,{
              path: 'invite',
              name: 'invite',
              component: () => import('../views/InviteLinkView.vue'),
              meta: { titleKey: 'routes.invite' }
            }
            ,{
              path: 'settings',
              name: 'settings',
              component: () => import('../views/SettingsView.vue'),
              meta: { titleKey: 'routes.settings' }
            }
            ,
            {
              path: 'api',
              name: 'api',
              component: () => import('../views/ApiView.vue'),
              meta: { titleKey: 'routes.api' }
            },
            {
              path: 'developer',
              name: 'developer',
              meta: { titleKey: 'routes.developer' },
              component: () => import('../views/DeveloperView.vue')
            }
            ,
            {
              path: 'tutorial',
              name: 'tutorial',
              component: () => import('../views/TutorialView.vue'),
              meta: { titleKey: 'routes.tutorial' }
            }
            ,{
              path: 'feedback',
              name: 'feedback',
              component: () => import('../views/FeedbackView.vue'),
              meta: { titleKey: 'routes.feedback' }
            }
          ]
        }
      ]
    },
    {
      path: '/create',
      component: RouterView,
      meta: { requiresAuth: true, titleKey: 'routes.create' },
      children: [
        {
          path: '',
          redirect: '/create/3dgs-scan'
        },
        {
          path: 'mesh-scan',
          name: 'create-mesh-scan',
          component: () => import('../views/CreateMeshProjectView.vue'),
          meta: { titleKey: 'routes.createMeshScan' }
        },
        {
          path: '3dgs-scan',
          name: 'create-3dgs-scan',
          component: () => import('../views/CreateProjectView.vue'),
          meta: { titleKey: 'routes.create3dgsScan' }
        }
      ]
    },
    {
      path: '/share/link/:taskId',
      name: 'ShareLinkRenderTask',
      component: () => import('../views/ShareLinkRenderTask.vue'),
      meta: { requiresAuth: false, titleKey: 'routes.shareLink' },
      props: true
    },
    {
      path: '/model/:taskId',
      name: 'model-detail',
      component: () => import('../views/RenderTask.vue'),
      meta: { requiresAuth: true, titleKey: 'routes.modelDetail' },
      props: true
    },
    {
      path: '/officialModel/:taskId',
      name: 'official-model-detail',
      component: () => import('../views/OfficialRenderTask.vue'),
      meta: { requiresAuth: true, titleKey: 'routes.officialModelDetail' },
      props: true
    },
    {
      path: '/AiModel/:taskId',
      name: 'ai-model-detail',
      component: () => import('../views/AiModel.vue'),
      meta: { requiresAuth: true, titleKey: 'routes.aiModelDetail' },
      props: true
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { public: true, titleKey: 'routes.notFound' }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 页面切换时滚动到顶部
  window.scrollTo(0, 0)

  // 设置页面标题
  const titleKey = to.meta.titleKey as string | undefined
  const pageTitle = titleKey ? String(i18n.global.t(titleKey)) : ''
  document.title = pageTitle ? `MetaST - ${pageTitle}` : 'MetaST'

  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  console.log("权限:", isAuthenticated)

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
    console.log("重定向到登录页")
    next('/login')
    return
  }

  // 其他情况正常放行
  next()
})

export default router
