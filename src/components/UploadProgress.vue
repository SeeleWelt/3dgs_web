<template>
  <div class="upload-progress">
    <div class="progress-header">
      <h3 class="progress-title">{{ uploadTypeText }}</h3>
      <div class="header-actions">
        <!-- 算力点不足警告 -->
        <div v-if="isPointsInsufficient" class="points-warning">
          <ExclamationCircleOutlined />
          <span>算力点不足</span>
        </div>
        <a-tooltip>
          <template #title>
            <div class="points-tooltip-content">
              <p>当前算力点: {{ currentPoints }}</p>
              <p>本次消耗: -{{ consumedPoints }}</p>
              <p>剩余算力点: {{ remainingPoints }}</p>
            </div>
          </template>
          <ExclamationCircleOutlined class="points-help-icon" />
        </a-tooltip>
        <button class="advanced-btn" @click="$emit('open-advanced')">
          <SettingOutlined />
          <span>高级选项</span>
        </button>
      </div>
    </div>

    <!-- 视频上传展示 -->
    <div v-if="task && task.uploadType !== 'image'" class="file-list">
      <div class="file-item" :class="task.status">
        <div class="video-preview" v-if="task.previewUrl">
          <button
            class="preview-remove"
            title="移除视频"
            :disabled="task.status === 'uploading' || props.disabled"
            @click.stop="$emit('remove')"
          >
            <CloseOutlined />
          </button>
          <video
            :src="task.previewUrl"
            controls
            preload="metadata"
            @error="handleVideoError"
            @stalled="handleVideoStalled"
            @loadeddata="handleVideoLoadedData"
            @timeout="handleVideoTimeout"
          ></video>
          <div v-if="videoWarning" class="video-warning">
            <ExclamationCircleOutlined />
            <span>{{ videoWarning }}</span>
          </div>
        </div>

        <div class="file-info">
          <div class="file-header">
            <span class="file-name">{{ task.name }}</span>
            <span class="status-badge" :class="`status-${task.status}`">{{ statusTextMap[task.status] }}</span>
          </div>

          <div class="meta-tags">
            <span class="meta-tag">
              <ClockCircleOutlined />
              时长 {{ formatDuration(task.durationSec) }}
            </span>
            <span class="meta-tag">
              <FileOutlined />
              大小 {{ formatSize(task.size) }}
            </span>
          </div>

          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${task.progress}%` }"
              :class="{ completed: task.status === 'success' }"
            />
          </div>

          <div class="file-status">
            <span v-if="task.status === 'uploading'">上传中... {{ Math.round(task.progress) }}%</span>
            <span v-else-if="task.status === 'pending'">待上传，点击"开始生成模型"后上传</span>
            <span v-else-if="task.status === 'success'" class="completed-text">上传完成</span>
            <span v-else-if="task.status === 'cancelled'" class="cancelled-text">已取消</span>
            <span v-else class="error-text">上传失败</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片上传展示 -->
    <div v-if="imageFiles && imageFiles.length > 0" class="file-list image-list">
      <!-- 图片数量统计 -->
      <div class="image-count-info">
        <span>已选择 <strong>{{ imageFiles.length }}</strong> 张图片</span>
        <span v-if="imageFiles.length > getMaxDisplayImages() && !showAllImages" class="expand-hint" @click="showAllImages = true">
          <span>点击展开全部</span>
          <DownOutlined />
        </span>
      </div>

      <div class="image-grid">
        <!-- 展开模式：显示所有图片 -->
        <template v-if="showAllImages">
          <div
            v-for="image in imageFiles"
            :key="image.id"
            class="image-item"
          >
            <div class="image-preview">
              <a-image
                :src="image.previewUrl"
                :alt="image.name"
                class="preview-img"
              />
              <button
                class="preview-remove"
                title="移除图片"
                :disabled="imageUploadStatus?.status === 'uploading' || props.disabled"
                @click.stop="$emit('remove-image', image.id)"
              >
                <CloseOutlined />
              </button>
              <div class="image-overlay">
                <span class="image-name" :title="image.name">{{ image.name }}</span>
              </div>
            </div>
          </div>
          <!-- 收起按钮 -->
          <div
            v-if="imageFiles.length > getMaxDisplayImages()"
            class="image-item collapse-btn"
            @click="showAllImages = false"
          >
            <div class="collapse-content">
              <UpOutlined />
              <span>收起</span>
            </div>
          </div>
        </template>
        <!-- 收起模式：只显示前几张 -->
        <template v-else>
          <div
            v-for="image in displayedImages"
            :key="image.id"
            class="image-item"
          >
            <div class="image-preview">
              <a-image
                :src="image.previewUrl"
                :alt="image.name"
                class="preview-img"
              />
              <button
                class="preview-remove"
                title="移除图片"
                :disabled="imageUploadStatus?.status === 'uploading' || props.disabled"
                @click.stop="$emit('remove-image', image.id)"
              >
                <CloseOutlined />
              </button>
              <div class="image-overlay">
                <span class="image-name" :title="image.name">{{ image.name }}</span>
              </div>
            </div>
          </div>
          <!-- 更多图片按钮 -->
          <div
            v-if="imageFiles.length > getMaxDisplayImages()"
            class="image-item more-images"
            @click="showAllImages = true"
          >
            <span class="more-count">+{{ imageFiles.length - getMaxDisplayImages() }}</span>
          </div>
        </template>
        <!-- 添加更多图像按钮 -->
        <div
          v-if="(!imageUploadStatus || imageUploadStatus.status !== 'uploading') && !props.disabled"
          class="add-more-image"
          @click="$emit('add-image')"
        >
          <PlusOutlined />
          <span class="add-more-text">添加更多图像</span>
        </div>

        <!-- 处理中的动画遮罩 -->
        <div v-if="props.isProcessing" class="image-processing-overlay">
          <a-spin size="large" />
          <span>处理中...</span>
        </div>
      </div>

      <!-- 图片上传进度条 -->
      <div v-if="imageUploadStatus" class="image-upload-status">
        <div class="status-header">
          <span class="status-badge" :class="`status-${imageUploadStatus.status}`">
            {{ statusTextMap[imageUploadStatus.status] }}
          </span>
          <span v-if="imageUploadStatus.status === 'uploading'" class="upload-percent">
            上传中... {{ Math.round(imageUploadStatus.progress) }}%
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${imageUploadStatus.progress}%` }"
            :class="{ completed: imageUploadStatus.status === 'success' }"
          />
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <div v-if="queueLength > 0" class="queue-bar-left">
        <span class="queue-icon">⚡</span>
        <span>{{ queueLength }}个任务进行中</span>
      </div>
      <div v-else></div>
      <div class="btn-group">
        <button
          class="btn btn-secondary"
          :disabled="!hasFiles || ((task && task.status === 'uploading') ?? false) || props.disabled"
          @click="$emit('remove')"
        >
          {{ isVideoMode ? '移除视频' : '移除全部图片' }}
        </button>
        <button
          v-if="isUploading"
          class="btn btn-danger"
          @click="$emit('cancel')"
        >
          取消上传
        </button>
        <button
          v-else
          class="btn btn-primary"
          :disabled="!canSubmit"
          @click="$emit('submit')"
        >
          开始生成模型
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { Spin as aSpin } from 'ant-design-vue'
import { ClockCircleOutlined, CloseOutlined, FileOutlined, SettingOutlined, ExclamationCircleOutlined, PlusOutlined, DownOutlined, UpOutlined } from '@ant-design/icons-vue'

