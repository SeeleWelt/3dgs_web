<template>
  <div class="app" :data-theme="currentTheme">
    <AnimatedBackground />

    <Sidebar v-if="!isMobile" />
    <Sidebar v-else v-model:isOpen="isSidebarOpen" />

    <main class="main">
      <Header @toggle-sidebar="toggleSidebar" />
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '../stores/theme'

import AnimatedBackground from '../components/AnimatedBackground.vue'
import Sidebar from '../components/Sidebar.vue'
import Header from '../components/Header.vue'

const themeStore = useThemeStore()
const isSidebarOpen = ref(false)
const isMobile = ref(false)

const currentTheme = computed(() => themeStore.appliedTheme)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.app {
  display: flex;
  min-height: 100vh;
  position: relative;
}

.main {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
}

.content {
  padding: 32px;
}

/* Extra Large Desktop (1920px+) */
@media (min-width: 1920px) {
  .content {
    max-width: 1600px;
    margin: 0 auto;
  }
}

/* Large Desktop (1440px - 1919px) */
@media (min-width: 1440px) and (max-width: 1919px) {
  .content {
    max-width: 1400px;
    margin: 0 auto;
  }
}

/* Desktop (1280px - 1439px) */
@media (min-width: 1280px) and (max-width: 1439px) {
  .content {
    padding: 24px;
  }
}

/* Small Desktop (1024px - 1279px) */
@media (min-width: 1024px) and (max-width: 1279px) {
  .content {
    padding: 20px;
  }
}

/* Tablet & Mobile */
@media (max-width: 1023px) {
  .main {
    margin-left: 0;
  }

  .content {
    padding: 20px;
  }
}

/* Mobile (<= 640px) */
@media (max-width: 640px) {
  .content {
    padding: 16px;
  }
}

/* Ultra Wide Display (2560px+) */
@media (min-width: 2560px) {
  :root {
    font-size: 18px;
  }

  .content {
    max-width: 2000px;
  }
}
</style>
