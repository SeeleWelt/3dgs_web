<template>
  <div class="empty-state">
    <!-- 智能交互图标按钮 -->
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
      <!-- 图标容器 -->
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
      
      <!-- 涟漪效果 -->
      <span class="ripple" :class="{ 'active': showRipple }"></span>
    </button>
    
    <!-- 文字提示 -->
    <p class="empty-text">
      {{ t('home.emptyText') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const isPressed = ref(false)
const showRipple = ref(false)

const handleClick = () => {
  // 显示涟漪效果
  showRipple.value = true
  setTimeout(() => showRipple.value = false, 300)
  
  // 直接跳转到创建项目页
  router.push('/create')
}
</script>

<style scoped>
/* 空状态容器 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

/* 智能交互按钮 */
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

/* 图标容器 */
.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

/* 默认悬停效果 */
.smart-icon-btn:hover {
  transform: scale(1.05);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: linear-gradient(135deg, rgba(0, 198, 255, 0.1), rgba(0, 114, 255, 0.1));
  box-shadow: 0 8px 24px rgba(0, 114, 255, 0.2);
}

/* 点击按下效果 */
.smart-icon-btn.is-pressed {
  transform: scale(0.95);
  transition: transform 150ms ease-out;
}

/* 图标样式 */
.box-icon {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* 涟漪效果 */
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

/* 文字样式 */
.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 响应式适配 */
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

/* 触摸设备优化 */
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
