<template>
  <div class="model-card" @click="handleCardClick">
    <div class="model-image">
      <img
        v-if="model.preview"
        v-lazy="lazyPreview"
        :alt="model.taskName"
        class="model-preview"
      />
      <div v-if="isPreviewLoading" class="loading-overlay" aria-label="loading">
        <span class="loading-spinner"></span>
      </div>
      <span v-if="model.isNew && isCompleted" class="new-badge">New</span>

      <span v-if="isBlocked" class="status-corner" :class="statusClass">{{ statusText }}</span>

      <!-- Checkbox for management mode -->
      <div v-if="showCheckbox" class="card-checkbox" @click.stop>
        <a-checkbox
          :checked="checked"
          size="default"
          @change="handleCheckboxChange"
        />
      </div>

      <div v-if="showOverlay" class="status-overlay">
        <div class="status-content">
          <div v-if="isProcessing" class="dot-loader" aria-label="loading">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p v-else-if="model.nsfwBlocked" class="mask-text">审核不通过</p>
        </div>
      </div>
    </div>
    <div class="model-info" @click.stop>
      <!-- <p class="model-author">Created by {{ model.ownerUsername }}</p> -->
      <p class="model-author">
        <template v-for="(part, index) in highlightedTaskName" :key="`name-${index}`">
          <mark v-if="part.matched" class="highlight-text">{{ part.text }}</mark>
          <span v-else>{{ part.text }}</span>
        </template>
      </p>
      <p v-if="model.objectDescription" class="model-description">
        <template v-for="(part, index) in highlightedDescription" :key="`desc-${index}`">
          <mark v-if="part.matched" class="highlight-text">{{ part.text }}</mark>
          <span v-else>{{ part.text }}</span>
        </template>
      </p>

      <div class="card-actions" @click.stop>
        <a-button
          type="text"
          size="small"
          :title="pauseResumeLabel"
          :disabled="!canPauseOrResume || isPausing || isResuming"
          @click="handlePauseOrResume"
        >
          <template #icon>
            <PlayCircleOutlined v-if="isPaused || isFailed" />
            <PauseCircleOutlined v-else />
          </template>
        </a-button>

        <a-button type="text" size="small" @click="openDetailsDrawer">
          <template #icon>
            <InfoCircleOutlined />
          </template>
        </a-button>

        <a-popconfirm
          title="确认删除该模型吗？"
          ok-text="删除"
          cancel-text="取消"
          :disabled="!canDelete || isDeleting"
          @confirm="handleDelete"
        >
          <a-button
            type="text"
            size="small"
            :disabled="!canDelete || isDeleting"
          >
            <template #icon>
              <DeleteOutlined style="color:red"/>
            </template>
          </a-button>
        </a-popconfirm>
      </div>
    </div>

    <a-drawer
      :open="showDetailsDrawer"
      placement="right"
      :width="420"
      :title="null"
      :closable="false"
      :header-style="{ display: 'none' }"
      @close="closeDetailsDrawer"
    >
      <div class="details-panel">
        <div class="details-header">
          <div class="details-header-left">
            <h3 class="details-title">{{ model.taskName || '未命名任务' }}</h3>
          </div>
          <button class="details-close" @click="closeDetailsDrawer">✕</button>
        </div>

        <div class="details-body">
          <section class="details-section">
            <h4 class="section-title">作品描述</h4>
            <p class="section-description">{{ model.objectDescription || '无描述' }}</p>
          </section>

          <section class="details-section">
            <h4 class="section-title">作品数据</h4>
            <div class="stats-grid">
              <div
                v-for="item in statItems"
                :key="item.label"
                class="stat-item"
                :style="{ background: item.bgColor || 'var(--bg-secondary)' }"
              >
                <component :is="item.icon" class="stat-icon" />
                <div class="stat-value">{{ item.value }}</div>
                <div class="stat-label">{{ item.label }}</div>
              </div>
            </div>
          </section>

          <section class="details-section">
            <h4 class="section-title">技术参数</h4>
            <div class="param-grid">
              <div
                v-for="item in techItems"
                :key="item.label"
                class="param-item"
              >
                <div class="param-item-header">
                  <div class="param-icon" :style="{ background: item.iconBg || '' }">
                    <component :is="item.icon" :style="{ color: item.color || '' }" />
                  </div>
                  <span class="param-label">{{ item.label }}</span>
                </div>
                <div :class="['param-value', item.emphasis ? 'param-value-emphasis' : '']">
                  {{ item.value }}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { Button as AButton } from 'ant-design-vue'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ShareAltOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import API from '@/utils/api'
