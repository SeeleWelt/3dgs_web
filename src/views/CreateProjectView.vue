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
        <p class="subtitle desktop-only">{{ t('create.subtitle') }}</p>
        <button class="help-btn mobile-only" @click="showHelp = true">
          <QuestionCircleOutlined />
          {{ t('create.help.button') }}
        </button>
      </div>

      <!-- 帮助说明弹窗 -->
      <a-modal
        v-model:open="showHelp"
        :title="t('create.help.title')"
        :footer="null"
        width="320px"
      >
        <div class="help-content">
          <p><strong>{{ t('create.help.supportedFormats') }}</strong></p>
          <p>{{ t('create.help.imageSpec', { minImages: MIN_IMAGE_COUNT, maxImages: MAX_IMAGE_COUNT }) }}</p>
          <p>{{ t('create.help.videoSpec') }}</p>
          <p class="help-tip">{{ t('create.help.qualityTip') }}</p>
          <div class="help-highlight">
            <InfoCircleOutlined />
            <span>{{ t('create.imageUploadConsistencyTip') }}</span>
          </div>
        </div>
      </a-modal>

      <!-- Upload Area Wrapper with Processing Overlay -->
      <div class="upload-area-wrapper">
        <!-- Loading Animation when processing files - covers both upload and progress areas -->
        <div v-if="isProcessingFiles" class="processing-overlay-full">
          <div class="processing-content">
            <a-spin size="large" />
            <p class="processing-text">
              <template v-if="processingStage === 'checking'">正在检查文件分辨率...</template>
              <template v-else-if="processingStage === 'resizing'">正在降低图片分辨率...</template>
              <template v-else>正在处理文件，请稍候...</template>
            </p>
            <div v-if="processingProgress > 0 && processingStage === 'resizing'" class="processing-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${processingProgress}%` }"></div>
              </div>
              <span class="progress-text">{{ processingProgress }}%</span>
            </div>
            <p class="processing-file" v-if="processingFileName">{{ processingFileName }}</p>
          </div>
        </div>

        <div
          v-if="(!uploadTask || uploadTask.uploadType !== 'video')"
          class="upload-consistency-tip"
        >
          <InfoCircleOutlined />
          <span>{{ t('create.imageUploadConsistencyTip') }}</span>
        </div>

        <FileUpload
          @upload="handleUpload"
          :max-image-count="MAX_IMAGE_COUNT"
          :max-video-duration-seconds="MAX_VIDEO_DURATION_SECONDS"
          :compact="hasUploadedFiles"
          :min-image-count="MIN_IMAGE_COUNT"
          :min-video-duration-seconds="MIN_VIDEO_DURATION"
          :disabled="isUploading"
        />

        <!-- Upload Progress Area -->
        <div class="upload-progress-wrapper" v-if="hasUploadedFiles">
          <!-- Upload Progress -->
          <UploadProgress
            :task="uploadTask"
            :image-files="imageFiles"
            :current-points="currentPoints"
            :consumed-points="consumedPoints"
            :is-processing="isProcessingAddingImages"
            :disabled="isUploading"
            @open-advanced="openAdvancedDrawer"
            @remove="removeFile"
            @cancel="cancelUpload"
            @submit="submitProject"
            @remove-image="removeImage"
            @add-image="triggerAddMoreImages"
          />
        </div>
      </div>

      <a-drawer
        :open="showAdvancedOptions"
        title="高级选项"
        placement="right"
        width="min(520px, 100vw)"
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
import { message, Spin as aSpin, Modal as aModal } from 'ant-design-vue'
import {
  BgColorsOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
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
  thumbnailUrl?: string  // 缩略图 URL，用于优化预览性能
}

const uploadTask = ref<UploadTask | null>(null)
const imageFiles = ref<ImageFile[]>([])
// 分辨率参数
const RESOLUTION_1K = { width: 1920, height: 1080 }
const RESOLUTION_2K = { width: 2560, height: 1440 }
const RESOLUTION_4K = { width: 3840, height: 2160 }
const RESOLUTION_8K = { width: 7680, height: 4320 }

// 默认 8K 分辨率
const DEFAULT_MAX_RESOLUTION = RESOLUTION_8K

// 获取分辨率标签
const getResolutionLabel = (width: number, height: number): string => {
  if (width >= RESOLUTION_8K.width || height >= RESOLUTION_8K.height) return '8K'
  if (width >= RESOLUTION_4K.width || height >= RESOLUTION_4K.height) return '4K'
  if (width >= RESOLUTION_2K.width || height >= RESOLUTION_2K.height) return '2K'
  if (width >= RESOLUTION_1K.width || height >= RESOLUTION_1K.height) return '1K'
  return `${width}x${height}`
}