type UploadTaskStatus = 'pending' | 'uploading' | 'success' | 'failed' | 'cancelled'

interface UploadTaskView {
  id: string
  name: string
  size: number
  durationSec: number
  previewUrl: string
  progress: number
  status: UploadTaskStatus
  uploadType?: 'video' | 'image'
}

interface ImageFile {
  id: string
  name: string
  size: number
  previewUrl: string
}

const props = defineProps<{
  task: UploadTaskView | null
  imageFiles: ImageFile[]
  currentPoints: number
  consumedPoints: number
  isProcessing?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'open-advanced': []
  remove: []
  submit: []
  cancel: []
  'remove-image': [imageId: string]
  'add-image': []
  'queue-update': [length: number]
}>()

// 内部队列状态
const queueLength = ref(0)

// 获取队列信息
import API from '@/utils/api'
import { ApiServer } from '@/utils/taskService'

const fetchQueueLength = async () => {
  try {
    const response = await ApiServer.request({
      url: API.GET_TASK_QUEUE,
      method: 'post',
    })
    queueLength.value = response.data?.length || 0
    emit('queue-update', queueLength.value)
  } catch (error) {
    console.error('获取队列失败:', error)
    queueLength.value = 0
  }
}

// 组件挂载时获取队列
onMounted(() => {
  fetchQueueLength()
})

