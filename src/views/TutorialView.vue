<template>
  <div class="tutorial-page">
    <div class="tutorial-container">
      <!-- 步骤条 -->
      <a-steps :current="currentStep" class="tutorial-steps" size="small">
        <a-step v-for="(step, idx) in steps" :key="idx">
          <template #title>{{ step.title }}</template>
        </a-step>
      </a-steps>

      <!-- 教程内容 -->
      <div class="tutorial-content">
        <div class="content-card">
          <!-- 视频/图片区域 -->
          <div class="media-area">
            <div class="media-placeholder">
              <PlayCircleOutlined class="placeholder-icon" />
              <span>{{ steps[currentStep].title }}</span>
            </div>
          </div>

          <!-- 文字说明 -->
          <div class="text-area">
            <h2 class="step-title">{{ steps[currentStep].title }}</h2>
            <p class="step-desc">{{ steps[currentStep].description }}</p>

            <div class="step-tips">
              <div v-for="(tip, idx) in steps[currentStep].tips" :key="idx" class="tip-item">
                <CheckCircleFilled class="tip-icon" />
                <span>{{ tip }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="step-nav">
          <a-button
            size="large"
            :disabled="currentStep === 0"
            @click="prevStep"
            class="nav-btn prev"
          >
            <LeftOutlined /> {{ t('tutorialLang.prevStep') }}
          </a-button>
          <div class="step-indicators">
            <span
              v-for="(_, idx) in steps"
              :key="idx"
              class="indicator"
              :class="{ active: idx === currentStep }"
              @click="currentStep = idx"
            />
          </div>
          <a-button
            size="large"
            type="primary"
            :disabled="currentStep === steps.length - 1"
            @click="nextStep"
            class="nav-btn next"
          >
            {{ t('tutorialLang.nextStep') }} <RightOutlined />
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PlayCircleOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled
} from '@ant-design/icons-vue'

const { t } = useI18n()

const steps = computed(() => [
  {
    title: t('tutorialLang.step1Title'),
    description: t('tutorialLang.step1Desc'),
    tips: [
      t('tutorialLang.step1Tip1'),
      t('tutorialLang.step1Tip2'),
      t('tutorialLang.step1Tip3')
    ]
  },
  {
    title: t('tutorialLang.step2Title'),
    description: t('tutorialLang.step2Desc'),
    tips: [
      t('tutorialLang.step2Tip1'),
      t('tutorialLang.step2Tip2'),
      t('tutorialLang.step2Tip3')
    ]
  },
  {
    title: t('tutorialLang.step3Title'),
    description: t('tutorialLang.step3Desc'),
    tips: [
      t('tutorialLang.step3Tip1'),
      t('tutorialLang.step3Tip2'),
      t('tutorialLang.step3Tip3')
    ]
  },
  {
    title: t('tutorialLang.step4Title'),
    description: t('tutorialLang.step4Desc'),
    tips: [
      t('tutorialLang.step4Tip1'),
      t('tutorialLang.step4Tip2'),
      t('tutorialLang.step4Tip3')
    ]
  }
])

const currentStep = ref(0)

function nextStep() {
  if (currentStep.value < steps.value.length - 1) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}
</script>

<style scoped>
.tutorial-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: var(--bg-primary);
}

/* 页面头部 */
.page-header {
  width: 100%;
  margin-bottom: 32px;
  padding: 40px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -10%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
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

/* 教程容器 */
.tutorial-container {
  max-width: 720px;
  margin: 0 auto;
}

/* 步骤条 */
.tutorial-steps {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.1s;
}

/* 内容卡片 */
.tutorial-content {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  overflow: hidden;
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.2s;
}

.content-card {
  display: flex;
  flex-direction: column;
}

/* 媒体区域 */
.media-area {
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.placeholder-icon {
  font-size: 64px;
  opacity: 0.5;
}

.media-placeholder span {
  font-size: 16px;
}

/* 文字区域 */
.text-area {
  padding: 32px;
}

.step-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.step-desc {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 24px;
}

/* 提示列表 */
.step-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--glass-surface-hover);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary);
}

.tip-icon {
  color: #34c759;
  font-size: 18px;
}

/* 导航 */
.step-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-top: 1px solid var(--glass-border);
}

.nav-btn {
  min-width: 120px;
  height: 44px;
  border-radius: 12px;
  font-weight: 500;
}

.nav-btn.prev {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn.next {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-indicators {
  display: flex;
  gap: 8px;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--glass-border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  width: 32px;
  border-radius: 5px;
  background: var(--accent-blue);
}

.indicator:hover:not(.active) {
  background: var(--text-tertiary);
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

  .text-area {
    padding: 20px;
  }

  .step-title {
    font-size: 20px;
  }

  .step-nav {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .step-indicators {
    order: -1;
  }

  .tutorial-container {
    padding: 0 16px;
  }
}
</style>
