<template>
  <div class="create-project-page" :data-theme="themeStore.appliedTheme">
    <AnimatedBackground />

    <div class="create-project-container">
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
      <FileUpload @upload="handleUpload" />

      <!-- Upload Progress -->
      <UploadProgress
        v-if="uploadTask"
        :task="uploadTask"
        @open-advanced="openAdvancedDrawer"
        @remove="removeFile"
        @cancel="cancelUpload"
        @submit="submitProject"
      />

      <a-drawer
        :open="showAdvancedOptions"
        title="高级选项"
        placement="right"
        :width="420"
        @close="closeAdvancedDrawer"
      >
        <div class="advanced-panel">
          <div class="advanced-section">
            <div class="section-name">基础信息</div>
            <a-card class="option-card" size="small">
              <div class="card-line">
                <FileTextOutlined class="field-icon" />
                <span class="card-line-label">任务名称</span>
              </div>
              <a-input
                v-model:value="advancedForm.taskName"
                placeholder="默认取视频文件名"
                allow-clear
              />

              <div class="card-line card-line-top">
                <ProfileOutlined class="field-icon" />
                <span class="card-line-label">模型描述</span>
              </div>
              <a-textarea
                v-model:value="advancedForm.userObjectDescription"
                :rows="4"
                placeholder="可选，默认为空"
                show-count
                :maxlength="300"
              />
            </a-card>
          </div>

          <div class="advanced-section">
            <div class="section-name">生成选项</div>
            <a-card class="option-card" size="small">
              <div class="switch-item">
                <div class="switch-meta">
                  <ThunderboltOutlined class="switch-icon" />
                  <div>
                    <div class="switch-title">快速重建</div>
                    <div class="switch-desc">生成速度更快，适合快速预览</div>
                  </div>
                </div>
                <a-switch v-model:checked="advancedForm.lightningReconstruction" />
              </div>

              <div class="switch-divider"></div>

              <div class="switch-item">
                <div class="switch-meta">
                  <BgColorsOutlined class="switch-icon" />
                  <div>
                    <div class="switch-title">背景移除</div>
                    <div class="switch-desc">自动分离主体，减少环境干扰</div>
                  </div>
                </div>
                <a-switch v-model:checked="advancedForm.bgRemove" />
              </div>
            </a-card>
          </div>

          <div class="advanced-section">
            <div class="section-name">说明</div>
            <a-card class="option-card" size="small">
              <p class="option-tip">
                <InfoCircleOutlined />
                <span>`bg_remove_paras` 使用默认参数上传；FPS 固定为 10。</span>
              </p>
            </a-card>
          </div>
        </div>
      </a-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
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
import AnimatedBackground from '../components/AnimatedBackground.vue'
import FileUpload from '../components/FileUpload.vue'
import UploadProgress from '../components/UploadProgress.vue'
import API from '@/utils/api'
import { ApiServer } from '@/utils/taskService'

const router = useRouter()
const { t } = useI18n()
const themeStore = useThemeStore()

type UploadTaskStatus = 'pending' | 'uploading' | 'success' | 'failed' | 'cancelled'

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
}

const uploadTask = ref<UploadTask | null>(null)

const showAdvancedOptions = ref(false)

const DEFAULT_BG_REMOVE_PARAMS = {
  object_name: 'object',
  frame_idx: 0,
  points: [],
  box: null,
  auto_mask: 1,
}

const advancedForm = ref({
  taskName: '',
  lightningReconstruction: false,
  bgRemove: true,
  userObjectDescription: '',
})

const MAX_VIDEO_DURATION_SECONDS = 180
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']

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
  return new Promise((resolve, reject) => {
    const tempUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = Number(video.duration || 0)
      URL.revokeObjectURL(tempUrl)
      resolve(duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(tempUrl)
      reject(new Error('读取视频时长失败'))
    }
    video.src = tempUrl
  })
}

const handleUpload = async (file: File) => {
  if (!file) return

  const isAcceptedType = ACCEPTED_VIDEO_TYPES.includes(file.type) || /\.(mp4|mov)$/i.test(file.name)
  if (!isAcceptedType) {
    message.warning('仅支持 MP4 或 MOV 视频')
    return
  }

  try {
    const durationSec = await resolveVideoDuration(file)
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
      message.error('无法识别视频时长，请更换文件重试')
      return
    }
    if (durationSec > MAX_VIDEO_DURATION_SECONDS) {
      message.warning('视频时长不能超过 3 分钟')
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
    }

    advancedForm.value.taskName = getTaskNameFromFile(file.name)
  } catch (error: any) {
    message.error(error?.message || '读取视频信息失败')
  }
}

const removeFile = () => {
  if (uploadTask.value?.status === 'uploading') {
    message.info('上传进行中，请先取消上传')
    return
  }
  revokePreviewUrl()
  uploadTask.value = null
  showAdvancedOptions.value = false
}

const openAdvancedDrawer = () => {
  if (!uploadTask.value) return
  showAdvancedOptions.value = true
}

const closeAdvancedDrawer = () => {
  if (uploadTask.value && !advancedForm.value.taskName.trim()) {
    advancedForm.value.taskName = getTaskNameFromFile(uploadTask.value.name)
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

  const currentTask = uploadTask.value
  currentTask.status = 'uploading'
  currentTask.progress = 0
  currentTask.abortController = new AbortController()

  const formData = new FormData()
  const normalizedTaskName = advancedForm.value.taskName.trim() || getTaskNameFromFile(currentTask.name)
  const params = {
    task_name: normalizedTaskName,
    fps: 10,
    lightning_reconstruction: !!advancedForm.value.lightningReconstruction,
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
  gap: 16px;
}

.advanced-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-left: 2px;
}

.option-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.card-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-line-top {
  margin-top: 12px;
  margin-bottom: 10px;
}

.card-line-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.field-icon {
  font-size: 14px;
  color: var(--accent-blue);
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.switch-divider {
  height: 1px;
  background: var(--glass-border);
  margin: 12px 0;
}

.switch-meta {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.switch-icon {
  font-size: 15px;
  color: var(--accent-blue);
  margin-top: 2px;
}

.switch-title {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.switch-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.option-tip {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 2px 0;
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
</style>
