<template>
  <div class="tutorial-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <ReadOutlined />
        </div>
        <div class="header-text">
          <h1>使用教程</h1>
          <p>快速上手 MetaST 3D</p>
        </div>
      </div>
    </div>

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
            <LeftOutlined /> 上一步
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
            下一步 <RightOutlined />
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  ReadOutlined,
  PlayCircleOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled
} from '@ant-design/icons-vue'

const steps = [
  {
    title: '上传视频',
    description: '在首页点击上传按钮，选择您想要进行3D重建的视频文件。您可以一次性上传多个视频，支持主流视频格式。',
    tips: [
      '支持 MP4、MOV、AVI 等格式',
      '单个视频最大支持 1GB',
      '建议使用清晰稳定的视频素材'
    ]
  },
  {
    title: '配置参数',
    description: '根据您的需求设置重建参数，包括模型精度、输出格式、渲染方式等选项。',
    tips: [
      '高精度模式需要更长的处理时间',
      '可以预览估算的处理时间',
      '参数设置会影响最终效果'
    ]
  },
  {
    title: '开始训练',
    description: '确认参数后即可开始3D模型训练。训练过程可在任务列表中实时查看进度。',
    tips: [
      '支持后台运行，不影响其他操作',
      '可随时暂停或恢复任务',
      '训练完成会有消息通知'
    ]
  },
  {
    title: '查看与下载',
    description: '训练完成后，您可以在模型库中查看生成的3D模型，支持多种格式下载和在线预览。',
    tips: [
      '支持 GLB、OBJ、FBX 等格式',
      '可以在线预览3D效果',
      '一键分享到社区'
    ]
  }
]

const currentStep = ref(0)

function nextStep() {
  if (currentStep.value < steps.length - 1) currentStep.value++
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
  max-width: 720px;
  margin: 0 auto 32px;
  padding: 40px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
  border-radius: 20px;
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
}

/* 内容卡片 */
.tutorial-content {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  overflow: hidden;
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
}
</style>
