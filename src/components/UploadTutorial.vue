<template>
  <Transition name="tutorial-fade">
    <div v-if="show" class="tutorial-overlay" @click="handleClose">
      <div class="tutorial-modal" @click.stop>
        <!-- Header -->
        <div class="tutorial-header">
          <h2 class="tutorial-title">使用教程</h2>
          <button class="close-btn" @click="handleClose">
            <CloseOutlined />
          </button>
        </div>

        <!-- Content -->
        <div class="tutorial-content">
          <!-- Video Area -->
          <div class="video-container">
            <video
              ref="videoRef"
              class="tutorial-video"
              :src="videoSrc"
              controls
              preload="metadata"
              @ended="handleVideoEnd"
            ></video>
            <div v-if="!hasPlayed" class="video-overlay" @click="playVideo">
              <div class="play-button">
                <PlayCircleOutlined />
              </div>
              <span class="play-text">点击播放教程</span>
            </div>
          </div>

          <!-- Steps -->
          <div class="steps-container">
            <a-steps
              :current="currentStep"
              direction="vertical"
              size="small"
              class="tutorial-steps"
            >
              <a-step v-for="(step, index) in tutorialSteps" :key="index" :title="step.title">
                <template #description>
                  <span class="step-desc">{{ step.description }}</span>
                </template>
              </a-step>
            </a-steps>
          </div>
        </div>

        <!-- Footer -->
        <div class="tutorial-footer">
          <div></div>
          <div class="footer-actions">
            <a-button v-if="currentStep > 0" class="step-btn" @click="prevStep">
              上一步
            </a-button>
            <a-button v-if="currentStep < tutorialSteps.length - 1" type="primary" class="step-btn" @click="nextStep">
              下一步
            </a-button>
            <a-button v-else type="primary" @click="handleClose">
              开始使用
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Floating Help Button -->
  <Transition name="float-bounce">
    <button
      v-if="showFloatingBtn"
      class="floating-help-btn"
      @click="openTutorial"
    >
      <QuestionCircleOutlined />
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { CloseOutlined, PlayCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const show = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const hasPlayed = ref(false)
const currentStep = ref(0)
const showFloatingBtn = ref(true)

// Tutorial steps - each step has title, description and video URL
const tutorialSteps = [
  {
    title: '上传视频/图片',
    description: '上传需要建模的视频或图片素材',
    video: 'https://example.com/tutorial/step1.mp4'
  },
  {
    title: '填写基本信息',
    description: '设置任务名称和模型描述（可选）',
    video: 'https://example.com/tutorial/step2.mp4'
  },
  {
    title: '配置生成选项',
    description: '选择是否开启背景移除功能',
    video: 'https://example.com/tutorial/step3.mp4'
  },
  {
    title: '开始生成',
    description: '消耗算力点，开始AI 3D模型生成',
    video: 'https://example.com/tutorial/step4.mp4'
  }
]

const currentTutorial = computed(() => tutorialSteps[currentStep.value])
const videoSrc = computed(() => currentTutorial.value.video)

onMounted(() => {
  // Check if user has seen tutorial before
  const hasSeenTutorial = localStorage.getItem('has_seen_tutorial')
  if (!hasSeenTutorial) {
    show.value = true
    showFloatingBtn.value = false
  }
})

const handleClose = () => {
  show.value = false
  showFloatingBtn.value = true
  emit('update:modelValue', false)
  emit('close')
}

const openTutorial = () => {
  show.value = true
  showFloatingBtn.value = false
}

const playVideo = () => {
  videoRef.value?.play()
  hasPlayed.value = true
}

const handleVideoEnd = () => {
  hasPlayed.value = false
}

const nextStep = () => {
  if (currentStep.value < tutorialSteps.length - 1) {
    currentStep.value++
    hasPlayed.value = false
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    hasPlayed.value = false
  }
}

defineExpose({ openTutorial })
</script>

<style scoped>
.tutorial-overlay {
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
  padding: 20px;
}

.tutorial-modal {
  background: var(--bg-primary, #fff);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
}

.tutorial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--glass-border, #eee);
}

.tutorial-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--bg-secondary, #f5f5f5);
  color: var(--text-secondary, #666);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--glass-border, #e0e0e0);
  color: var(--text-primary, #333);
}

.tutorial-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.video-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  margin-bottom: 24px;
}

.tutorial-video {
  width: 100%;
  display: block;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-overlay:hover {
  background: rgba(0, 0, 0, 0.4);
}

.play-button {
  font-size: 56px;
  color: white;
  opacity: 0.9;
  transition: transform 0.3s ease;
}

.video-overlay:hover .play-button {
  transform: scale(1.1);
}

.play-text {
  color: white;
  font-size: 14px;
  margin-top: 8px;
}

.steps-container {
  padding: 0 8px;
}

.tutorial-steps {
  background: transparent;
}

.tutorial-steps :deep(.ant-steps-item-title) {
  font-weight: 500;
  color: var(--text-primary, #333);
}

.step-desc {
  font-size: 12px;
  color: var(--text-secondary, #666);
}

.tutorial-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--glass-border, #eee);
}

.footer-actions {
  display: flex;
  gap: 12px;
}

/* Floating Help Button */
.floating-help-btn {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 100;
}

.floating-help-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

/* Animations */
.tutorial-fade-enter-active {
  animation: fadeIn 0.3s ease;
}

.tutorial-fade-leave-active {
  animation: fadeIn 0.3s ease reverse;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.float-bounce-enter-active {
  animation: shrinkToCorner 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.float-bounce-leave-active {
  animation: fadeOut 0.2s ease;
}

@keyframes shrinkToCorner {
  0% {
    opacity: 0;
    transform: scale(2) translateY(-50vh);
  }
  60% {
    opacity: 1;
    transform: scale(0.8) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.3);
  }
}
</style>
