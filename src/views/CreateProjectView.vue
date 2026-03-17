<template>
  <div class="create-project-page" :data-theme="themeStore.appliedTheme">
    <AnimatedBackground />

    <div class="create-project-container">
      <!-- Tutorial Component -->
      <UploadTutorial ref="tutorialRef" />

      <!-- Back Button -->
      <button class="back-btn" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        {{ t('login.back') }}
      </button>

      <!-- Header -->
      <div class="create-header">
        <h1>{{ t('create.title') }}</h1>
        <p class="subtitle">{{ t('create.subtitle') }}</p>
      </div>

      <!-- Upload Area -->
      <FileUpload
        @upload="handleUpload"
        :max-image-count="MAX_IMAGE_COUNT"
        :max-video-duration-seconds="MAX_VIDEO_DURATION_SECONDS"
        :compact="hasUploadedFiles"
      />

      <!-- Upload Progress Area -->
      <div class="upload-progress-wrapper" v-if="hasUploadedFiles">
        <!-- Upload Progress -->
        <UploadProgress
          :task="uploadTask"
          :image-files="imageFiles"
          :current-points="currentPoints"
          :consumed-points="consumedPoints"
          @open-advanced="openAdvancedDrawer"
          @remove="removeFile"
          @cancel="cancelUpload"
          @submit="submitProject"
          @remove-image="removeImage"
          @add-image="triggerAddMoreImages"
        />
      </div>

      <a-drawer
        :open="showAdvancedOptions"
        title="高级选项"
        placement="right"
        :width="380"
        @close="closeAdvancedDrawer"
      >
        <div class="advanced-panel">
          <!-- 基础信息 -->
          <div class="form-group">
            <label class="form-label">
              <FileTextOutlined />
              任务名称
            </label>
            <a-input
              v-model:value="advancedForm.taskName"
              placeholder="默认取视频文件名"
              allow-clear
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              <ProfileOutlined />
              模型描述
            </label>
            <a-textarea
              v-model:value="advancedForm.userObjectDescription"
              :rows="3"
              placeholder="可选，默认为空"
              show-count
              :maxlength="300"
            />
          </div>

          <!-- 生成选项 -->
          <div class="options-group">
            <div class="switch-row">
              <div class="switch-left">
                <BgColorsOutlined class="option-icon bg" />
                <div class="switch-info">
                  <span class="switch-label">背景移除</span>
                  <span class="switch-desc">自动分离主体，减少环境干扰</span>
                </div>
              </div>
              <a-switch v-model:checked="advancedForm.bgRemove" />
            </div>
          </div>

          <!-- 算力点消耗 -->
          <div class="points-consume">
            <div class="points-header">
              <span class="points-label">
                <ThunderboltOutlined />
                算力点消耗
              </span>
              <span class="points-total">-{{ consumedPoints }}</span>
            </div>
            <div class="points-detail">
              <span>基础重建</span>
              <span class="point-value">-{{ getRuleValue('base') }}</span>
            </div>
            <div class="points-detail" v-if="advancedForm.bgRemove">
              <span>背景移除</span>
              <span class="point-value">-{{ getRuleValue('bg_remove') }}</span>
            </div>
          </div>

          <!-- 说明 -->
          <div class="info-tip">
            <InfoCircleOutlined />
            <span>bg_remove_paras 使用默认参数上传；FPS 固定为 10</span>
          </div>
        </div>
      </a-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  BgColorsOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ProfileOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue'
import { useThemeStore } from '../stores/theme'
import { usePointsStore } from '@/stores/points'
import AnimatedBackground from '../components/AnimatedBackground.vue'
import FileUpload from '../components/FileUpload.vue'
import UploadProgress from '../components/UploadProgress.vue'
import UploadTutorial from '../components/UploadTutorial.vue'
import API from '@/utils/api'
import { ApiServer } from '@/utils/taskService'

const router = useRouter()
const { t } = useI18n()
const themeStore = useThemeStore()
const pointsStore = usePointsStore()

type UploadTaskStatus = 'pending' | 'uploading' | 'success' | 'failed' | 'cancelled'
type UploadType = 'video' | 'image'

interface UploadTask {
  id: string
  name: string
  size: number
  file: File
  durationSec: number
  previewUrl: string
  status: UploadTaskStatus
  progress: number
  abortController: AbortController | null
  uploadType: UploadType
}

interface ImageFile {
  id: string
  name: string
  size: number
  file: File
  previewUrl: string
}

const uploadTask = ref<UploadTask | null>(null)
const imageFiles = ref<ImageFile[]>([])
const tutorialRef = ref<InstanceType<typeof UploadTutorial> | null>(null)

