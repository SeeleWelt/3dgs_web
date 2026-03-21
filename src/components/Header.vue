<template>
  <header class="header">
    <div class="header-left">
      <button class="mobile-menu-btn" @click="$emit('toggle-sidebar')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>
    
    <div class="header-right">
      <!-- <button class="upgrade-btn" @click="handleUpgrade">
        {{ t('header.upgrade') }}
      </button> -->

      <!-- Contact Us Button -->
      <button class="contact-us-btn" @click="openContactUs">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
        </svg>
        <span v-if="!isMobile">联系我们获取算力点</span>
      </button>

      <div class="language-menu-wrapper" ref="languageMenuRef">
        <button class="header-language-btn" @click="toggleLanguageSelector">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
          <span v-if="!isMobile">{{ currentLanguageName }}</span>
        </button>

        <transition name="language-popup">
          <div v-if="isLanguageSelectorOpen" class="language-popup" @click.stop>
            <div class="language-popup-header">
              <button class="back-btn-small" @click="closeLanguageSelector">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span class="language-popup-title">{{ t('header.selectLanguage') }}</span>
            </div>
            <div class="language-list">
              <button
                v-for="lang in languages"
                :key="lang.code"
                class="language-option"
                :class="{ active: currentLocale === lang.code }"
                @click="selectLanguage(lang.code)"
              >
                <span class="language-flag"> <span :class="`fi fi-${lang.flagClass}`"></span></span>
                <span class="language-name">{{ lang.name }}</span>
                <svg v-if="currentLocale === lang.code" class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </transition>
      </div>
      
      <!-- User Menu -->
      <div class="user-menu-wrapper" ref="userMenuRef">
        <div class="user-avatar" @click="toggleUserMenu">
          <a-avatar :src="userStore.userInfo?.headimg" :size="36" @loadError="handleAvatarError" />
          <!-- <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg> -->
        </div>

        <!-- User Dropdown Menu -->
        <transition name="dropdown">
          <div v-if="isUserMenuOpen && !isLanguageSelectorOpen" class="user-dropdown">
            <!-- User Info -->
            <div class="user-info" @click="navigateTo('/tools/profile')">
              <div class="user-avatar-large">
                <a-avatar :src="userStore.userInfo?.headimg" :size="48" :loadError="handleAvatarError" />
                <!-- <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg> -->
              </div>
              <div class="user-details">
                <span class="user-email">{{ userStore.userInfo?.nickname }}</span>
                <div class="user-info-bottom">
                  <!-- <span class="user-badge">{{ userStore.userInfo?.isPro ? 'vip用户' : t('header.regularAccount') }}</span> -->
                  <span class="user-points">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {{ currentPoints }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Menu Items -->
            <div class="menu-section">
              <!-- <button class="menu-item" @click="handleUpgrade">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>{{ t('header.upgradePro') }}</span>
              </button> -->
              <button class="menu-item" @click="navigateTo('/tools/invite')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 10-7.07-7.07L10 5"/>
                  <path d="M14 11a5 5 0 01-7.07 0L4.1 8.17a5 5 0 017.07-7.07L14 3"/>
                </svg>
                <span>{{ t('header.invite') }}</span>
              </button>
              <button class="menu-item" @click="navigateTo('/tools/developer')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                <span>开发者中心</span>
              </button>
              <button class="menu-item" @click="navigateTo('/tools/api')">
                <svg t="1773800741068" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13356" width="18" height="18"><path d="M917.7 148.8l-42.4-42.4c-1.6-1.6-3.6-2.3-5.7-2.3s-4.1 0.8-5.7 2.3l-76.1 76.1c-33.7-22.9-72.9-34.3-112.1-34.3-51.2 0-102.4 19.5-141.5 58.6L432.3 308.7c-3.1 3.1-3.1 8.2 0 11.3L704 591.7c1.6 1.6 3.6 2.3 5.7 2.3 2 0 4.1-0.8 5.7-2.3l101.9-101.9c68.9-69 77-175.7 24.3-253.5l76.1-76.1c3.1-3.2 3.1-8.3 0-11.4zM769.1 441.7l-59.4 59.4-186.8-186.8 59.4-59.4c24.9-24.9 58.1-38.7 93.4-38.7 35.3 0 68.4 13.7 93.4 38.7 24.9 24.9 38.7 58.1 38.7 93.4 0 35.3-13.8 68.4-38.7 93.4zM578.9 546.7c-3.1-3.1-8.2-3.1-11.3 0L501 613.3 410.7 523l66.7-66.7c3.1-3.1 3.1-8.2 0-11.3L441 408.6c-3.1-3.1-8.2-3.1-11.3 0L363 475.3l-43-43c-1.6-1.6-3.6-2.3-5.7-2.3-2 0-4.1 0.8-5.7 2.3L206.8 534.2c-68.9 69-77 175.7-24.3 253.5l-76.1 76.1c-3.1 3.1-3.1 8.2 0 11.3l42.4 42.4c1.6 1.6 3.6 2.3 5.7 2.3s4.1-0.8 5.7-2.3l76.1-76.1c33.7 22.9 72.9 34.3 112.1 34.3 51.2 0 102.4-19.5 141.5-58.6l101.9-101.9c3.1-3.1 3.1-8.2 0-11.3l-43-43 66.7-66.7c3.1-3.1 3.1-8.2 0-11.3l-36.6-36.2zM441.7 769.1c-24.9 24.9-58.1 38.7-93.4 38.7-35.3 0-68.4-13.7-93.4-38.7-24.9-24.9-38.7-58.1-38.7-93.4 0-35.3 13.7-68.4 38.7-93.4l59.4-59.4 186.8 186.8-59.4 59.4z" p-id="13357" fill="#515151"></path></svg>
                <span>{{ t('header.api') }}</span>
              </button>

              
              <button class="menu-item" @click="navigateTo('/tools/blender')" v-if="false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
                </svg>
                <span>{{ t('header.blender') }}</span>
              </button>
              <!-- <button class="menu-item" @click="navigateTo('/tools/tutorial')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12.5" y1="16" x2="12.5" y2="18"/>
                </svg>
                <span>{{ t('header.tutorial') }}</span>
              </button> -->
              <!-- <button class="menu-item" @click="navigateTo('/tools/settings')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
                <span>{{ t('header.settings') }}</span>
              </button> -->
              <button class="menu-item" @click="navigateTo('/tools/feedback')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span>{{ t('header.feedback') }}</span>
              </button>
            </div>
            
            <!-- Logout -->
            <div class="menu-section">
              <button class="menu-item logout-item" @click="handleLogout">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>{{ t('header.logout') }}</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </header>

  <UpgradeSuccess ref="upgradeSuccessRef" />
  <ContactUs ref="contactUsRef" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Modal } from 'ant-design-vue'