defineExpose({
  queueLength,
  refreshQueue: fetchQueueLength
})

// 图片展示相关
const getMaxDisplayImages = () => {
  return window.innerWidth <= 768 ? 15 : 30
}
const showAllImages = ref(false)
const displayedImages = computed(() => {
  if (showAllImages.value) return props.imageFiles
  return props.imageFiles.slice(0, getMaxDisplayImages())
})

const hasFiles = computed(() => {
  return !!props.task || (props.imageFiles && props.imageFiles.length > 0)
})

// 判断当前上传类型
const uploadTypeText = computed(() => {
  if (props.task) return '视频任务'
  if (props.imageFiles && props.imageFiles.length > 0) return '图片任务'
  return '任务'
})

// 判断是否为视频模式
const isVideoMode = computed(() => {
  return !!props.task && props.task.uploadType !== 'image'
})

// 图片上传时的任务状态（从 imageFiles 推断）
const imageUploadStatus = computed(() => {
  if (props.task?.uploadType === 'image') {
    return props.task
  }
  return null
})

// 判断是否有上传正在进行
const isUploading = computed(() => {
  if (props.task?.status === 'uploading') return true
  if (imageUploadStatus.value?.status === 'uploading') return true
  return false
})

const canSubmit = computed(() => {
  if (props.task) {
    return ['pending', 'failed', 'cancelled'].includes(props.task.status)
  }
  // 图片模式：没有上传任务或任务已完成/失败/取消时可以提交
  if (imageUploadStatus.value) {
    return ['pending', 'failed', 'cancelled', 'success'].includes(imageUploadStatus.value.status)
  }
  return props.imageFiles && props.imageFiles.length > 0
})

const isPointsInsufficient = computed(() => {
  return props.currentPoints < props.consumedPoints
})

const remainingPoints = computed(() => {
  return Math.max(0, props.currentPoints - props.consumedPoints)
})

const statusTextMap: Record<UploadTaskStatus, string> = {
  pending: '待上传',
  uploading: '上传中',
  success: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--'
  const total = Math.floor(seconds)
  const mm = Math.floor(total / 60).toString().padStart(2, '0')
  const ss = (total % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

// 视频解码错误处理
const videoErrorShown = ref(false)
const videoWarning = ref('')

const handleVideoError = (e: Event) => {
  const video = e.target as HTMLVideoElement
  if (videoErrorShown.value) return

  // MediaError 对象
  const error = video?.error
  if (!error) return

  videoErrorShown.value = true

  // error.code:
  // 1 = MEDIA_ERR_ABORTED - 取缔
  // 2 = MEDIA_ERR_NETWORK - 网络错误
  // 3 = MEDIA_ERR_DECODE - 解码错误
  // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED - 资源不支持

  let errorMessage = '视频无法播放'

  switch (error.code) {
    case 3:
      errorMessage = '视频编码不支持，无法解码播放（可能是 H.265/HEVC 等格式）'
      break
    case 4:
      errorMessage = '视频格式不支持'
      break
    case 2:
      errorMessage = '视频加载失败，请检查网络'
      break
    case 1:
      errorMessage = '视频加载被中断'
      break
    default:
      errorMessage = '视频无法播放'
  }

  message.warning(errorMessage)
}

const handleVideoStalled = () => {
  // 视频加载卡顿时提示
  message.info('视频加载中，请稍候...')
}

// 检测视频画面是否正常（黑屏检测）
let videoCheckTimeout: ReturnType<typeof setTimeout> | null = null

const handleVideoLoadedData = (e: Event) => {
  const video = e.target as HTMLVideoElement

  // 清除之前的超时
  if (videoCheckTimeout) {
    clearTimeout(videoCheckTimeout)
  }

  // 设置超时检测：1秒后检查视频是否黑屏
  videoCheckTimeout = setTimeout(() => {
    checkVideoBlackScreen(video)
  }, 1000)
}

const handleVideoTimeout = () => {
  // 视频加载超时
  message.warning('视频加载超时')
}

const checkVideoBlackScreen = (video: HTMLVideoElement) => {
  
  try {
    videoWarning.value = ""
    // 创建 canvas 来检测画面
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState < 2) {
      return // 视频数据不够
    }

    canvas.width = 320 // 缩小检测以提高性能
    canvas.height = 180

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // 计算画面平均亮度
    let totalBrightness = 0
    let pixelCount = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      // 使用感知亮度公式: 0.299*R + 0.587*G + 0.114*B
      const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      totalBrightness += brightness
    }

    const avgBrightness = totalBrightness / pixelCount

    // 如果平均亮度很低（小于 5），很可能是黑屏
    if (avgBrightness < 5) {
      videoWarning.value = '视频无法正常播放（可能是编码不支持），仍然可以生成模型'
    }
  } catch (err) {
    // 跨域等问题导致的检测失败，静默处理
    console.log('视频画面检测失败:', err)
  }
}
</script>