const showAdvancedOptions = ref(false)

// 检查是否已上传文件
const hasUploadedFiles = computed(() => {
  return !!(uploadTask.value || imageFiles.value.length > 0)
})

const DEFAULT_BG_REMOVE_PARAMS = {
  object_name: 'object',
  frame_idx: 0,
  points: [],
  box: null,
  auto_mask: 1,
}

const advancedForm = ref({
  taskName: '',
  bgRemove: true,
  userObjectDescription: '',
})

const MAX_VIDEO_DURATION_SECONDS = 3 * 60
const MAX_IMAGE_COUNT = 150

// 获取积分规则和当前积分
onMounted(async () => {
  try {
    await Promise.all([
      pointsStore.getPointsRules(),
      pointsStore.getPoints()
    ])
  } catch (error) {
    console.error('获取积分信息失败:', error)
  }
})

// 当前剩余积分
const currentPoints = computed(() => pointsStore.current_points)

// 计算将消耗的积分
const consumedPoints = computed(() => {
  const rules = pointsStore.points_rules as Record<string, number> | null
  if (!rules || typeof rules !== 'object') return 0

  let total = rules.base || 0 // 基础重建需要算力点
  if (advancedForm.value.bgRemove) {
    total += rules.bg_remove || 0
  }
  return total
})

// 获取规则值
const getRuleValue = (key: string) => {
  const rules = pointsStore.points_rules as Record<string, number> | null
  if (!rules || typeof rules !== 'object') return 0
  return rules[key] || 0
}

const goBack = () => {
  router.back()
}

const getTaskNameFromFile = (fileName: string) => {
  const pureName = (fileName || '').trim()
  if (!pureName) return 'task'
  return pureName.split('.').slice(0, -1).join('.') || pureName
}

const revokePreviewUrl = () => {
  if (!uploadTask.value?.previewUrl) return
  URL.revokeObjectURL(uploadTask.value.previewUrl)
}

const resolveVideoDuration = (file: File): Promise<number> => {
  const type = file.type.split("/")[1]
  return new Promise((resolve, reject) => {
    const tempUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(tempUrl)
      reject(new Error('视频读取超时，请确保视频格式正确'))
    }, 10000)

    video.onloadedmetadata = () => {
      clearTimeout(timeout)
      const duration = Number(video.duration || 0)
      URL.revokeObjectURL(tempUrl)
      resolve(duration)
    }
    video.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(tempUrl)
      // 更详细的错误信息
      const error = video.error
      console.log("error", error);
      let errorMsg = '读取视频时长失败'
      if (error) {
        // MediaError 错误码:
        // 1 = MEDIA_ERR_ABORTED - 取缔/加载中断
        // 2 = MEDIA_ERR_NETWORK - 网络错误
        // 3 = MEDIA_ERR_DECODE - 解码错误（最常见于 H.265/HEVC 等编码）
        // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED - 格式/容器不支持
        switch (error.code) {
          case 1:
            errorMsg = '视频加载被中断'
            break
          case 2:
            errorMsg = '视频加载失败，请检查网络连接'
            break
          case 3:
            errorMsg = '视频编码不支持（可能是 H.265/HEVC 编码，请转换为 H.264 编码）'
            break
          case 4:
            errorMsg = `视频格式不支持（${type || '该'}格式浏览器无法解析）`
            break
          default:
            errorMsg = '视频无法播放'
        }
      }
      reject(new Error(errorMsg))
    }
    video.src = tempUrl
  })
}

