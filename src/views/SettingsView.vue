<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- 外观设置 -->
      <div class="settings-section">
        <div class="section-header">
          <BgColorsOutlined class="section-icon" />
          <span>外观</span>
        </div>

        <div class="settings-cards">
          <!-- 主题切换 -->
          <div class="setting-card">
            <div class="setting-info">
              <div class="setting-icon theme">
                <BulbOutlined v-if="theme === 'light'" />
                <HighlightOutlined v-else-if="theme === 'dark'" />
                <SyncOutlined v-else />
              </div>
              <div class="setting-text">
                <h3>主题模式</h3>
                <p>选择界面配色方案</p>
              </div>
            </div>
            <a-select
              v-model:value="theme"
              size="large"
              class="setting-select"
              @change="changeTheme"
            >
              <a-select-option value="light">
                <span class="theme-option">
                  <BulbOutlined /> 浅色
                </span>
              </a-select-option>
              <a-select-option value="dark">
                <span class="theme-option">
                  <HighlightOutlined /> 深色
                </span>
              </a-select-option>
              <a-select-option value="auto">
                <span class="theme-option">
                  <SyncOutlined /> 跟随系统
                </span>
              </a-select-option>
            </a-select>
          </div>

          <!-- 字体设置 -->
          <div class="setting-card">
            <div class="setting-info">
              <div class="setting-icon font">
                <FontSizeOutlined />
              </div>
              <div class="setting-text">
                <h3>字体</h3>
                <p>选择界面显示字体</p>
              </div>
            </div>
            <a-select
              v-model:value="fontFamily"
              size="large"
              class="setting-select"
              style="width: 160px"
              @change="changeFontFamily"
            >
              <a-select-option value="system-ui">系统默认</a-select-option>
              <a-select-option value="'Microsoft YaHei', '微软雅黑'">微软雅黑</a-select-option>
              <a-select-option value="'PingFang SC', '苹方'">苹方</a-select-option>
              <a-select-option value="'SimSun', '宋体'">宋体</a-select-option>
              <a-select-option value="'Arial', sans-serif">Arial</a-select-option>
            </a-select>
          </div>
        </div>
      </div>

      <!-- 其他设置 -->
      <div class="settings-section">
        <div class="section-header">
          <ToolOutlined class="section-icon" />
          <span>其他</span>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useThemeStore } from '../stores/theme'
import {
  SettingOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  ToolOutlined,
  GlobalOutlined,
  BulbOutlined,
  HighlightOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'

const themeStore = useThemeStore()
const theme = ref(themeStore.currentTheme)
const fontFamily = ref(localStorage.getItem('fontFamily') || 'system-ui')
const language = ref('zh-CN')

function changeTheme() {
  themeStore.setTheme(theme.value)
}

function changeFontFamily() {
  localStorage.setItem('fontFamily', fontFamily.value)
  document.documentElement.style.setProperty('--global-font-family', fontFamily.value)
}

watch(fontFamily, changeFontFamily, { immediate: true })
</script>

<style scoped>
.settings-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: var(--bg-primary);
}

/* 页面头部 */
.page-header {
  width: 100%;
  margin-bottom: 32px;
  padding: 40px 24px;
  background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.page-header::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 720px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  backdrop-filter: blur(10px);
}

.header-text h1 {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-text p {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

/* 设置容器 */
.settings-container {
  max-width: 720px;
  margin: 0 auto;
}

/* 设置区块 */
.settings-section {
  margin-bottom: 32px;
  animation: slideUp 0.5s ease backwards;
}

.settings-section:nth-child(1) {
  animation-delay: 0.1s;
}

.settings-section:nth-child(2) {
  animation-delay: 0.2s;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-left: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-icon {
  font-size: 18px;
  color: var(--accent-blue);
}

/* 设置卡片 */
.settings-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease backwards;
}

.setting-card:nth-child(1) { animation-delay: 0.15s; }
.setting-card:nth-child(2) { animation-delay: 0.25s; }

.setting-card:hover {
  border-color: var(--glass-border-hover);
  transform: translateY(-2px);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.setting-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  animation: bounceIn 0.5s ease backwards;
}

.setting-card:nth-child(1) .setting-icon { animation-delay: 0.2s; }
.setting-card:nth-child(2) .setting-icon { animation-delay: 0.3s; }

.setting-icon.theme {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.setting-icon.font {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

.setting-icon.language {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.setting-text h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.setting-text p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.setting-select {
  min-width: 140px;
  border-radius: 10px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 动画定义 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    padding: 28px 20px;
  }

  .header-content {
    gap: 16px;
  }

  .header-icon {
    width: 52px;
    height: 52px;
    font-size: 24px;
  }

  .header-text h1 {
    font-size: 22px;
  }

  .setting-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }

  .setting-select {
    width: 100% !important;
  }

  .settings-container {
    padding: 0 16px;
  }
}
</style>
