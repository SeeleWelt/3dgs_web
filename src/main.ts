import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useUserStore } from './stores/user'
import { useThemeStore } from './stores/theme'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import VueLazyLoad from 'vue3-lazyload'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(Antd)
app.use(VueLazyLoad, {
    loading: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', // 加载中使用透明占位，实际动画由组件提供
    error: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/26a0.svg',   // 加载失败图标（警告）
    attempt: 1,             // 尝试加载次数
    observerOptions:{
        rootMargin: '50px',
        threshold: 0.1
    }
})

// 初始化 stores
const userStore = useUserStore()
const themeStore = useThemeStore()

userStore.init()
themeStore.init()

app.mount('#app')