const handleUpload = async (files: File[]) => {
  const file = Array.isArray(files) ? files[0] : files
  console.log('Selected file:', file)
  if (!file) return
  if(file.type.startsWith('image/')) {
    if(files?.length > MAX_IMAGE_COUNT) {
      message.warning(`最多支持上传${MAX_IMAGE_COUNT}张图片`)
      return
    }

    // 处理图片上传 - 清空视频
    if (uploadTask.value?.status === 'uploading' && uploadTask.value.abortController) {
      uploadTask.value.abortController.abort()
    }
    revokePreviewUrl()
    uploadTask.value = null

    // 处理图片列表
    imageFiles.value = files.map(f => ({
      id: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }))

    // 默认任务名称为第一张图片的名称
    if (files.length > 0) {
      advancedForm.value.taskName = getTaskNameFromFile(files[0].name)
    }
    return
  }else if (file.type.startsWith('video/')) {

    // 检查是否上传了多个视频
    if (files.length > 1) {
      message.info('已选择多个视频，将只处理第一个视频')
    }

    // 处理视频上传 - 清空图片
    imageFiles.value.forEach(img => {
      URL.revokeObjectURL(img.previewUrl)
    })
    imageFiles.value = []

    try {
      const durationSec = await resolveVideoDuration(file)
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        message.error('无法识别视频时长，请更换文件重试')
        return
      }
      if (durationSec > MAX_VIDEO_DURATION_SECONDS) {
        message.warning(`视频时长不能超过 ${MAX_VIDEO_DURATION_SECONDS / 60} 分钟`)
        return
      }

      if (uploadTask.value?.status === 'uploading' && uploadTask.value.abortController) {
        uploadTask.value.abortController.abort()
      }
      revokePreviewUrl()

      uploadTask.value = {
        id: Math.random().toString(36).slice(2),
        name: file.name,
        size: file.size,
        file,
        durationSec,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
        abortController: null,
        uploadType: 'video',
      }

      advancedForm.value.taskName = getTaskNameFromFile(file.name)
    } catch (error: any) {
      message.error(error?.message || '读取视频信息失败')
    }
  }
}

const removeFile = () => {
  if (uploadTask.value?.status === 'uploading') {
    message.info('上传进行中，请先取消上传')
    return
  }
  revokePreviewUrl()
  uploadTask.value = null
  // 同时清理图片
  imageFiles.value.forEach(img => {
    URL.revokeObjectURL(img.previewUrl)
  })
  imageFiles.value = []
  showAdvancedOptions.value = false
}

const removeImage = (imageId: string) => {
  const index = imageFiles.value.findIndex(img => img.id === imageId)
  if (index !== -1) {
    URL.revokeObjectURL(imageFiles.value[index].previewUrl)
    imageFiles.value.splice(index, 1)
    // 如果删除了所有图片，清空任务名称
    if (imageFiles.value.length === 0) {
      advancedForm.value.taskName = ''
    }
  }
}

// 添加更多图片
const triggerAddMoreImages = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files
    if (!files || files.length === 0) return
    const type=imageFiles.value[0]?.file.type || ''
    const isvValidFiles = Array.from(files).every(file => file.type === type)
    if(!isvValidFiles) {
      message.warning('上传的图像后缀与原来的不一致，请重新选择')
      return
    }

    // 检查总图片数量
    const totalCount = imageFiles.value.length + files.length
    if (totalCount > MAX_IMAGE_COUNT) {
      message.warning(`最多只能上传 ${MAX_IMAGE_COUNT} 张图片`)
      return
    }

    // 添加新图片到现有列表
    const newImages = Array.from(files).map(f => ({
      id: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }))

    imageFiles.value = [...imageFiles.value, ...newImages]
  }
  input.click()
}

const openAdvancedDrawer = () => {
  console.log("打开高级选项")
  if (!uploadTask.value && imageFiles.value.length === 0) return
  showAdvancedOptions.value = true
}

const closeAdvancedDrawer = () => {
  if (uploadTask.value && !advancedForm.value.taskName.trim()) {
    advancedForm.value.taskName = getTaskNameFromFile(uploadTask.value.name)
  }
  if(imageFiles.value.length > 0 && !advancedForm.value.taskName.trim()) {
    advancedForm.value.taskName = getTaskNameFromFile(imageFiles.value[0].name)
  }
  showAdvancedOptions.value = false
}

const cancelUpload = () => {
  if (!uploadTask.value || uploadTask.value.status !== 'uploading') return
  uploadTask.value.abortController?.abort()
}

