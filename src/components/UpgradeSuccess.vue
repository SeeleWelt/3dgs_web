<template>
  <Transition name="upgrade">
    <div v-if="show" class="upgrade-success-overlay" @click="handleClose">
      <div class="upgrade-success-modal" @click.stop>
        <div class="success-icon">
          <div class="star-1">★</div>
          <div class="star-2">★</div>
          <div class="star-3">★</div>
          <svg viewBox="0 0 52 52" class="checkmark">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <h2 class="success-title">升级成功</h2>
        <p class="success-desc">恭喜您已成为 Pro 会员</p>
        <div class="benefits-list">
          <div class="benefit-item">
            <span class="benefit-icon">⚡</span>
            <span>无限算力</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🎁</span>
            <span>专属折扣</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🚀</span>
            <span>优先处理</span>
          </div>
        </div>
        <button class="close-btn" @click="handleClose">太好了</button>
      </div>
      <!-- 背景粒子 -->
      <div class="particles">
        <span v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const show = ref(false)

const open = () => {
  show.value = true
}

const handleClose = () => {
  show.value = false
}

const getParticleStyle = (index: number) => {
  const randomX = Math.random() * 100
  const randomDelay = Math.random() * 2
  const randomDuration = 2 + Math.random() * 2
  const size = 4 + Math.random() * 8
  return {
    left: `${randomX}%`,
    animationDelay: `${randomDelay}s`,
    animationDuration: `${randomDuration}s`,
    width: `${size}px`,
    height: `${size}px`,
  }
}

defineExpose({ open, close: handleClose })
</script>

<style scoped>
.upgrade-success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.upgrade-success-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  padding: 40px;
  text-align: center;
  color: white;
  position: relative;
  z-index: 1;
  min-width: 320px;
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.5);
}

.success-icon {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
}

.star-1, .star-2, .star-3 {
  position: absolute;
  color: #ffd700;
  font-size: 20px;
  animation: starPulse 1.5s ease-in-out infinite;
}

.star-1 { top: -10px; left: 50%; transform: translateX(-50%); }
.star-2 { top: 20%; left: 0; animation-delay: 0.3s; }
.star-3 { top: 20%; right: 0; animation-delay: 0.6s; }

@keyframes starPulse {
  0%, 100% { transform: scale(1) translateX(-50%); opacity: 1; }
  50% { transform: scale(1.3) translateX(-50%); opacity: 0.7; }
}

.checkmark {
  width: 80px;
  height: 80px;
}

.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #fff;
  animation: strokeCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke: #fff;
  stroke-width: 3;
  stroke-linecap: round;
  animation: strokeCheck 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
}

@keyframes strokeCircle {
  100% { stroke-dashoffset: 0; }
}

@keyframes strokeCheck {
  100% { stroke-dashoffset: 0; }
}

.success-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  animation: fadeInUp 0.5s ease 0.3s forwards;
  opacity: 0;
}

.success-desc {
  font-size: 16px;
  opacity: 0.9;
  margin: 0 0 24px;
  animation: fadeInUp 0.5s ease 0.4s forwards;
  opacity: 0;
}

.benefits-list {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 28px;
  animation: fadeInUp 0.5s ease 0.5s forwards;
  opacity: 0;
}

.benefit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.15);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
}

.benefit-icon {
  font-size: 20px;
}

.close-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 12px 40px;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease 0.6s forwards;
  opacity: 0;
}

.close-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 背景粒子 */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  bottom: -20px;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
  border-radius: 50%;
  animation: particleRise 3s ease-in infinite;
}

@keyframes particleRise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) scale(0.5);
    opacity: 0;
  }
}

/* Transition animations */
.upgrade-enter-active {
  animation: modalIn 0.4s ease forwards;
}

.upgrade-leave-active {
  animation: modalOut 0.3s ease forwards;
}

@keyframes modalIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@media (max-width: 640px) {
  .upgrade-success-modal {
    width: calc(100vw - 32px);
    padding: 24px;
  }

  .success-title {
    font-size: 22px;
  }

  .benefits-list {
    flex-direction: column;
    gap: 10px;
  }

  .benefit-item {
    flex-direction: row;
    justify-content: center;
    gap: 8px;
  }
}
</style>
