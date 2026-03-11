<template>
  <div class="upload-progress">
    <div class="progress-header">
      <h3 class="progress-title">{{ task ? '视频任务' : '图片任务' }}</h3>
      <div class="header-actions">
        <a-tooltip>
          <template #title>
            <div class="points-tooltip-content">
              <p>当前算力点: {{ currentPoints }}</p>
              <p>本次消耗: -{{ consumedPoints }}</p>
              <p>剩余算力点: {{ Math.max(0, currentPoints - consumedPoints) }}</p>
            </div>
          </template>
          <QuestionCircleOutlined class="points-help-icon" />
        </a-tooltip>
        <button class="advanced-btn" @click="$emit('open-advanced')">
          <SettingOutlined />
          <span>高级选项</span>
        </button>
      </div>
    </div>

    <!-- 视频上传展示 -->
    <div v-if="task" class="file-list">
      <div class="file-item" :class="task.status">
        <div class="video-preview" v-if="task.previewUrl">
          <button
            class="preview-remove"
            title="移除视频"
            :disabled="task.status === 'uploading'"
            @click.stop="$emit('remove')"
          >
            <CloseOutlined />
          </button>
          <video :src="task.previewUrl" controls preload="metadata"></video>
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
      <div class="image-grid">
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
              @click.stop="$emit('remove-image', image.id)"
            >
              <CloseOutlined />
            </button>
            <div class="image-overlay">
              <span class="image-name" :title="image.name">{{ image.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <button
        class="btn btn-secondary"
        :disabled="!hasFiles || ((task && task.status === 'uploading') ?? false)"
        @click="$emit('remove')"
      >
        {{ task ? '移除视频' : '移除全部图片' }}
      </button>
      <button
        v-if="task?.status === 'uploading'"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ClockCircleOutlined, CloseOutlined, FileOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'

type UploadTaskStatus = 'pending' | 'uploading' | 'success' | 'failed' | 'cancelled'

interface UploadTaskView {
  id: string
  name: string
  size: number
  durationSec: number
  previewUrl: string
  progress: number
  status: UploadTaskStatus
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
}>()

const emit = defineEmits<{
  'open-advanced': []
  remove: []
  submit: []
  cancel: []
  'remove-image': [imageId: string]
}>()

const hasFiles = computed(() => {
  return !!props.task || (props.imageFiles && props.imageFiles.length > 0)
})

const canSubmit = computed(() => {
  if (props.task) {
    return ['pending', 'failed', 'cancelled'].includes(props.task.status)
  }
  return props.imageFiles && props.imageFiles.length > 0
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
</script>

<style scoped>
.upload-progress {
  margin-top: 32px;
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
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.points-help-icon {
  font-size: 18px;
  color: var(--text-secondary);
  cursor: help;
  transition: color 0.2s ease;
}

.points-help-icon:hover {
  color: var(--accent-blue);
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
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.file-item.pending {
  background: rgba(24, 144, 255, 0.06);
}

.file-item.uploading {
  background: rgba(59, 130, 246, 0.08);
}

.file-item.success {
  background: rgba(82, 196, 26, 0.1);
}

.file-item.cancelled {
  background: rgba(250, 173, 20, 0.1);
}

.file-item.failed {
  background: rgba(245, 34, 45, 0.08);
}

.video-preview {
  width: 220px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  background: #000;
  flex-shrink: 0;
  position: relative;
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
  height: 124px;
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

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
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
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
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
@media (max-width: 768px) {
  .upload-progress {
    padding: 16px;
  }

  .progress-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .file-item {
    padding: 12px;
  }

  .file-icon {
    width: 36px;
    height: 36px;
  }

  .file-item {
    flex-direction: column;
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
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
