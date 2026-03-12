<template>
  <div
    class="image-upload"
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
        <span class="icon icon-jpg">JPG</span>
        <span class="icon icon-png">PNG</span>
        <span class="icon icon-webp">WEBP</span>
        <span class="icon icon-3d">3D</span>
      </div>

      <!-- Upload Icon -->
      <div class="upload-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>

      <!-- Upload Text -->
      <div class="upload-text">
        <p class="main-text">点击上传或将图片拖入此区域</p>
        <p class="sub-text">仅支持单张图片文件，重新选择会覆盖原文件</p>
      </div>

      <!-- Hidden Input -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        class="file-input"
        @change="handleFileSelect"
      >
    </div>

    <!-- Upload Info -->
    <div class="upload-info">
      <div class="info-row">
        <span class="info-label">图片上传：</span>
        <span class="info-content">
          · 支持的格式：jpg, png, webp
          · 图片尺寸建议：≥ 512x512 像素
          · 一次仅支持 1 张图片
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
.image-upload {
  background: var(--glass-surface);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 2px dashed var(--glass-border);
  border-radius: 20px;
  padding: 60px 40px;
  position: relative;
  transition: all 0.3s ease;
}

.image-upload:hover,
.image-upload.dragging {
  border-color: var(--accent-purple);
  background: rgba(139, 92, 246, 0.05);
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

.icon-png {
  top: 35%;
  left: 25%;
}

.icon-webp {
  top: 35%;
  right: 25%;
}

.icon-3d {
  bottom: 35%;
  left: 50%;
  transform: translateX(-50%);
}

.upload-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.3);
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
  .image-upload {
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