const getMaxResolution = () => DEFAULT_MAX_RESOLUTION

// 处理状态类型
type ProcessingStage = 'idle' | 'checking' | 'resizing' | 'complete'

// 处理状态
const processingStage = ref<ProcessingStage>('idle')
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
      if (video.videoWidth > video.videoHeight) {
        resolve({ width: video.videoWidth, height: video.videoHeight })
      } else {
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

// 降低图片分辨率
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img

      // 计算缩放后的尺寸
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // 创建 canvas 进行缩放
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        // 导出为 JPEG 格式
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src)
          if (blob) {
            const resizedFile = new File([blob], file.name, { type: 'image/jpeg' })
            resolve(resizedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.92)
      } else {
        URL.revokeObjectURL(img.src)
        resolve(file)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      resolve(file)
    }
    img.src = URL.createObjectURL(file)
  })
}

// 检查并处理文件分辨率
const checkAndProcessResolution = async (
  files: File[],
  fileType: 'image' | 'video'
): Promise<{ files: File[]; resized: boolean }> => {
  const maxRes = getMaxResolution()
  let hasResized = false

  // 开始检查分辨率阶段
  processingStage.value = 'checking'
  processingProgress.value = 0

  const processedFiles: File[] = []

  for (let i = 0; i < files.length; i++) {
    processingFileName.value = files[i].name

    let dimensions: { width: number; height: number }

    if (fileType === 'image') {
      dimensions = await getImageDimensions(files[i])
    } else {
      dimensions = await getVideoDimensions(files[i])
    }

    if (dimensions.width === 0 || dimensions.height === 0) {
      // 获取失败时默认通过
      processedFiles.push(files[i])
      continue
    }

    // 检查是否需要降低分辨率
    if (dimensions.width > maxRes.width || dimensions.height > maxRes.height) {
      if (fileType === 'image') {
        // 检查阶段完成后增加小延迟，让用户能看到阶段切换
        if (i === 0) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        // 开始降低分辨率阶段，每个文件单独显示进度
        processingStage.value = 'resizing'
        processingProgress.value = 0
        // 使用 requestAnimationFrame 让 UI 先渲染 0%
        await new Promise(resolve => requestAnimationFrame(resolve))
        const resizedFile = await resizeImage(files[i], maxRes.width, maxRes.height)
        processingProgress.value = 100
        processedFiles.push(resizedFile)
        hasResized = true
      } else {
        // 视频超出分辨率限制，给出警告但不处理
        message.warning(
          `文件 "${files[i].name}" 分辨率 (${dimensions.width}x${dimensions.height}) 超过限制 (${getResolutionLabel(maxRes.width, maxRes.height)})`
        )
        processedFiles.push(files[i])
      }
    } else {
      processedFiles.push(files[i])
    }
  }

  processingStage.value = 'complete'
  processingProgress.value = 100

  return { files: processedFiles, resized: hasResized }
}

const tutorialRef = ref<InstanceType<typeof UploadTutorial> | null>(null)
const isProcessingFiles = ref(false)  // 是否正在处理文件（生成缩略图等）
const isProcessingAddingImages = ref(false)  // 是否正在处理添加更多图片的操作

const showAdvancedOptions = ref(false)
const showHelp = ref(false)

// 检查是否已上传文件
const hasUploadedFiles = computed(() => {
  return !!(uploadTask.value || imageFiles.value.length > 0)
})