<style scoped>
.upload-progress {
  background: var(--glass-surface);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 24px;
}

.progress-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 0 0 auto;
  white-space: nowrap;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 12px;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  white-space: nowrap;
}

.points-help-icon {
  font-size: 18px;
  color: #767168;
  transition: all 0.2s ease;
}

.points-help-icon:hover {
  transform: scale(1.1);
}

.queue-info {
  display: inline-flex;
  align-items: center;
}

.queue-badge {
  font-size: 11px;
  padding: 4px 10px;
  background: rgba(250, 173, 20, 0.15);
  color: #d48806;
  border-radius: 999px;
  font-weight: 600;
}

.points-warning {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 10px;
  background: rgba(245, 34, 45, 0.15);
  color: #cf1322;
  border-radius: 6px;
  font-weight: 600;
  border: 1px solid rgba(245, 34, 45, 0.3);
}

.points-tooltip-content {
  font-size: 12px;
  line-height: 1.8;
}

.points-tooltip-content p {
  margin: 0;
}

.advanced-btn {
  border: 1px solid var(--glass-border);
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  border-radius: 8px;
  font-size: 12px;
  padding: 7px 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.advanced-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.28);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.file-item {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.file-item.pending {
  background: #ffffff;
}

.file-item.uploading {
  background: #ffffff;
}

.file-item.success {
  background: #ffffff;
}

.file-item.cancelled {
  background: #ffffff;
}

.file-item.failed {
  background: #ffffff;
  border-color: #ff4d4f;
}

.video-preview {
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  background: #ffffff;
  flex-shrink: 0;
  position: relative;
  aspect-ratio: 16 / 9;
}

.video-warning {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 10px;
  background: rgba(250, 140, 22, 0.95);
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.4;
}

.preview-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: rgba(245, 34, 45, 0.9);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.preview-remove:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.video-preview video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

/* 图片上传样式 */
.image-list {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--glass-border);
}

.image-count-info {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.image-count-info strong {
  color: var(--accent-blue);
  font-weight: 600;
}

.expand-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--accent-blue);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.expand-hint:hover {
  text-decoration: underline;
}