import { useUserStore } from '../stores/user'
import { languages } from '../i18n'
import "/node_modules/flag-icons/css/flag-icons.min.css";
import { usePointsStore } from '@/stores/points'
import UpgradeSuccess from './UpgradeSuccess.vue'
import ContactUs from './ContactUs.vue'
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const userPointsStore = usePointsStore()
const { t, locale } = useI18n({ useScope: 'global' })

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const isUserMenuOpen = ref(false)
const isLanguageSelectorOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const avatarError = ref(false)
const languageMenuRef = ref<HTMLElement | null>(null)
const currentLocale = ref(locale.value)
const currentPoints = computed(() => userPointsStore.current_points)
const isMobile = ref(window.innerWidth <= 640)

const handleResize = () => {
  isMobile.value = window.innerWidth <= 640
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const pageTitle = computed(() => {
  if (route.path.startsWith('/create')) {
    return t('home.startCreate')
  }
  const titles: Record<string, string> = {
    '/': t('header.home'),
    '/tools/profile': t('header.profile'),
    '/tools/settings': t('header.settings'),
    '/tools/invite': t('header.invite'),
    '/tools/api': t('header.api'),
    '/tools/tutorial': t('header.tutorial'),
    '/tools/feedback': t('header.feedback'),
    '/projects': t('sidebar.explore'),
    '/explore': t('header.explore3d'),
    '/explore4d': t('header.explore4d')
  }
  return titles[route.path] || t('header.home')
})

const userEmail = computed(() => {
  return userStore.userInfo?.email || 'user@example.com'
})

const hasAvatar = computed(() => {
  const img = userStore.userInfo?.headimg
  return img != null && img !== '' && !avatarError.value
})

const handleAvatarError = () => {
  console.log("加载失败")
  avatarError.value = true
}

const currentLanguageName = computed(() => {
  const lang = languages.find(l => l.code === currentLocale.value)
  return lang?.name || '中文'
})

const toggleUserMenu = () => {
  isLanguageSelectorOpen.value = false
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const navigateTo = (path: string) => {
  closeUserMenu()
  router.push(path)
}

const upgradeSuccessRef = ref<InstanceType<typeof UpgradeSuccess> | null>(null)
const contactUsRef = ref<InstanceType<typeof ContactUs> | null>(null)

const handleUpgrade = () => {
  userStore.updateProfile(
    {isPro: true},
  )
  upgradeSuccessRef.value?.open()
}

const openContactUs = () => {
  closeUserMenu()
  contactUsRef.value?.open()
}

const handleLogout = () => {
  closeUserMenu()
  Modal.confirm({
    title: t('header.logout'),
    content: t('header.logoutConfirm'),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await userStore.logout()
    }
  })
}

const showLanguageSelector = () => {
  isUserMenuOpen.value = false
  isLanguageSelectorOpen.value = true
}

const toggleLanguageSelector = () => {
  isUserMenuOpen.value = false
  isLanguageSelectorOpen.value = !isLanguageSelectorOpen.value
}

const closeLanguageSelector = () => {
  isLanguageSelectorOpen.value = false
}

const selectLanguage = (code: string) => {
  currentLocale.value = code
  locale.value = code
  localStorage.setItem('language', code)
  closeLanguageSelector()
  closeUserMenu() // 选择语言后关闭整个菜单
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  const clickedUserMenu = !!userMenuRef.value?.contains(target)
  const clickedLanguageMenu = !!languageMenuRef.value?.contains(target)
  if (!clickedUserMenu && !clickedLanguageMenu) {
    isUserMenuOpen.value = false
    isLanguageSelectorOpen.value = false
  }
}

onMounted( async () =>  {
  document.addEventListener('click', handleClickOutside)
  // 重置头像错误状态
  avatarError.value = false
  try {
    await userPointsStore.getPoints();
    await userPointsStore.getPointsAllLogs();
  } catch (error) {
    console.error('获取算力点信息失败:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--glass-border);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-us-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.contact-us-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 114, 255, 0.3);
}

.upgrade-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upgrade-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 114, 255, 0.3);
}

/* User Menu */
.user-menu-wrapper {
  position: relative;
}

.language-menu-wrapper {
  position: relative;
}

.header-language-btn {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  background: var(--glass-surface);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
}

.header-language-btn:hover {
  background: var(--glass-surface-hover);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 114, 255, 0.3);
}

/* Dropdown Menu */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Language Popup */
.language-popup {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 1001;
}

.language-popup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--glass-border);
}

