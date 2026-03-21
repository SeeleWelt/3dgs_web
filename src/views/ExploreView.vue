<template>
  <div class="explore-view animate-fade-in">
    <section class="explore-section animate-fade-in-up">
      <div class="section-header">
        <h2 class="section-title">{{ t('explore.ai3dModels') }}</h2>
        <p class="section-subtitle">{{ t('explore.weeklyUpdate') }}</p>
      </div>

      <div class="models-carousel" v-if="!meshLoading">
        <button
          v-show="showDesktopScrollButtons && meshCarousel.canScrollLeft.value"
          class="scroll-btn scroll-left"
          @click="meshCarousel.scroll('left')"
        >
          <LeftOutlined />
        </button>

        <div
          ref="meshScrollRef"
          class="models-grid"
          :class="{ 'is-dragging': meshCarousel.isDragging.value }"
          @scroll="meshCarousel.handleScroll"
          @mousedown="meshCarousel.handleMouseDown"
          @mousemove="meshCarousel.handleMouseMove"
          @mouseup="meshCarousel.handleMouseUp"
          @mouseleave="meshCarousel.handleMouseLeave"
          @touchstart="meshCarousel.handleTouchStart"
          @touchmove="meshCarousel.handleTouchMove"
          @touchend="meshCarousel.handleTouchEnd"
          @touchcancel="meshCarousel.handleTouchEnd"
        >
          <OfficialModelCard
            v-for="model in MeshModel"
            :key="model.taskId"
            :model="model"
            @click="handleCardClick(model)"
            @resume-success="handleResumeSuccess"
            @task-action-success="handleResumeSuccess"
            @task-deleted="handleResumeSuccess"
          />
        </div>

        <button
          v-show="showDesktopScrollButtons && meshCarousel.canScrollRight.value"
          class="scroll-btn scroll-right"
          @click="meshCarousel.scroll('right')"
        >
          <RightOutlined />
        </button>
      </div>

      <div v-else class="loading-grid">
        <div v-for="i in meshSkeletonCount" :key="i" class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-desc"></div>
        </div>
      </div>
    </section>

    <section
      ref="gaussianSectionRef"
      class="explore-section gaussian-section animate-fade-in-up"
      style="animation-delay: 0.1s"
    >
      <div class="section-header">
        <h2 class="section-title">{{ t('explore.gs3dTitle') }}</h2>
        <p class="section-subtitle">{{ t('explore.weeklyUpdate') }}</p>
      </div>

      <div class="models-carousel" v-if="!gaussianLoading">
        <button
          v-show="showDesktopScrollButtons && gaussianCarousel.canScrollLeft.value"
          class="scroll-btn scroll-left"
          @click="gaussianCarousel.scroll('left')"
        >
          <LeftOutlined />
        </button>

        <div
          ref="gaussianScrollRef"
          class="models-grid"
          :class="{ 'is-dragging': gaussianCarousel.isDragging.value }"
          @scroll="gaussianCarousel.handleScroll"
          @mousedown="gaussianCarousel.handleMouseDown"
          @mousemove="gaussianCarousel.handleMouseMove"
          @mouseup="gaussianCarousel.handleMouseUp"
          @mouseleave="gaussianCarousel.handleMouseLeave"
          @touchstart="gaussianCarousel.handleTouchStart"
          @touchmove="gaussianCarousel.handleTouchMove"
          @touchend="gaussianCarousel.handleTouchEnd"
          @touchcancel="gaussianCarousel.handleTouchEnd"
        >
          <OfficialModelCard
            v-for="model in _3DModel"
            :key="model.taskId"
            :model="model"
            @click="handleGaussianCardClick(model)"
            @resume-success="handleResumeSuccess"
            @task-action-success="handleResumeSuccess"
            @task-deleted="handleResumeSuccess"
          />
        </div>

        <button
          v-show="showDesktopScrollButtons && gaussianCarousel.canScrollRight.value"
          class="scroll-btn scroll-right"
          @click="gaussianCarousel.scroll('right')"
        >
          <RightOutlined />
        </button>
      </div>

      <div v-else class="loading-grid">
        <div v-for="i in gaussianSkeletonCount" :key="i" class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-desc"></div>
        </div>
      </div>

      <div class="pagination-wrap" v-if="!gaussianLoading && gaussianTotal > (tasksParams.pageSize || 12)">
        <a-pagination
          :current="tasksParams.page"
          :page-size="tasksParams.pageSize"
          :total="gaussianTotal"
          :show-size-changer="false"
          :show-less-items="true"
          @change="handleGaussianPageChange"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import OfficialModelCard from '@/components/OfficialModelCard.vue'
