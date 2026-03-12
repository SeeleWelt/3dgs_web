<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <!-- 404 图标 -->
      <div class="error-icon">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" stroke="#e0e0e0" stroke-width="3"/>
          <text x="60" y="75" font-size="48" font-weight="bold" fill="#5d86f7" text-anchor="middle">404</text>
        </svg>
      </div>

      <!-- 标题和描述 -->
      <h1 class="error-title">页面不存在</h1>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除</p>

      <!-- 倒计时提示 -->
      <div class="countdown-tips">
        <span class="countdown-number">{{ countdown }}</span>
        <span class="countdown-text">秒后自动跳转到登录页面</span>
      </div>

      <!-- 手动跳转按钮 -->
      <div class="action-buttons">
        <a-button type="primary" size="large" @click="goToLogin" class="primary-btn">
          立即跳转
        </a-button>
        <a-button size="large" @click="goBack" class="secondary-btn">
          返回上一页
        </a-button>
      </div>

      <!-- 提示信息 -->
      <div class="tips-info">
        <p>如果页面持续显示错误，请检查URL是否正确</p>
        <p>或联系技术支持获取帮助</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const countdown = ref(3)
let timer: ReturnType<typeof setInterval> | null = null

const goToLogin = () => {
  if (timer) {
    clearInterval(timer)
  }
  router.push('/login')
}

const goBack = () => {
  router.go(-1)
}

const startCountdown = () => {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      goToLogin()
    }
  }, 1000)
}

onMounted(() => {
  startCountdown()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.not-found-container {
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.error-icon {
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.error-desc {
  font-size: 16px;
  color: #666;
  margin: 0 0 32px;
}

.countdown-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
  padding: 16px;
  background: #f0f5ff;
  border-radius: 8px;
}

.countdown-number {
  font-size: 24px;
  font-weight: bold;
  color: #5d86f7;
  min-width: 30px;
}

.countdown-text {
  font-size: 14px;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
}

.primary-btn {
  min-width: 120px;
  height: 44px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  border: none;
  border-radius: 10px;
  font-weight: 600;
}

.primary-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.secondary-btn {
  min-width: 120px;
  height: 44px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  font-weight: 500;
}

.secondary-btn:hover {
  border-color: #5d86f7;
  color: #5d86f7;
}

.tips-info {
  padding-top: 24px;
  border-top: 1px solid #e8e8e8;
}

.tips-info p {
  font-size: 13px;
  color: #999;
  margin: 4px 0;
}

@media (max-width: 480px) {
  .not-found-container {
    padding: 24px;
    margin: 0 16px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
}
</style>
