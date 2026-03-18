<template>
  <div
    :class="[props.compact ? 'file-upload-compact' : 'file-upload', { 'is-processing': isProcessingFiles }]"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @dragover.prevent
    @drop.prevent="handleDrop"
  >
    <!-- Processing Overlay -->
    <div v-if="isProcessingFiles" class="processing-overlay" :class="{ 'compact-mode': props.compact }">
      <!-- Normal Mode: Full content with text -->
      <div v-if="!props.compact" class="processing-content">
        <a-spin size="large" />
        <p class="processing-text">正在读取文件...</p>
        <div v-if="processingProgress > 0" class="processing-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${processingProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ processingProgress }}%</span>
        </div>
        <p class="processing-file" v-if="processingFileName">{{ processingFileName }}</p>
      </div>
      <!-- Compact Mode: Small spinner only -->
      <div v-else class="processing-compact">
        <a-spin size="small" />
      </div>
    </div>

    <!-- Compact Mode (Re-upload) -->
    <div v-if="props.compact" class="compact-zone">
      <UploadOutlined />
      <span class="compact-text">点击或拖拽重新上传文件</span>
      <input
        ref="fileInput"
        type="file"
        :accept="videoAcceptTypes"
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
          <!-- <span class="icon icon-jpg">JPG</span>
          <span class="icon icon-png">PNG</span> -->
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
        <!-- <div class="upload-text">
          <p class="main-text">点击上传或将视频/图片拖入此区域</p>
          <p class="sub-text">支持视频（mp4, mov, avi, mvk, webm）或图片（jpg, png,jpeg）</p>
        </div> -->

         <div class="upload-text">
          <p class="main-text">点击上传或将视频拖入此区域</p>
          <p class="sub-text">支持视频（mp4, mov, avi, mvk, webm）</p>
        </div>

        <!-- Hidden Input -->
        <input
          ref="fileInput"
          type="file"
          :accept="videoAcceptTypes"
          multiple
          class="file-input"
          @change="handleFileSelect"
        >
      </div>

      <!-- Upload Info -->
      <div class="upload-info">
        <div class="info-row">
          <span class="info-label">视频上传：</span>
          <span class="info-content">
            · 支持的格式：mp4, mov, avi, mvk, webm
            · 最少 {{ props.minVideoDurationSeconds || 30 }} 秒，最多 {{ props.maxVideoDurationSeconds ? props.maxVideoDurationSeconds / 60 : 2 }} 分钟
            · 一次仅支持 1 个视频
            · 分辨率限制：{{ getResolutionLabel(getMaxResolution().width, getMaxResolution().height) }}（2K: 2560x1440，4K: 3840x2160，8K: 7680x4320）及以下
          </span>
        </div>
        <!-- <div class="info-row">
          <span class="info-label">图片上传：</span>
          <span class="info-content">
            · 支持的格式：jpg, png, jpeg
            · 最少 {{ props.minImageCount || 30 }} 张，最多 {{ props.maxImageCount || 150 }} 张
            · 分辨率限制：{{ getResolutionLabel(getMaxResolution().width, getMaxResolution().height) }}（2K: 2560x1440，4K: 3840x2160，8K: 7680x4320）及以下
          </span>
        </div> -->
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { Spin as aSpin } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'

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
}>()

// 分辨率参数
const RESOLUTION_1K = { width: 1920, height: 1080 }
const RESOLUTION_2K = { width: 2560, height: 1440 }
const RESOLUTION_4K = { width: 3840, height: 2160 }
const RESOLUTION_8K = { width: 7680, height: 4320 }

// 默认 2K 分辨率
const DEFAULT_MAX_RESOLUTION = RESOLUTION_8K

// 获取分辨率标签
const getResolutionLabel = (width: number, height: number): string => {
  if (width >= RESOLUTION_8K.width || height >= RESOLUTION_8K.height) return '8K'
  if (width >= RESOLUTION_4K.width || height >= RESOLUTION_4K.height) return '4K'
  if (width >= RESOLUTION_2K.width || height >= RESOLUTION_2K.height) return '2K'
  if (width >= RESOLUTION_1K.width || height >= RESOLUTION_1K.height) return '1K'
  return `${width}x${height}`
}