import { ApiServer, type GetTaskListParams, type TaskModel } from '@/utils/taskService'
import API from '@/utils/api'

const router = useRouter()
const { t } = useI18n()

const MOBILE_BREAKPOINT = 1023
const MIN_CAROUSEL_ITEMS = 12
const meshSkeletonCount = 12
const gaussianSkeletonCount = 12

interface Model extends TaskModel {
  id?: string
  preview_image?: string
  task_name?: string
  isNew: boolean
  type: 'mesh' | 'gaussian'
}

const defaultExampleSeeds = [
  {
    taskName: 'Garden Courtyard',
    objectDescription: 'Outdoor stone and plants reconstruction',
    ownerUsername: 'demo_lab',
    nickname: 'demo_lab',
    preview: 'https://picsum.photos/400/400?random=1101',
    viewCount: 286,
    likeCount: 63,
    downloadCount: 20,
    shareCount: 9
  },
  {
    taskName: 'Robot Figure',
    objectDescription: 'High-detail hard-surface character model',
    ownerUsername: 'studio_x',
    nickname: 'studio_x',
    preview: 'https://picsum.photos/400/400?random=1102',
    viewCount: 752,
    likeCount: 141,
    downloadCount: 47,
    shareCount: 18
  },
  {
    taskName: 'Vintage Camera',
    objectDescription: 'Desk object scan with metal texture details',
    ownerUsername: 'scan_room',
    nickname: 'scan_room',
    preview: 'https://picsum.photos/400/400?random=1103',
    viewCount: 498,
    likeCount: 97,
    downloadCount: 31,
    shareCount: 11
  },
  {
    taskName: 'Street Corner',
    objectDescription: 'Urban scene with signs and storefronts',
    ownerUsername: 'city_capture',
    nickname: 'city_capture',
    preview: 'https://picsum.photos/400/400?random=1104',
    viewCount: 1033,
    likeCount: 209,
    downloadCount: 88,
    shareCount: 42
  },
  {
    taskName: 'Sports Car',
    objectDescription: 'Exterior and interior appearance showcase',
    ownerUsername: 'auto_lab',
    nickname: 'auto_lab',
    preview: 'https://picsum.photos/400/400?random=1105',
    viewCount: 1842,
    likeCount: 388,
    downloadCount: 133,
    shareCount: 56
  },
  {
    taskName: 'Ancient Vase',
    objectDescription: 'Museum artifact with carved pattern details',
    ownerUsername: 'history_3d',
    nickname: 'history_3d',
    preview: 'https://picsum.photos/400/400?random=1106',
    viewCount: 621,
    likeCount: 144,
    downloadCount: 52,
    shareCount: 23
  }
]

const buildDefaultExamples = (type: 'mesh' | 'gaussian'): Model[] => {
  const now = Date.now()
  return defaultExampleSeeds.map((seed, index) => ({
    taskId: `demo-${type}-${index + 1}`,
    taskName: seed.taskName,
    status: 'completed',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: seed.viewCount,
    likeCount: seed.likeCount,
    isLiked: false,
    downloadCount: seed.downloadCount,
    shareCount: seed.shareCount,
    createdAt: new Date(now - (index + 1) * 3 * 60 * 60 * 1000).toISOString(),
    endAt: undefined,
    error: undefined,
    lightning: true,
    fps: 30,
    videoCount: 1,
    objectDescription: seed.objectDescription,
    ownerUsername: seed.ownerUsername,
    authorAvatar: '',
    preview: seed.preview,
    headimg: 'assets/logo.png',
    nickname: seed.nickname,
    isNew: false,
    type
  }))
}