import { ApiServer } from '@/utils/taskService'

interface Model {
  taskId?: string
  taskName?: string
  status?: string
  nsfwBlocked?: boolean
  createdAt?: string
  endAt?: string
  error?: string
  lightning?: boolean
  fps?: number
  videoCount?: number
  objectDescription?: string
  ownerUsername?: string
  authorAvatar?: string
  preview?: string
  headimg?: string
  nickname?: string
  isPublic?: boolean
  viewCount?: number
  likeCount?: number
  isLiked?: boolean
  downloadCount?: number
  shareCount?: number

  isNew: boolean
  type: 'mesh' | 'gaussian'
}

const props = defineProps<{
  model: Model
  highlightKeyword?: string
  showCheckbox?: boolean
  checked?: boolean
}>()

const isPreviewLoading = ref(false)
const isResuming = ref(false)
const isPausing = ref(false)
const isDeleting = ref(false)
const showDetailsDrawer = ref(false)

const processingStatusList = [
  'received',
  'slicing',
  'reconstructing_colmap',
  'reconstructing_3dgs',
  'reconstructing_lightning',
  'processing_bg_removal',
  'resuming',
]

const statusTextMap: Record<string, string> = {
  received: '已接收',
  slicing: '视频切帧中',
  reconstructing_colmap: 'COLMAP 重建中',
  reconstructing_3dgs: '3DGS 训练中',
  reconstructing_lightning: '快速重建中',
  processing_bg_removal: '背景去除中',
  paused: '已暂停',
  resuming: '恢复中',
  completed: '已完成',
  failed: '已失败',
}

const statusText = computed(() => {
  if (props.model.nsfwBlocked) return '审核不通过'
  return statusTextMap[props.model.status || ''] || '处理中'
})

const isCompleted = computed(() => props.model.status === 'completed' && !props.model.nsfwBlocked)
const isPaused = computed(() => props.model.status === 'paused' && !props.model.nsfwBlocked)
const isFailed = computed(() => props.model.status === 'failed' && !props.model.nsfwBlocked)
const isProcessing = computed(() => processingStatusList.includes(props.model.status || '') && !props.model.nsfwBlocked)
const isBlocked = computed(() => !isCompleted.value)
const showOverlay = computed(() => isProcessing.value || isFailed.value || !!props.model.nsfwBlocked)

const canPauseOrResume = computed(() => {
  if (!props.model.taskId || props.model.nsfwBlocked) return false
  if (isCompleted.value) return false
  return isProcessing.value || isPaused.value || isFailed.value
})

const canDelete = computed(() => !!props.model.taskId)

const pauseResumeLabel = computed(() => {
  if (isPaused.value || isFailed.value) {
    return isResuming.value ? '开始中...' : '开始'
  }
  return isPausing.value ? '暂停中...' : '暂停'
})

const statusClass = computed(() => {
  if (props.model.nsfwBlocked) return 'danger'
  if (isFailed.value) return 'danger'
  if (isProcessing.value) return 'processing'
  return 'neutral'
})

const lazyPreview = computed(() => ({
  src: props.model.preview,
  lifecycle: {
    loading: () => {
      isPreviewLoading.value = true
    },
    loaded: () => {
      isPreviewLoading.value = false
    },
    error: () => {
      isPreviewLoading.value = false
    }
  }
}))

watch(
  () => props.model.preview,
  (preview) => {
    isPreviewLoading.value = !!preview
  },
  { immediate: true }
)

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getHighlightParts = (text: string, keyword: string) => {
  if (!keyword.trim()) {
    return [{ text, matched: false }]
  }

  const safeKeyword = escapeRegex(keyword.trim())
  const regex = new RegExp(`(${safeKeyword})`, 'ig')
  const parts = text.split(regex)

  return parts
    .filter(part => part.length > 0)
    .map(part => ({
      text: part,
      matched: part.toLowerCase() === keyword.trim().toLowerCase()
    }))
}

const highlightedTaskName = computed(() => getHighlightParts(props.model.taskName || '', props.highlightKeyword || ''))
const highlightedDescription = computed(() => getHighlightParts(props.model.objectDescription || '', props.highlightKeyword || ''))