const getMaxResolution = () => props.maxResolution || DEFAULT_MAX_RESOLUTION

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

// 文件读取进度相关
const isProcessingFiles = ref(false)
const processingProgress = ref(0)
const processingFileName = ref('')

// 获取图片分辨率
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

// 获取视频分辨率
const getVideoDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      if(video.videoWidth > video.videoHeight)
      {
        resolve({ width: video.videoWidth, height: video.videoHeight })
      }else {
        resolve({ width: video.videoHeight, height: video.videoWidth })
      }
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  })
}

// 检查文件分辨率
const checkFileResolution = async (file: File): Promise<boolean> => {
  const maxRes = getMaxResolution()
  let dimensions: { width: number; height: number }

  if (file.type.startsWith('image/')) {
    dimensions = await getImageDimensions(file)
  } else if (file.type.startsWith('video/')) {
    dimensions = await getVideoDimensions(file)
      console.log(dimensions)
  } else {
    return true // 未知类型默认通过
  }

  if (dimensions.width === 0 || dimensions.height === 0) {
    return true // 获取失败时默认通过
  }

  if (dimensions.width > maxRes.width || dimensions.height > maxRes.height) {
    const maxResLabel = maxRes.width >= 3840 ? '4K' : `${maxRes.width}x${maxRes.height}`
    message.warning(
      `文件 "${file.name}" 分辨率 (${dimensions.width}x${dimensions.height}) 超过限制 (${maxResLabel})，请上传不超过 ${maxResLabel} 分辨率的文件`
    )
    return false
  }

  return true
}

const handleDragEnter = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = async (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const fileArray = Array.from(files)

    // 开始处理文件，显示加载动画
    isProcessingFiles.value = true
    processingProgress.value = 0
    processingFileName.value = fileArray.length === 1 ? fileArray[0].name : `${fileArray.length} 个文件`

    try {
      // 检查所有文件的分辨率，并显示进度
      for (let i = 0; i < fileArray.length; i++) {
        processingProgress.value = Math.round(((i + 1) / fileArray.length) * 100)
        const isValid = await checkFileResolution(fileArray[i])
        if (!isValid) {
          isProcessingFiles.value = false
          return
        }
      }
      emit('upload', fileArray)
    } finally {
      isProcessingFiles.value = false
    }
  }
}

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  const type = files?.[0]?.type || ''
  const isvValidFiles = files?.every(file => {
    return file.type === type;
  });
  if(!isvValidFiles) {
    message.warning('上传的文件内容类型不一致，请重新选择')
    target.value = ''
    return
  }
  if (files && files.length > 0) {
    // 开始处理文件，显示加载动画
    isProcessingFiles.value = true
    processingProgress.value = 0
    processingFileName.value = files.length === 1 ? files[0].name : `${files.length} 个文件`

    try {
      // 检查所有文件的分辨率，并显示进度
      for (let i = 0; i < files.length; i++) {
        processingProgress.value = Math.round(((i + 1) / files.length) * 100)
        const isValid = await checkFileResolution(files[i])
        if (!isValid) {
          isProcessingFiles.value = false
          target.value = ''
          return
        }
      }
      emit('upload', files)
    } finally {
      isProcessingFiles.value = false
    }
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

/* Processing Overlay */
.file-upload.is-processing,
.file-upload-compact.is-processing {
  pointer-events: none;
}

.processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

/* Compact Mode - smaller background */
.processing-overlay.compact-mode {
  background: rgba(0, 0, 0, 0.4);
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

.processing-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
}

.processing-file {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  max-width: 300px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.processing-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 200px;
}

.processing-progress .progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.processing-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4aa, #00b4d8);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.processing-progress .progress-text {
  color: white;
  font-size: 13px;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

/* Compact Mode Processing */
.processing-overlay.compact-mode {
  border-radius: 12px;
}

.processing-compact {
  display: flex;
  align-items: center;
  justify-content: center;
}

.processing-compact :deep(.ant-spin) {
  color: white;
}

.processing-compact :deep(.ant-spin-dot-item) {
  background-color: white;
}
</style>