const mapToModels = (tasks: any[], type: 'mesh' | 'gaussian'): Model[] =>
  tasks.map((task) => {
    const views = Number(task.viewCount ?? task.views_count ?? 0)
    return {
      taskId: String(task.taskId ?? task.task_id ?? task.id ?? ''),
      taskName: String(task.taskName ?? task.task_name ?? 'Untitled Model'),
      status: String(task.status ?? 'completed'),
      isPublic: Boolean(task.isPublic ?? task.is_public ?? true),
      nsfwBlocked: Boolean(task.nsfwBlocked ?? task.nsfw_blocked ?? false),
      viewCount: views,
      likeCount: Number(task.likeCount ?? task.likes_count ?? 0),
      isLiked: Boolean(task.isLiked ?? task.isLike ?? false),
      downloadCount: Number(task.downloadCount ?? task.downloads_count ?? 0),
      shareCount: Number(task.shareCount ?? task.shares_count ?? 0),
      createdAt: task.createdAt ?? task.created_at,
      endAt: task.endAt ?? task.end_at,
      error: task.error,
      lightning: Boolean(task.lightning ?? false),
      fps: task.fps ? Number(task.fps) : undefined,
      videoCount: task.videoCount ?? task.video_count,
      objectDescription: String(task.objectDescription ?? task.object_description ?? task.user_object_description ?? '暂无描述'),
      ownerUsername: String(task.ownerUsername ?? task.owner_username ?? '未知'),
      authorAvatar: String(task.authorAvatar ?? task.author_avatar ?? ''),
      preview: String(task.preview ?? task.preview_image ?? ''),
      headimg: String(task.headimg ?? 'assets/logo.png'),
      nickname: String(task.nickname ?? task.owner_username ?? '未知'),
      id: task.id ? String(task.id) : undefined,
      preview_image: task.preview_image ? String(task.preview_image) : undefined,
      task_name: task.task_name ? String(task.task_name) : undefined,
      isNew: views === 0,
      type
    }
  })

const pushUniqueModel = (target: Model[], model: Model, usedIds: Set<string>) => {
  const baseId = model.taskId && model.taskId.trim().length > 0 ? model.taskId : `model-${target.length + 1}`
  let taskId = baseId
  let index = 1

  while (usedIds.has(taskId)) {
    index += 1
    taskId = `${baseId}-${index}`
  }

  usedIds.add(taskId)
  target.push({ ...model, taskId })
}

const ensureMinimumItems = (serverModels: Model[], defaultModels: Model[], minimum: number): Model[] => {
  const merged: Model[] = []
  const usedIds = new Set<string>()

  serverModels.forEach((model) => {
    pushUniqueModel(merged, model, usedIds)
  })

  defaultModels.forEach((model) => {
    if (merged.length < minimum) {
      pushUniqueModel(merged, model, usedIds)
    }
  })

  let extraIndex = 0
  while (merged.length < minimum && defaultModels.length > 0) {
    const template = defaultModels[extraIndex % defaultModels.length]
    extraIndex += 1
    pushUniqueModel(merged, { ...template, taskId: `${template.taskId}-extra-${extraIndex}` }, usedIds)
  }

  return merged
}

const meshDefaultModels: Model[] = []
const gaussianDefaultModels: Model[] = []

const MeshModel = ref<Model[]>([...meshDefaultModels])
const _3DModel = ref<Model[]>([...gaussianDefaultModels])
const gaussianTotal = ref(_3DModel.value.length)

const meshLoading = ref(false)
const gaussianLoading = ref(false)
const tasksParams = ref<GetTaskListParams>({
  page: 1,
  pageSize: 12
})

const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false)
const showDesktopScrollButtons = computed(() => !isMobile.value)

const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
}