// 检查是否正在上传
const isUploading = computed(() => {
  return uploadTask.value?.status === 'uploading'
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
const MAX_IMAGE_COUNT = 200
const MIN_IMAGE_COUNT = 30  // 最少30张图片
const MIN_VIDEO_DURATION = 30  // 最少30秒视频

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

// 生成图片缩略图（用于预览，优化大量图片时的性能）
const generateThumbnail = (file: File, maxSize: number = 300): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      // 计算缩放后的尺寸
      let width = img.naturalWidth
      let height = img.naturalHeight

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      // 创建 canvas 进行缩放
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        // 导出为 JPEG 格式，质量 0.8
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
        URL.revokeObjectURL(img.src)
        resolve(thumbnailUrl)
      } else {
        URL.revokeObjectURL(img.src)
        resolve(URL.createObjectURL(file))
      }
    }
    img.onerror = () => {
      // 缩略图生成失败，返回原图
      resolve(URL.createObjectURL(file))
    }
    img.src = URL.createObjectURL(file)
  })
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
      isProcessingFiles.value = false
      return
    }
    if(files?.length < MIN_IMAGE_COUNT) {
      message.warning(`图片数量不足，最少需要 ${MIN_IMAGE_COUNT} 张图片`)
      isProcessingFiles.value = false
      return
    }

    // 开始处理文件，显示加载动画（覆盖整个区域）
    isProcessingFiles.value = true

    // 处理图片上传 - 清空视频
    if (uploadTask.value?.status === 'uploading' && uploadTask.value.abortController) {
      uploadTask.value.abortController.abort()
    }
    revokePreviewUrl()
    uploadTask.value = null
    imageFiles.value = []

    // 先检查并处理分辨率（显示进度）
    const { files: processedFiles, resized } = await checkAndProcessResolution(files, 'image')

    if (resized) {
      message.success('部分图片分辨率已自动降低')
    }

    // 处理图片列表（生成缩略图优化性能）
    const imageFileList = await Promise.all(processedFiles.map(async (f) => {
      const thumbnailUrl = await generateThumbnail(f, 300)
      return {
        id: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
        name: f.name,
        size: f.size,
        file: f,
        previewUrl: thumbnailUrl,  // 使用缩略图作为预览
      }
    }))
    imageFiles.value = imageFileList

    // 处理完成，隐藏加载动画
    isProcessingFiles.value = false

    // 默认任务名称为第一张图片的名称
    if (processedFiles.length > 0) {
      advancedForm.value.taskName = getTaskNameFromFile(processedFiles[0].name)
    }
    return
  }else if (file.type.startsWith('video/')) {

    // 检查是否上传了多个视频
    if (files.length > 1) {
      message.info('已选择多个视频，将只处理第一个视频')
    }

    // 处理视频上传 - 清空图片（缩略图是 base64 不需要释放）
    imageFiles.value.forEach(img => {
      if (img.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl)
      }
    })


    // 开始处理文件，显示加载动画（覆盖整个区域）
    isProcessingFiles.value = true

    try {
      // 先检查视频分辨率
      const { files: processedVideoFiles } = await checkAndProcessResolution([file], 'video')
      const processedFile = processedVideoFiles[0]

      const durationSec = await resolveVideoDuration(processedFile)
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        message.error('无法识别视频时长，请更换文件重试')
        isProcessingFiles.value = false
        return
      }
      if (durationSec > MAX_VIDEO_DURATION_SECONDS) {
        message.warning(`视频时长不能超过 ${MAX_VIDEO_DURATION_SECONDS / 60} 分钟`)
        isProcessingFiles.value = false
        return
      }
      if (durationSec < MIN_VIDEO_DURATION) {
        message.warning(`视频时长不足，最少需要 ${MIN_VIDEO_DURATION} 秒`)
        isProcessingFiles.value = false
        return
      }

      if (uploadTask.value?.status === 'uploading' && uploadTask.value.abortController) {
        uploadTask.value.abortController.abort()
      }
      revokePreviewUrl()
      imageFiles.value = []
      uploadTask.value = null

      uploadTask.value = {
        id: Math.random().toString(36).slice(2),
        name: processedFile.name,
        size: processedFile.size,
        file: processedFile,
        durationSec,
        previewUrl: URL.createObjectURL(processedFile),
        status: 'pending',
        progress: 0,
        abortController: null,
        uploadType: 'video',
      }

      advancedForm.value.taskName = getTaskNameFromFile(processedFile.name)

      // 处理完成，隐藏加载动画
      isProcessingFiles.value = false
    } catch (error: any) {
      // 发生错误时也要隐藏加载动画
      isProcessingFiles.value = false
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
  // 同时清理图片（缩略图是 base64 不需要释放）
  imageFiles.value.forEach(img => {
    if (img.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(img.previewUrl)
    }
  })
  imageFiles.value = []
  showAdvancedOptions.value = false
}

