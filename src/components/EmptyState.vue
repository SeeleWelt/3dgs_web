<template>
  <div class="empty-state">
    <!-- 正常空状态 - 点击创建 -->
    <template v-if="!error">
      <button
        class="smart-icon-btn"
        :class="{ 'is-pressed': isPressed }"
        @click="handleClick"
        @mousedown="isPressed = true"
        @mouseup="isPressed = false"
        @mouseleave="isPressed = false"
        @touchstart="isPressed = true"
        @touchend="isPressed = false"
      >
        <div class="icon-wrapper">
          <svg
            class="box-icon"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M21 8v13H3V8"/>
            <path d="M1 3h22v5H1z"/>
            <path d="M10 12h4"/>
          </svg>
        </div>
        <span class="ripple" :class="{ 'active': showRipple }"></span>
      </button>
      <p class="empty-text">{{ t('home.emptyText') }}</p>
    </template>

    <!-- 网络错误 -->
    <template v-else-if="error === 'network'">
      <div class="error-icon-wrapper">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1 1l22 22"/>
          <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 015.17-2.39"/>
          <path d="M10.71 5.05A16 16 0 0122.58 9"/>
          <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
          <path d="M8.53 16.11a6 6 0 016.95 0"/>
          <path d="M12 20h.01"/>
        </svg>
      </div>
      <p class="error-title">网络连接失败</p>
      <p class="error-desc">请检查网络后重试</p>
      <button class="retry-btn" @click="$emit('retry')">
        <ReloadOutlined />
        重新加载
      </button>
    </template>

    <!-- 服务器错误 -->
    <template v-else-if="error === 'server'">
      <div class="error-icon-wrapper server">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3h18v18H3z"/>
          <path d="M3 9h18"/>
          <path d="M9 21V9"/>
        </svg>
      </div>
      <p class="error-title">服务器错误</p>
      <p class="error-desc">服务暂时不可用，请稍后重试</p>
      <button class="retry-btn" @click="$emit('retry')">
        <ReloadOutlined />
        重新加载
      </button>
    </template>

    <!-- 未知错误 -->
    <template v-else>
      <div class="error-icon-wrapper unknown">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
      </div>
      <p class="error-title">加载失败</p>
      <p class="error-desc">请稍后重试</p>
      <button class="retry-btn" @click="$emit('retry')">
        <ReloadOutlined />
        重新加载
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ReloadOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  type?: 'mesh-scan' | '3dgs-scan'
  error?: 'network' | 'server' | 'unknown' | null
}>()

const emit = defineEmits<{
  retry: []
}>()

const router = useRouter()
const { t } = useI18n()

const isPressed = ref(false)
const showRipple = ref(false)

const handleClick = () => {
  showRipple.value = true
  setTimeout(() => showRipple.value = false, 300)

  const targetPath = props.type === 'mesh-scan' ? '/create/mesh-scan' : '/create/3dgs-scan'
  router.push(targetPath)
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.smart-icon-btn {
  position: relative;
  width: 100px;
  height: 100px;
  background: var(--glass-surface);
  border: 2px solid var(--glass-border);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  margin-bottom: 20px;
  cursor: pointer;
  overflow: hidden;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.smart-icon-btn:hover {
  transform: scale(1.05);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: linear-gradient(135deg, rgba(0, 198, 255, 0.1), rgba(0, 114, 255, 0.1));
  box-shadow: 0 8px 24px rgba(0, 114, 255, 0.2);
}

.smart-icon-btn.is-pressed {
  transform: scale(0.95);
  transition: transform 150ms ease-out;
}

.box-icon {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(0, 114, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 300ms ease-out, height 300ms ease-out, opacity 300ms ease-out;
  opacity: 0;
  z-index: 1;
}

.ripple.active {
  width: 150%;
  height: 150%;
  opacity: 1;
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 错误状态样式 */
.error-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(245, 34, 45, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f5222d;
  margin-bottom: 16px;
}

.error-icon-wrapper.server {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.error-icon-wrapper.unknown {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.error-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.error-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 20px;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 114, 255, 0.3);
}

@media (max-width: 640px) {
  .empty-state {
    padding: 60px 16px;
  }

  .smart-icon-btn {
    width: 88px;
    height: 88px;
    border-radius: 20px;
  }

  .box-icon {
    width: 40px;
    height: 40px;
  }
}

@media (hover: none) {
  .smart-icon-btn:hover {
    transform: none;
    box-shadow: none;
  }

  .smart-icon-btn:active {
    transform: scale(0.95);
    background: linear-gradient(135deg, rgba(0, 198, 255, 0.15), rgba(0, 114, 255, 0.15));
  }
}
</style>
