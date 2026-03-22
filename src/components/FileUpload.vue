<template>
  <div
    :class="[props.compact ? 'file-upload-compact' : 'file-upload', props.disabled ? 'file-upload-disabled' : '']"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @dragover.prevent
    @drop.prevent="handleDrop"
  >
    <!-- Compact Mode (Re-upload) -->
    <div v-if="props.compact" class="compact-zone" :class="{ 'disabled': props.disabled }">
      <UploadOutlined />
      <span class="desktop-only">{{ t('fileUpload.compact.desktopHint') }}</span>
      <span class="mobile-only">{{ t('fileUpload.compact.mobileHint') }}</span>
      <input
        ref="fileInput"
        type="file"
        :accept="videoAcceptTypes+','+imageAcceptTypes"
        multiple
        class="file-input"
        @change="handleFileSelect"
      >
    </div>

    <!-- Normal Mode -->
    <template v-else>
      <!-- Upload Zone -->
      <div class="upload-zone">
        <!-- Floating Format Icons -->
        <div class="floating-icons">
          <span class="icon icon-jpg">JPG</span>
          <span class="icon icon-png">PNG</span>
          <span class="icon icon-mov">MOV</span>
          <span class="icon icon-mp4">MP4</span>
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
          <p class="main-text">{{ t('fileUpload.mainText') }}</p>
          <p class="sub-text">{{ t('fileUpload.subText') }}</p>
        </div>

        <!-- Hidden Input -->
        <input
          ref="fileInput"
          type="file"
          :accept="videoAcceptTypes+','+imageAcceptTypes"
          multiple
          class="file-input"
          @change="handleFileSelect"
        >
      </div>

      <!-- Upload Info -->
      <div class="upload-info desktop-only">
        <div class="info-row">
          <span class="info-label">{{ t('fileUpload.video.label') }}</span>
          <span class="info-content">
            · {{ t('fileUpload.video.formats') }}
            · {{ t('fileUpload.video.duration', { min: props.minVideoDurationSeconds || 30, max: props.maxVideoDurationSeconds ? props.maxVideoDurationSeconds / 60 : 2 }) }}
            · {{ t('fileUpload.video.onlyOne') }}
            · {{ t('fileUpload.video.resolutionLimit') }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('fileUpload.image.label') }}</span>
          <span class="info-content">
            · {{ t('fileUpload.image.formats') }}
            · {{ t('fileUpload.image.count', { min: props.minImageCount || 30, max: props.maxImageCount || 150 }) }}
            · {{ t('fileUpload.image.resolutionLimit') }}
          </span>
        </div>
      </div>

      <!-- Mobile simplified info -->
      <div class="upload-info mobile-only">
        <div class="mobile-info-text">
          <span class="mobile-info-line">
            {{ t('fileUpload.mobileVideoSummary', {
            videoMinSec: props.minVideoDurationSeconds || 30,
            videoMaxMin: props.maxVideoDurationSeconds ? props.maxVideoDurationSeconds / 60 : 2
          }) }}
          </span>
          <span class="mobile-info-line">
            {{ t('fileUpload.mobileImageSummary', {
            imageMin: props.minImageCount || 30,
            imageMax: props.maxImageCount || 150
          }) }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  upload: [files: File[]]
}>()

const videoAcceptTypes = ref('video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,.mp4,.mov,.mkv,.avi,.webm')
const imageAcceptTypes = ref('image/png,image/jpg,image/jpeg')

const props = defineProps<{
  maxVideoDurationSeconds?: number
  maxImageCount?: number
  maxResolution?: { width: number; height: number }
  minImageCount?: number
  minVideoDurationSeconds?: number
  compact?: boolean
  disabled?: boolean
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
    const fileArray = Array.from(files)
    emit('upload', fileArray)
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  const type = files?.[0]?.type || ''
  const isvValidFiles = files?.every(file => {
    return file.type === type;
  });
  if(!isvValidFiles) {
    message.warning(t('fileUpload.messages.mixedTypes'))
    target.value = ''
    return
  }
  if (files && files.length > 0) {
    emit('upload', files)
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

.file-upload-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.file-upload-compact {
  background: var(--glass-surface);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 2px dashed var(--glass-border);
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
}

.file-upload-compact:hover,
.file-upload-compact.dragging {
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

/* Compact mode (re-upload) */
.compact-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  position: relative;
}

.compact-zone:hover {
  color: var(--accent-blue);
}

.compact-zone.disabled {
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.compact-zone .file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
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

.icon-webp {
  top: 55%;
  right: 15%;
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

.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

.mobile-info-text {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
  display: block;
  padding: 12px;
  background: var(--glass-surface);
  border-radius: 8px;
}

.mobile-info-line {
  display: block;
  line-height: 1.6;
}

.mobile-info-line + .mobile-info-line {
  margin-top: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .file-upload {
    padding: 30px 16px;
  }

  .upload-zone {
    min-height: 180px;
  }

  .upload-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    margin-bottom: 16px;
  }

  .floating-icons {
    display: none;
  }

  .upload-text .main-text {
    font-size: 14px;
  }

  .upload-text .sub-text {
    font-size: 12px;
    max-width: 280px;
  }

  .icon {
    font-size: 10px;
    padding: 6px 8px;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .upload-info {
    margin-top: 20px;
    padding-top: 16px;
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