.back-btn-small {
  width: 32px;
  height: 32px;
  background: var(--glass-surface);
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.back-btn-small:hover {
  background: var(--glass-surface-hover);
  color: var(--text-primary);
}

.language-popup-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.language-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.language-option:hover {
  background: var(--glass-surface);
}

.language-option.active {
  background: rgba(0, 198, 255, 0.1);
}

.language-flag {
  width: 24px;
  height: 16px; /* 国旗标准比例 3:2，视觉更协调 */
  overflow: hidden;
  border-radius: 2px;
  flex-shrink: 0;
}

.language-name {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}

.check-icon {
  color: var(--accent-blue);
}

/* Language Popup Animation */
.language-popup-enter-active,
.language-popup-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.language-popup-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.language-popup-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* User Info */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: 12px;;
}

.user-info:hover {
  background: var(--glass-surface);
  cursor: pointer;
}


.user-avatar-large {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-email {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.user-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-secondary);
  width: fit-content;
}

.user-info-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-points {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #fbbf24;
  font-weight: 500;
}

/* Menu Sections */
.menu-section {
  padding: 8px 0;
  border-bottom: 1px solid var(--glass-border);
}

.menu-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.menu-item:hover {
  background: var(--glass-surface);
}

.menu-item svg {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.logout-item {
  color: #ff4757;
}

.logout-item svg {
  color: #ff4757;
}

.logout-item:hover {
  background: rgba(255, 71, 87, 0.1);
}

.mobile-menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
}

:deep(.fi) {
  background-size: cover;
  width: 100%;
  display: block;
  height: 100%;
  background-position: center;
}

/* Tablet & Mobile */
@media (max-width: 1023px) {
  .header {
    padding: 12px 16px;
    width: 100vw;
    max-width: 100vw;
    box-sizing: border-box;
  }

  .mobile-menu-btn {
    display: flex;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .upgrade-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .user-dropdown {
    width: 260px;
    right: -8px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 10px 12px;
  }

  .header-left {
    gap: 10px;
  }

  .page-title {
    font-size: 16px;
    max-width: 42vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-right {
    gap: 8px;
  }

  .contact-us-btn {
    padding: 6px 10px;
    font-size: 12px;
  }

  .header-language-btn {
    padding: 0 8px;
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .header-right {
    flex-wrap: wrap;
    justify-content: flex-end;
    row-gap: 6px;
  }
}
</style>