const displayValue = (value: string | number | boolean | null | undefined, fallback = '-') => {
  if (value === undefined || value === null) return fallback
  const stringValue = String(value).trim()
  return stringValue === '' ? fallback : stringValue
}

const formatDateTime = (value: string | undefined) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const statItems = computed(() => [
  { label: '查看数', value: displayValue(props.model.viewCount, '0'), icon: EyeOutlined, bgColor: 'rgba(24, 144, 255, 0.10)' },
  { label: '点赞数', value: displayValue(props.model.likeCount, '0'), icon: HeartOutlined, bgColor: 'rgba(250, 140, 22, 0.12)' },
  { label: '下载量', value: displayValue(props.model.downloadCount, '0'), icon: DownloadOutlined, bgColor: 'rgba(82, 196, 26, 0.12)' },
  { label: '转发量', value: displayValue(props.model.shareCount, '0'), icon: ShareAltOutlined, bgColor: 'rgba(212, 136, 6, 0.12)' },
])

const techItems = computed(() => {
  const items = [
    {
      label: '状态',
      value: statusText.value,
      icon: CheckCircleOutlined,
      emphasis: true,
      visible: true,
      color: '#2f54eb',
      iconBg: 'rgba(47, 84, 235, 0.15)',
    },
    {
      label: '快速重建',
      value: props.model.lightning ? '是' : '否',
      icon: ThunderboltOutlined,
      emphasis: false,
      visible: true,
      color: '#fa8c16',
      iconBg: 'rgba(250, 140, 22, 0.15)',
    },
    {
      label: '开始时间',
      value: formatDateTime(props.model.createdAt),
      icon: ClockCircleOutlined,
      emphasis: false,
      visible: true,
      color: '#722ed1',
      iconBg: 'rgba(114, 46, 209, 0.15)',
    },
    {
      label: '结束时间',
      value: formatDateTime(props.model.endAt),
      icon: CheckCircleOutlined,
      emphasis: false,
      visible: ['completed', 'failed'].includes(props.model.status || '') && !props.model.nsfwBlocked,
      color: '#13a8a8',
      iconBg: 'rgba(19, 168, 168, 0.15)',
    },
    {
      label: '错误原因',
      value: displayValue(props.model.error, '未知错误'),
      icon: WarningOutlined,
      emphasis: true,
      visible: isFailed.value,
      color: '#cf1322',
      iconBg: 'rgba(207, 19, 34, 0.15)',
    },
    {
      label: '审核结果',
      value: '内容包含违规信息，审核不通过',
      icon: WarningOutlined,
      emphasis: true,
      visible: !!props.model.nsfwBlocked,
      color: '#d48806',
      iconBg: 'rgba(212, 136, 6, 0.15)',
    },
    {
      label: '帧数',
      value: displayValue(props.model.fps, '未知'),
      icon: VideoCameraOutlined,
      emphasis: false,
      visible: true,
      color: '#1d39c4',
      iconBg: 'rgba(29, 57, 196, 0.15)',
    },
  ]

  return items.filter((item) => item.visible)
})

const emit = defineEmits<{
  click: []
  'resume-success': [taskId: string]
  'task-action-success': []
  'task-deleted': [taskId: string]
  'update:checked': [value: boolean]
}>()

// Handle checkbox change
const handleCheckboxChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:checked', target.checked)
}

const handleCardClick = () => {
  if (isCompleted.value || props.showCheckbox) {
    emit('click')
    return
  }

  if (isFailed.value) {
    message.info('任务失败，请点击“重新开始”')
    return
  }

  if (props.model.nsfwBlocked) {
    message.warning('该任务审核未通过，无法查看')
    return
  }

  message.info('任务处理中，完成后可查看')
}

const handleResume = async () => {
  if (!props.model.taskId || isResuming.value) return
  isResuming.value = true
  try {
    const token = localStorage.getItem('token') || undefined
    await ApiServer.request({
      url: `${API.TASK_DETAIL}/${props.model.taskId}/resume`,
      method: 'post',
      data: {
        taskId: props.model.taskId,
        task_id: props.model.taskId,
      },
    }, token)
    message.success('任务已重新开始')
    emit('resume-success', props.model.taskId)
    emit('task-action-success')
  } catch (error: any) {
    message.error(error?.message || '重新开始失败，请稍后重试')
  } finally {
    isResuming.value = false
  }
}