const submitProject = async () => {
  if (!uploadTask.value) {
    message.warning('请先选择视频文件')
    return
  }

  if (uploadTask.value.status === 'uploading') return

  // 检查算力点是否充足
  if (currentPoints.value < consumedPoints.value) {
    message.warning('算力点不足，请充值后继续')
    return
  }

  const currentTask = uploadTask.value
  currentTask.status = 'uploading'
  currentTask.progress = 0
  currentTask.abortController = new AbortController()

  const formData = new FormData()
  const normalizedTaskName = advancedForm.value.taskName.trim() || getTaskNameFromFile(currentTask.name)
  const params = {
    task_name: normalizedTaskName,
    fps: 10,
    bg_remove: !!advancedForm.value.bgRemove,
    bg_remove_paras: DEFAULT_BG_REMOVE_PARAMS,
    public: false,
    user_object_description: advancedForm.value.userObjectDescription || '',
  }


  formData.append('params', JSON.stringify(params))
  formData.append('videos', currentTask.file, currentTask.name)

  try {
    const token = localStorage.getItem('token') || undefined

    await ApiServer.request({
      url: API.UPLOAD_TASK,
      method: 'post',
      data: formData,
      timeout: 10 * 60 * 1000, // 10分钟超时
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: currentTask.abortController.signal,
      onUploadProgress: (event) => {
        if (!uploadTask.value || uploadTask.value.id !== currentTask.id) return
        if (!event.total || event.total <= 0) return
        const percent = Math.round((event.loaded / event.total) * 100)
        uploadTask.value.progress = Math.max(0, Math.min(100, percent))
      },
    }, token)

    if (!uploadTask.value || uploadTask.value.id !== currentTask.id) return
    uploadTask.value.status = 'success'
    uploadTask.value.progress = 100
    uploadTask.value.abortController = null
    message.success('上传成功，模型开始生成')
    // 刷新算力点
    pointsStore.getPoints()

    window.setTimeout(() => {
      if (!uploadTask.value || uploadTask.value.id !== currentTask.id) return
      if (uploadTask.value.status !== 'success') return
      revokePreviewUrl()
      uploadTask.value = null
      showAdvancedOptions.value = false
    }, 1200)
  } catch (error: any) {
    if (!uploadTask.value || uploadTask.value.id !== currentTask.id) return
    const isCanceled = error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
    uploadTask.value.abortController = null

    if (isCanceled) {
      uploadTask.value.status = 'cancelled' 
      uploadTask.value.progress = 0
      message.info('已取消上传')
      return
    }

    uploadTask.value.status = 'failed'
    message.error(error?.message || '上传失败，请重试')
  }
}

onBeforeUnmount(() => {
  if (uploadTask.value?.status === 'uploading') {
    uploadTask.value.abortController?.abort()
  }
  revokePreviewUrl()
})
</script>

<style scoped>
/* Upload Progress Transition */
.slide-fade-enter-active {
  animation: slideUpFadeIn 0.4s ease;
}

.slide-fade-leave-active {
  animation: fadeOut 0.3s ease;
}

@keyframes slideUpFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.create-project-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
}

.create-project-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 32px;
}

.back-btn:hover {
  background: var(--glass-surface-hover);
  color: var(--text-primary);
}

.upload-progress-wrapper {
  position: relative;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap:12px;
}

.reupload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  background: var(--glass-surface);
  border: 2px dashed var(--glass-border);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  top: 0;
  left: 0;
  z-index: 10;
}

.reupload-btn:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.08);
  transform: scale(1.01);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
}

.reupload-btn :deep(.anticon) {
  font-size: 20px;
}

.create-header {
  text-align: center;
  margin-bottom: 40px;
}

.create-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.advanced-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-label :deep(.anticon) {
  color: var(--accent-blue);
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--glass-border);
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.switch-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-icon {
  font-size: 18px;
  padding: 8px;
  border-radius: 8px;
}

.option-icon.bg {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
}

.switch-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.switch-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.switch-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.info-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 12px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 8px;
  line-height: 1.5;
}

.info-tip :deep(.anticon) {
  color: #6366f1;
  margin-top: 2px;
  flex-shrink: 0;
}

/* 算力点消耗 */
.points-consume {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.points-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(239, 68, 68, 0.2);
}

.points-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #ef4444;
}

.points-label :deep(.anticon) {
  font-size: 14px;
}

.points-total {
  font-size: 20px;
  font-weight: 700;
  color: #ef4444;
}

.points-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 6px 0;
}

.point-value {
  font-weight: 500;
  color: #f59e0b;
}

/* 算力点信息 */
.points-info {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--glass-border);
}

.points-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.points-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.points-help {
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

.points-help:hover {
  color: var(--accent-blue);
}

.points-tooltip {
  font-size: 12px;
  line-height: 1.8;
}

.points-tooltip p {
  margin: 0;
}

.points-detail {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.current-points {
  color: var(--text-primary);
  font-weight: 500;
}

.consumed {
  color: #ef4444;
}

.remaining {
  color: #10b981;
  font-weight: 500;
}

.remaining.warning {
  color: #ef4444;
}

/* Responsive */
@media (max-width: 768px) {
  .create-project-container {
    padding: 20px 16px;
  }

  .create-header h1 {
    font-size: 20px;
  }

  .back-btn {
    margin-bottom: 24px;
  }

  .switch-item {
    align-items: flex-start;
    flex-direction: column;
  }
}

/* 上传区域缩小动画 */
:deep(.file-upload.upload-mini) {
  transform: scale(0.85);
  transition: all 0.3s ease;
}

:deep(.file-upload.upload-mini:hover) {
  transform: scale(1);
  opacity: 1;
}
</style>
