<template>
  <div class="model-card" >
    <div class="model-image" @click="handleCardClick">
      <img
        v-if="model.preview"
        v-lazy="lazyPreview"
        :alt="model.taskName"
        class="model-preview"
      />
      <div v-if="isPreviewLoading" class="loading-overlay" :aria-label="t('common.loading')">
        <span class="loading-spinner"></span>
      </div>
      <span v-if="model.isNew" class="new-badge">{{ t('modelCard.badges.new') }}</span>
    </div>
    <div class="model-info">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

interface OfficialModel {
  taskId?: string
  taskName?: string
  objectDescription?: string
  ownerUsername?: string
  authorAvatar?: string
  preview?: string
  nickname?: string
  viewCount?: number
  likeCount?: number
  downloadCount?: number
  shareCount?: number

  isNew: boolean
  type: 'mesh' | 'gaussian'
}

const props = defineProps<{
  model: OfficialModel
  highlightKeyword?: string
}>()

const isPreviewLoading = ref(false)

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

const emit = defineEmits<{
  click: []
}>()

const handleCardClick = () => {
  emit('click')
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

.model-image {
  aspect-ratio: 1;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

/* 悬停遮罩层 */
.model-image:hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 1;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: 0;
}


.model-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
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

.model-info {
  padding: 12px;
  user-select: none;
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
