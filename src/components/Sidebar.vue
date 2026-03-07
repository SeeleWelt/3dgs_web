<template>
  <aside class="sidebar" :class="{ open: isOpen }">
    <!-- Logo -->
    <div class="sidebar-header">
      <div class="logo-wrapper">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-name">MetaST</span>
          <span class="logo-badge">网页版</span>
        </div>
      </div>
    </div>

    <!-- Upload Button -->
    <button class="upload-btn" @click="handleNewProject">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      {{ t('sidebar.upload') }}
    </button>

    <nav>
      <!-- Main Menu -->
      <div class="nav-section">
        <a
          v-for="item in mainMenu"
          :key="item.name"
          :href="item.path"
          class="nav-item"
          :class="{ active: activeRoute === item.path }"
          @click.prevent="handleNavClick(item.path)"
        >
          <component :is="item.icon" />
          {{ item.label }}
        </a>
      </div>
    </nav>

    <!-- Middle Section - Reserved for future menu items -->
    <div class="sidebar-middle">
      <!-- Add more menu items here in the future -->
    </div>

    <div class="sidebar-footer">
      <!-- Tools Menu -->
      <div class="nav-section tools-section">
        <a
          v-for="item in toolsMenu"
          :key="item.name"
          :href="item.path"
          class="nav-item"
          :class="{ active: activeRoute === item.path }"
          @click.prevent="handleNavClick(item.path)"
        >
          <component :is="item.icon" />
          {{ item.label }}
        </a>
      </div>

      <!-- Divider -->
      <div class="nav-divider"></div>

      <!-- Download App -->
      <button class="download-app-btn">
        <span>{{ t('sidebar.downloadApp') }}</span>
        <div class="platform-icons">
          <svg class="apple-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <svg class="android-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
          </svg>
        </div>
      </button>

      <!-- Community -->
      <div class="community-section">
        <span class="community-label">{{ t('sidebar.joinCommunity') }}</span>
        <div class="social-links">
          <a href="#" class="social-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
          </a>
          <a href="#" class="social-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="#" class="social-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="#" class="social-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  isOpen?: boolean
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const router = useRouter()
const { t } = useI18n()
const activeRoute = ref('/')

// Home Icon
const HomeIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' }),
  h('polyline', { points: '9 22 9 12 15 12 15 22' })
])

// Explore 3D Icon
const Explore3DIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('polygon', { points: '3 11 22 2 13 21 11 13 3 11' })
])

// Explore 4D Icon (带时间维度)
const Explore4DIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('polygon', { points: '3 11 22 2 13 21 11 13 3 11' }),
  h('circle', { cx: '18', cy: '6', r: '3' }),
  h('path', { d: 'M18 3v6' })
])

// API Icon
const APIIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('polyline', { points: '16 18 22 12 16 6' }),
  h('polyline', { points: '8 6 2 12 8 18' })
])

// Blender Icon
const BlenderIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z' })
])

// Unity Icon
const UnityIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' })
])

// Unreal Engine Icon
const UnrealIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M12 2L2 12l10 10 10-10L12 2z' })
])

// Tutorial Icon
const TutorialIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('path', { d: 'M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3' }),
  h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
])

// Settings Icon
const SettingsIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('circle', { cx: '12', cy: '12', r: '3' }),
  h('path', { d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z' })
])

// Feedback Icon
const FeedbackIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' })
])

const mainMenu = computed(() => [
  { name: 'home', label: t('sidebar.home'), path: '/', icon: HomeIcon },
  { name: 'explore3d', label: t('sidebar.explore3d'), path: '/explore', icon: Explore3DIcon },
  { name: 'explore4d', label: t('sidebar.explore4d'), path: '/explore4d', icon: Explore4DIcon }
])

const toolsMenu = computed(() => [
  { name: 'api', label: t('sidebar.api'), path: '/tools/api', icon: APIIcon },
  { name: 'blender', label: t('sidebar.blender'), path: '/tools/blender', icon: BlenderIcon },
  { name: 'unity', label: t('sidebar.unity'), path: '/tools/unity', icon: UnityIcon },
  { name: 'unreal', label: t('sidebar.unreal'), path: '/tools/unreal', icon: UnrealIcon },
  { name: 'tutorial', label: t('sidebar.tutorial'), path: '/tools/tutorial', icon: TutorialIcon },
  { name: 'settings', label: t('sidebar.settings'), path: '/tools/settings', icon: SettingsIcon },
  { name: 'feedback', label: t('sidebar.feedback'), path: '/tools/feedback', icon: FeedbackIcon }
])

const handleNewProject = () => {
  router.push('/create')
}

const handleNavClick = (path: string) => {
  activeRoute.value = path
  router.push(path)
  if (props.isOpen !== undefined) {
    emit('update:isOpen', false)
  }
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--glass-border);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.sidebar-header {
  padding: 8px 0 16px;
  margin-bottom: 8px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  color: var(--text-secondary);
}

.upload-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 114, 255, 0.3);
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-divider {
  height: 1px;
  background: var(--glass-border);
  margin: 12px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--glass-surface);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(0, 198, 255, 0.1), rgba(0, 114, 255, 0.1));
  color: #0072ff;
}

.nav-item svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-middle {
  flex: 1;
  min-height: 40px;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
}

.download-app-btn {
  width: 100%;
  padding: 12px 14px;
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.download-app-btn:hover {
  background: var(--glass-surface);
  border-color: var(--glass-border-hover);
}

.platform-icons {
  display: flex;
  gap: 8px;
}

.apple-icon {
  color: #000000;
}

.android-icon {
  color: #3DDC84;
}

.community-section {
  text-align: center;
}

.community-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 10px;
  display: block;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.social-link {
  color: var(--text-tertiary);
  transition: color 0.2s ease;
}

.social-link:hover {
  color: var(--text-primary);
}

/* Mobile Responsive */
@media (max-width: 1023px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
  }
}
</style>
