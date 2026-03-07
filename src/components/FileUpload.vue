<template>
  <div
    class="file-upload"
    :class="{ dragging: isDragging }"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @dragover.prevent
    @drop.prevent="handleDrop"
  >
    <!-- Upload Zone -->
    <div class="upload-zone">
      <!-- Floating Format Icons -->
      <div class="floating-icons">
        <span class="icon icon-jpg">VIDEO</span>
        <span class="icon icon-mov">MOV</span>
        <span class="icon icon-mp4">MP4</span>
        <span class="icon icon-jpeg">3 MIN</span>
      </div>

      <!-- Upload Icon -->
      <div class="upload-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>

      <!-- Upload Text -->
      <div class="upload-text">
        <p class="main-text">点击上传或将视频拖入此区域</p>
        <p class="sub-text">仅支持单个视频文件，重新选择会覆盖原文件</p>
      </div>

      <!-- Hidden Input -->
      <input
        ref="fileInput"
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov"
        class="file-input"
        @change="handleFileSelect"
      >
    </div>

    <!-- Upload Info -->
    <div class="upload-info">
      <div class="info-row">
        <span class="info-label">视频上传：</span>
        <span class="info-content">
          · 支持的格式：mp4, mov
          · 视频时长限制：最长 3 分钟
          · 一次仅支持 1 个视频
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  upload: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const handleDragEnter = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    emit('upload', files[0])
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    emit('upload', files[0])
  }
  target.value = ''
}
</script>

<style scoped>
.file-upload {
  background: var(--glass-surface);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 2px dashed var(--glass-border);
  border-radius: 20px;
  padding: 60px 40px;
  position: relative;
  transition: all 0.3s ease;
}

.file-upload:hover,
.file-upload.dragging {
  border-color: var(--accent-blue);
  background: rgba(10, 132, 255, 0.05);
}

.upload-zone {
  position: relative;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.icon {
  position: absolute;
  padding: 8px 12px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  opacity: 0.6;
}

.icon-jpg {
  top: 20%;
  left: 45%;
}

.icon-mov {
  top: 35%;
  left: 25%;
}

.icon-png {
  top: 35%;
  right: 25%;
}

.icon-mp4 {
  bottom: 35%;
  left: 20%;
}

.icon-jpeg {
  bottom: 35%;
  right: 20%;
}

.upload-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #00d4aa, #00b4d8);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 12px 40px rgba(0, 212, 170, 0.3);
}

.upload-text {
  text-align: center;
}

.main-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.sub-text {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 400px;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-info {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--glass-border);
}

.info-row {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-label {
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 80px;
}

.info-content {
  color: var(--text-tertiary);
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .file-upload {
    padding: 40px 20px;
  }

  .upload-zone {
    min-height: 200px;
  }

  .upload-icon {
    width: 60px;
    height: 60px;
  }

  .icon {
    font-size: 10px;
    padding: 6px 8px;
  }

  .info-row {
    flex-direction: column;
    gap: 4px;
  }

  .info-content {
    padding-left: 96px;
  }
}
</style>