const createCarouselControls = (scrollRef: Ref<HTMLElement | null>) => {
  const scrollOffset = ref(0)
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartScrollLeft = ref(0)
  const hasDragged = ref(false)

  const canScrollLeft = computed(() => scrollOffset.value > 0)
  const canScrollRight = computed(() => {
    if (!scrollRef.value) return false
    const { scrollWidth, clientWidth } = scrollRef.value
    return scrollOffset.value < scrollWidth - clientWidth - 10
  })

  const handleScroll = () => {
    if (scrollRef.value) {
      scrollOffset.value = scrollRef.value.scrollLeft
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.value) return
    const scrollAmount = scrollRef.value.clientWidth * 0.8
    scrollRef.value.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  const startDrag = (pageX: number) => {
    if (!scrollRef.value) return
    isDragging.value = true
    hasDragged.value = false
    dragStartX.value = pageX
    dragStartScrollLeft.value = scrollRef.value.scrollLeft
  }

  const moveDrag = (pageX: number) => {
    if (!isDragging.value || !scrollRef.value) return false
    const walk = dragStartX.value - pageX
    if (Math.abs(walk) > 5) {
      hasDragged.value = true
    }
    scrollRef.value.scrollLeft = dragStartScrollLeft.value + walk
    scrollOffset.value = scrollRef.value.scrollLeft
    return true
  }

  const endDrag = () => {
    isDragging.value = false
  }

  const handleMouseDown = (event: MouseEvent) => {
    startDrag(event.pageX)
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!moveDrag(event.pageX)) return
    event.preventDefault()
  }

  const handleMouseUp = () => {
    endDrag()
  }

  const handleMouseLeave = () => {
    endDrag()
  }

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 0) return
    startDrag(event.touches[0].pageX)
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 0) return
    if (!moveDrag(event.touches[0].pageX)) return
    event.preventDefault()
  }

  const handleTouchEnd = () => {
    endDrag()
  }

  return {
    isDragging,
    hasDragged,
    canScrollLeft,
    canScrollRight,
    handleScroll,
    scroll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

const meshServerModels = ref<Model[]>([
  {
    taskId: 'task_001',
    taskName: '流浪者号',
    status: 'reconstructing_3dgs',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 128,
    likeCount: 32,
    isLiked: false,
    downloadCount: 8,
    shareCount: 4,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endAt: undefined,
    error: undefined,
    lightning: true,
    fps: 30,
    videoCount: 1,
    objectDescription: '流浪者号',
    ownerUsername: 'ric',
    authorAvatar: undefined,
    preview: 'https://3dgs-web.metast.xyz/aimodel/test.jpg',
    headimg: 'assets/logo.png',
    nickname: 'ric',
    isNew: true,
    type: 'mesh'
  }
])
const meshScrollRef = ref<HTMLElement | null>(null)
const gaussianScrollRef = ref<HTMLElement | null>(null)
const gaussianSectionRef = ref<HTMLElement | null>(null)

const meshCarousel = createCarouselControls(meshScrollRef)
const gaussianCarousel = createCarouselControls(gaussianScrollRef)

// MeshModel 使用默认模型
const fetchMeshModels = () => {
  meshLoading.value = true
  MeshModel.value = ensureMinimumItems(meshServerModels.value, meshDefaultModels, MIN_CAROUSEL_ITEMS)
  meshLoading.value = false
}

// _3DModel 从服务器获取
const fetchGaussianModels = async () => {
  gaussianLoading.value = true

  try {
    const response = await ApiServer.request({
      url: API.GET_OFFICIAL_MODEL,
      method: 'get'
    })

    const tasks = Array.isArray(response?.data?.data) ? response.data.data : []
    const gaussianFromServer = mapToModels(tasks, 'gaussian')

    _3DModel.value = ensureMinimumItems(gaussianFromServer, gaussianDefaultModels, MIN_CAROUSEL_ITEMS)
    gaussianTotal.value = _3DModel.value.length
  } catch (error) {
    _3DModel.value = ensureMinimumItems([], gaussianDefaultModels, MIN_CAROUSEL_ITEMS)
    gaussianTotal.value = _3DModel.value.length
    throw error
  } finally {
    gaussianLoading.value = false

    await nextTick()
    gaussianCarousel.handleScroll()
  }
}

// 兼容旧的 fetchModels
const fetchModels = async () => {
  fetchMeshModels()
  await fetchGaussianModels()
}

const openModelDetail = (model: Model) => {
  const routeData = router.resolve(`/officialModel/${model.taskId}`)
  window.open(routeData.href, '_blank')
}

const openAiModelDetail = (model: Model) => {
  const routeData = router.resolve(`/AiModel/${model.taskId}`)
  window.open(routeData.href, '_blank')
}

const handleCardClick = (model: Model) => {
  if (!meshCarousel.hasDragged.value) {
    openAiModelDetail(model)
  }
}

const handleGaussianCardClick = (model: Model) => {
  if (!gaussianCarousel.hasDragged.value) {
    openModelDetail(model)
  }
}

const handleGaussianPageChange = async (page: number) => {
  tasksParams.value.page = page
  await fetchModels()
  await nextTick()
  gaussianSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleResumeSuccess = async () => {
  await fetchModels()
}

onMounted(async () => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)

  try {
    await fetchModels()
  } catch (error) {
    console.error('error:', error)
    const err = error as {
      message?: string
      statusCode?: number
    }

    if (err?.message?.length) {
      message.error(err.message)
      return
    }

    const statusCode = err?.statusCode
    if (statusCode === 401) {
      message.error('Unauthorized access (401)')
    } else if (statusCode === 403) {
      message.error('Access denied (403)')
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}

.explore-view {
  width: 100%;
  max-width: 100%;
  padding-bottom: 40px;
}

.explore-section {
  margin-bottom: 40px;
}

.gaussian-section {
  scroll-margin-top: 88px;
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  margin-bottom: 4px;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

.section-subtitle {
  color: var(--text-secondary);
  font-size: 13px;
}

.models-carousel {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  overflow: visible;
}

.models-carousel .models-grid {
  display: flex;
  gap: 16px;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 2px;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  cursor: grab;
}

.models-carousel .models-grid::-webkit-scrollbar {
  display: none;
}

.models-carousel .models-grid.is-dragging {
  cursor: grabbing;
  scroll-behavior: auto;
}

.models-carousel .models-grid > * {
  flex: 0 0 200px;
  max-width: 200px;
}

.scroll-btn {
  position: absolute;
  z-index: 10;
  width: 40px;
  height: 40px;
  border: 1px solid var(--glass-border);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: var(--text-primary);
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.scroll-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.scroll-btn.scroll-left {
  left: -20px;
}

.scroll-btn.scroll-right {
  right: -20px;
}

.loading-grid {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 2px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.loading-grid::-webkit-scrollbar {
  display: none;
}

.skeleton-card {
  flex: 0 0 200px;
  max-width: 200px;
  padding: 12px;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  background: var(--glass-surface);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton-image {
  width: 100%;
  margin-bottom: 10px;
  border-radius: 8px;
  background: var(--glass-border);
  aspect-ratio: 1;
}

.skeleton-title {
  height: 14px;
  width: 70%;
  margin-bottom: 8px;
  border-radius: 4px;
  background: var(--glass-border);
}

.skeleton-desc {
  height: 12px;
  width: 50%;
  border-radius: 4px;
  background: var(--glass-border);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 1023px) {
  .scroll-btn {
    display: none !important;
  }

  .models-carousel .models-grid {
    gap: 12px;
  }

  .models-carousel .models-grid > * {
    flex-basis: 180px;
    max-width: 180px;
  }

  .loading-grid {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px 2px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .loading-grid::-webkit-scrollbar {
    display: none;
  }

  .skeleton-card {
    flex: 0 0 180px;
    max-width: 180px;
  }
}

@media (max-width: 640px) {
  .explore-view {
    width: calc(100vw - 24px);
    margin: 0 auto;
  }

  .section-header {
    margin-bottom: 14px;
  }

  .models-carousel .models-grid > * {
    flex-basis: 180px;
    max-width: 180px;
  }

  .loading-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .skeleton-card {
    flex: 0 0 180px;
    max-width: 180px;
  }
}
</style>