/* 更多图片按钮 */
.more-images {
  background: var(--glass-surface);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 收起按钮 */
.collapse-btn {
  background: var(--glass-surface);
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 11px;
}

.more-count {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* 图片上传状态 */
.image-upload-status {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--glass-surface);
  border-radius: 8px;
  border: 1px solid var(--glass-border);
}

.image-upload-status .status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.image-upload-status .upload-percent {
  font-size: 12px;
  color: var(--text-secondary);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  position: relative;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-item:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.add-more-image {
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px dashed var(--glass-border);
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.add-more-image:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.08);
}

.add-more-image :deep(.anticon) {
  font-size: 24px;
}

.add-more-image .add-more-text {
  font-size: 11px;
  text-align: center;
}

.add-more-image.is-processing {
  cursor: wait;
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

/* 图片处理中的动画遮罩 */
.image-processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10;
}

.image-processing-overlay :deep(.anticon) {
  font-size: 24px;
  color: white;
}

.image-processing-overlay span {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-preview :deep(.ant-image) {
  width: 100%;
  height: 100%;
}

.image-preview :deep(.ant-image-img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview .preview-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  font-size: 11px;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: rgba(0, 0, 0, 0.6);
}

.image-item:hover .preview-remove {
  opacity: 1;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 6px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-name {
  font-size: 10px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  font-size: 11px;
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 600;
  border: 1px solid transparent;
}

.status-pending,
.status-uploading {
  color: #1677ff;
  background: rgba(22, 119, 255, 0.12);
  border-color: rgba(22, 119, 255, 0.24);
}

.status-success {
  color: #389e0d;
  background: rgba(82, 196, 26, 0.16);
  border-color: rgba(82, 196, 26, 0.3);
}

.status-failed {
  color: #cf1322;
  background: rgba(245, 34, 45, 0.16);
  border-color: rgba(245, 34, 45, 0.28);
}

.status-cancelled {
  color: #d48806;
  background: rgba(250, 173, 20, 0.18);
  border-color: rgba(250, 173, 20, 0.3);
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
  background: var(--glass-surface);
  border-radius: 999px;
  padding: 4px 8px;
}

.progress-bar {
  height: 4px;
  background: var(--glass-border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: var(--accent-blue);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-fill.completed {
  background: var(--accent-green);
}

.file-status {
  font-size: 12px;
  color: var(--text-secondary);
}

.completed-text {
  color: var(--accent-green);
}

.cancelled-text {
  color: #faad14;
}

.error-text {
  color: var(--accent-pink);
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}

.queue-bar-left {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(250, 173, 20, 0.1);
  border-radius: 16px;
  color: #d48806;
  font-size: 11px;
  font-weight: 500;
}

.queue-bar-left .queue-icon {
  font-size: 11px;
}

.btn-group {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-height: 44px;
}

.btn-primary {
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #ff6b6b, #d9363e);
  color: #fff;
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(217, 54, 62, 0.24);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(10, 132, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
}

.btn-secondary:hover {
  background: var(--glass-surface);
  border-color: var(--glass-border-hover);
}

/* Responsive */
@media (max-width: 1279px) {
  .image-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

@media (max-width: 1023px) {
  .image-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 768px) {
  .upload-progress {
    padding: 16px;
  }

  .progress-header {
    align-items: center;
    flex-direction: row;
    flex-wrap: nowrap;
  }

  .header-actions {
    flex: 1;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .header-actions::-webkit-scrollbar {
    display: none;
  }

  .file-item {
    padding: 12px;
  }

  .file-icon {
    width: 36px;
    height: 36px;
  }

  .file-item {
    grid-template-columns: 1fr;
  }

  .file-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .video-preview {
    width: 100%;
  }

  .image-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .add-more-image .add-more-text {
    display: none;
  }

  .add-more-image {
    background: #ffffff;
    border-color: var(--accent-blue);
    color: #1677ff;
  }

  .add-more-image :deep(.anticon) {
    color: currentColor;
  }

  .add-more-image :deep(svg) {
    fill: currentColor;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .queue-bar-left {
    width: 100%;
    justify-content: center;
  }

  .btn {
    width: 100%;
    padding: 14px 20px;
    font-size: 15px;
    border-radius: 12px;
  }

  .btn-group {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .btn-secondary {
    order: 1;
  }

  .btn-primary,
  .btn-danger {
    order: 0;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .progress-title {
    font-size: 15px;
    white-space: nowrap;
  }

  .header-actions {
    gap: 6px;
  }

  .points-warning {
    font-size: 11px;
    padding: 3px 8px;
    white-space: nowrap;
  }

  .advanced-btn {
    padding: 6px 10px;
    font-size: 12px;
    white-space: nowrap;
  }

  .file-item {
    gap: 10px;
  }

  .video-preview {
    border-radius: 12px;
  }

  .image-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }

  .image-item,
  .add-more-image {
    border-radius: 10px;
  }

  .image-preview .preview-remove {
    opacity: 1;
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .image-overlay {
    opacity: 1;
  }

  .image-name {
    font-size: 11px;
  }

  .add-more-image .add-more-text {
    font-size: 12px;
  }
}
</style>