const removeImage = (imageId: string) => {
  const index = imageFiles.value.findIndex(img => img.id === imageId)
  if (index !== -1) {
    // 缩略图是 base64 格式，不需要释放；原图 blob URL 需要释放
    const previewUrl = imageFiles.value[index].previewUrl
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
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

    isProcessingAddingImages.value = true

    // 添加新图片到现有列表（生成缩略图优化性能）
    const newImageList = await Promise.all(Array.from(files).map(async (f) => {
      const thumbnailUrl = await generateThumbnail(f, 300)
      return {
        id: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
        name: f.name,
        size: f.size,
        file: f,
        previewUrl: thumbnailUrl,  // 使用缩略图作为预览
      }
    }))
    isProcessingAddingImages.value = false

    imageFiles.value = [...imageFiles.value, ...newImageList]
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
  // 检查是否有文件上传（图片或视频）
  const hasImages = imageFiles.value.length > 0
  const hasVideo = !!uploadTask.value

  if (!hasImages && !hasVideo) {
    message.warning('请先选择文件上传')
    return
  }

  if (uploadTask.value?.status === 'uploading') return

  // 检查算力点是否充足
  if (currentPoints.value < consumedPoints.value) {
    message.warning('算力点不足，请充值后继续')
    return
  }

  // 判断是上传图片还是视频
  if (hasImages) {
    uploadTask.value = {
      id: Math.random().toString(36).slice(2),
      name: imageFiles.value[0].name,
      size: imageFiles.value.reduce((sum, img) => sum + img.size, 0),
      file: imageFiles.value[0].file,
      durationSec: 0,
      previewUrl: imageFiles.value[0].previewUrl,
      status: 'uploading',
      progress: 0,
      abortController: new AbortController(),
      uploadType: 'image',
    }

    const currentTask = uploadTask.value

    const formData = new FormData()
    const taskName = getTaskNameFromFile(imageFiles.value[0].name)
    const normalizedTaskName = advancedForm.value.taskName.trim() || taskName
    const params = {
      task_name: normalizedTaskName,
      fps: 10,
      bg_remove: !!advancedForm.value.bgRemove,
      bg_remove_paras: DEFAULT_BG_REMOVE_PARAMS,
      public: false,
      user_object_description: advancedForm.value.userObjectDescription || '',
    }

    formData.append('params', JSON.stringify(params))
    imageFiles.value.forEach(img => {
      formData.append('images', img.file, img.name)
    })

    try {
      const token = localStorage.getItem('token') || undefined

      await ApiServer.request({
        url: API.UPLOAD_IMAGES,
        method: 'post',
        data: formData,
        timeout: 10 * 60 * 1000,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: currentTask.abortController!.signal,
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
      message.success('上传成功，模型开始生成')
      pointsStore.getPoints()

      window.setTimeout(() => {
        if (!uploadTask.value || uploadTask.value.id !== currentTask.id) return
        if (uploadTask.value.status !== 'success') return
        // 缩略图是 base64 不需要释放
        imageFiles.value.forEach(img => {
          if (img.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(img.previewUrl)
          }
        })
        imageFiles.value = []
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
  } else if (hasVideo && uploadTask.value) {
    // ========== 上传视频（原有逻辑）==========
    const currentTask = uploadTask.value
    currentTask.status = 'uploading'
    currentTask.progress = 0
    currentTask.abortController = new AbortController()

    const formData = new FormData()
    const taskName = getTaskNameFromFile(currentTask.name)
    const normalizedTaskName = advancedForm.value.taskName.trim() || taskName
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
        timeout: 10 * 60 * 1000,
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

.upload-area-wrapper {
  position: relative;
}

/* 全屏处理遮罩层 - 覆盖上传和进度两个区域 */
.processing-overlay-full {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 20px;
  min-height: 400px;
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.processing-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
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

.processing-file {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  max-width: 300px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
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

.upload-consistency-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: var(--glass-surface);
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 20px;
}

.upload-consistency-tip :deep(.anticon) {
  color: var(--accent-blue);
  margin-top: 1px;
  flex-shrink: 0;
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

/* 帮助按钮 */
.help-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.help-btn:hover {
  background: var(--glass-surface-hover);
  color: var(--text-primary);
}

.desktop-only {
  display: inline;
}

.mobile-only {
  display: none;
}

.help-content {
  font-size: 14px;
  line-height: 1.8;
}

.help-content p {
  margin: 0 0 8px;
}

.help-tip {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 12px !important;
}

.help-highlight {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.25);
  background: rgba(59, 130, 246, 0.08);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  margin-top: 12px;
}

.help-highlight :deep(.anticon) {
  color: var(--accent-blue);
  margin-top: 1px;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .create-project-container {
    padding: 20px 16px;
  }

  .create-header h1 {
    font-size: 20px;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: inline-flex;
  }

  .upload-consistency-tip {
    display: none;
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