const handlePause = async () => {
  if (!props.model.taskId || isPausing.value) return
  isPausing.value = true
  try {
    const token = localStorage.getItem('token') || undefined
    await ApiServer.request({
      url: `${API.BASE_URL}${API.TASK_DETAIL}/${props.model.taskId}/pause`,
      method: 'post',
      data: {
        taskId: props.model.taskId,
        task_id: props.model.taskId,
      },
    }, token)
    message.success('任务已暂停')
    emit('task-action-success')
  } catch (error: any) {
    message.error(error?.message || '暂停失败，请稍后重试')
  } finally {
    isPausing.value = false
  }
}

const handlePauseOrResume = async () => {
  if (!canPauseOrResume.value) return
  if (isPaused.value || isFailed.value) {
    await handleResume()
    return
  }
  await handlePause()
}

const handleDelete = async () => {
  if (!props.model.taskId || isDeleting.value) return
  isDeleting.value = true
  try {
    const token = localStorage.getItem('token') || undefined
    await ApiServer.request({
      url: API.TASK_DELETE,
      method: 'post',
      data: {
        taskId: props.model.taskId,
        task_id: props.model.taskId,
      },
    }, token)
    message.success('模型已删除')
    emit('task-deleted', props.model.taskId)
    emit('task-action-success')
  } catch (error: any) {
    message.error(error?.message || '删除失败，请稍后重试')
  } finally {
    isDeleting.value = false
  }
}

const openDetailsDrawer = () => {
  showDetailsDrawer.value = true
}

const closeDetailsDrawer = () => {
  showDetailsDrawer.value = false
}
</script>

<style scoped>
.model-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.model-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.model-image {
  aspect-ratio: 1;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

.model-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.2s ease-in-out infinite;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.12);
  border-top-color: rgba(0, 0, 0, 0.45);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

.new-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  background: #00d4aa;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}

.status-corner {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  backdrop-filter: blur(4px);
}

.status-corner.processing {
  background: rgba(24, 144, 255, 0.92);
}

.status-corner.danger {
  background: rgba(245, 34, 45, 0.92);
}

.status-corner.neutral {
  background: rgba(140, 140, 140, 0.92);
}

.card-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.status-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: rgba(0, 0, 0, 0.58);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.status-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dot-loader {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.dot-loader span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.96);
  animation: dot-bounce 1.2s infinite ease-in-out;
}

.dot-loader span:nth-child(2) {
  animation-delay: 0.2s;
}

.dot-loader span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-bounce {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0) scale(0.85);
  }
  40% {
    opacity: 1;
    transform: translateY(-4px) scale(1);
  }
}

.mask-text {
  margin: 0;
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

.model-info {
  padding: 12px;
}

.model-author {
  font-size: 12px;
  color: var(--text-secondary);
}

.model-description {
  margin-top: 4px;
  font-size: 12px;  
  color: var(--text-primary);
  line-height: 1.4;
  line-clamp: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.highlight-text {
  background: rgba(255, 214, 10, 0.35);
  color: inherit;
  padding: 0 2px;
  border-radius: 3px;
}

.card-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.details-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--glass-border);
}

.details-header-left {
  min-width: 0;
}

.details-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.35;
}

.details-close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--glass-surface);
  color: var(--text-primary);
  cursor: pointer;
}

.details-body {
  margin-top: 14px;
  overflow-y: auto;
  padding-right: 2px;
}

.details-section {
  margin-bottom: 22px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.section-description {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.stats-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 14px 8px;
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  background: var(--bg-secondary);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 20px;
}

.stat-item:nth-child(1) .stat-icon {
  color: #1677ff;
}

.stat-item:nth-child(2) .stat-icon {
  color: #fa8c16;
}

.stat-item:nth-child(3) .stat-icon {
  color: #52c41a;
}

.stat-item:nth-child(4) .stat-icon {
  color: #d48806;
}

.stat-value {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.param-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.param-item {
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 14px;
  background: linear-gradient(145deg, var(--bg-secondary), rgba(255, 255, 255, 0.02));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.param-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.param-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 15px;
}

.param-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.param-value {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
}

.param-value-emphasis {
  color: #f5222d;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 640px) {
  .model-preview {
    width: 100%;
    height: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
