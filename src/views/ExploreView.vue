<template>
  <div class="explore-view animate-fade-in">
    <!-- Mesh Models Section -->
    <section class="explore-section animate-fade-in-up" >
      <div class="section-header">
        <h2 class="section-title">{{ t('explore.ai3dModels') }}</h2>
        <p class="section-subtitle">{{ t('explore.weeklyUpdate') }}</p>
      </div>
      <div class="models-carousel" v-if="!meshLoading">
        <button
          v-show="meshCanScrollLeft"
          class="scroll-btn scroll-left"
          @click="scrollMesh('left')"
        >
          <LeftOutlined />
        </button>
        <div
          ref="meshScrollRef"
          class="models-grid"
          :class="{ 'is-dragging': isDragging }"
          @scroll="handleMeshScroll"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseLeave"
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
          v-show="meshCanScrollRight"
          class="scroll-btn scroll-right"
          @click="scrollMesh('right')"
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

    <!-- 3DGS Models Section -->
    <section class="explore-section gaussian-section animate-fade-in-up" style="animation-delay: 0.1s" ref="gaussianSectionRef">
      <div class="section-header">
        <h2 class="section-title">{{ t('explore.gs3dTitle') }}</h2>
        <p class="section-subtitle">{{ t('explore.weeklyUpdate') }}</p>
      </div>
      <div class="models-carousel" v-if="!gaussianLoading">
        <button
          v-show="gaussianCanScrollLeft"
          class="scroll-btn scroll-left"
          @click="scrollGaussian('left')"
        >
          <LeftOutlined />
        </button>
        <div
          ref="gaussianScrollRef"
          class="models-grid"
          :class="{ 'is-dragging': isDragging }"
          @scroll="handleGaussianScroll"
          @mousedown="onGaussianMouseDown"
          @mousemove="onGaussianMouseMove"
          @mouseup="onGaussianMouseUp"
          @mouseleave="onGaussianMouseLeave"
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
          v-show="gaussianCanScrollRight"
          class="scroll-btn scroll-right"
          @click="scrollGaussian('right')"
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

    <!-- Community Cards -->
    <section class="community-section animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="community-cards">
        <!-- YouTube Card -->
        <div class="community-card youtube-card">
          <div class="card-header">
            <div class="platform-icon youtube-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </div>
            <div class="card-title">
              <h3>{{ t('explore.youtubeTitle') }}</h3>
              <p>{{ t('explore.youtubeDesc') }}</p>
            </div>
          </div>
          <div class="video-preview">
            <div class="video-thumb">
              <span class="play-icon">▶</span>
              <span class="video-title">That's why MetaST Engine Basic plan Offers Unlimited...</span>
            </div>
            <div class="video-actions">
              <button class="action-btn">{{ t('explore.watchLater') }}</button>
              <button class="action-btn">{{ t('explore.share') }}</button>
            </div>
          </div>
        </div>

        <!-- Discord Card -->
        <div class="community-card discord-card">
          <div class="card-header">
            <div class="platform-icon discord-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div class="card-title">
              <h3>{{ t('explore.discordTitle') }}</h3>
              <p>{{ t('explore.discordDesc') }}</p>
            </div>
          </div>
          <div class="discord-preview">
            <div class="discord-banner">
              <span class="discord-logo">Discord</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import OfficialModelCard from '@/components/OfficialModelCard.vue'
import { TaskModel, ApiServer, GetTaskListParams } from '@/utils/taskService'
import API from '@/utils/api'
const router = useRouter()
const { t } = useI18n()

interface Model extends TaskModel {
  id?: string
  preview_image?: string
  task_name?: string
  isNew: boolean
  type: 'mesh' | 'gaussian'
}

const MeshModel = ref<Model[]>([
  {
    taskId: 'task_001',
    taskName: '户外花园3D重建',
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
    objectDescription: '户外花园场景，包含花卉、长椅、围栏，要求高清3D重建',
    ownerUsername: 'ric',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1001',
    headimg: 'assets/logo.png',
    nickname: 'ric',
    isNew: true,
    type: 'mesh'
  },
  {
    taskId: 'task_002',
    taskName: '城市建筑扫描',
    status: 'completed',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 256,
    likeCount: 45,
    isLiked: false,
    downloadCount: 32,
    shareCount: 12,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    error: undefined,
    lightning: false,
    fps: 30,
    videoCount: 1,
    objectDescription: '城市高楼建筑3D扫描重建，精确还原建筑细节',
    ownerUsername: 'cityscan',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1002',
    headimg: 'assets/logo.png',
    nickname: 'cityscan',
    isNew: false,
    type: 'mesh'
  },
  {
    taskId: 'task_003',
    taskName: '室内家居设计',
    status: 'completed',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 189,
    likeCount: 28,
    isLiked: true,
    downloadCount: 15,
    shareCount: 6,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
    error: undefined,
    lightning: true,
    fps: 30,
    videoCount: 1,
    objectDescription: '现代简约风格客厅3D重建，家具布局精准还原',
    ownerUsername: 'homedesign',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1003',
    headimg: 'assets/logo.png',
    nickname: 'homedesign',
    isNew: false,
    type: 'mesh'
  },
  {
    taskId: 'task_004',
    taskName: '历史文物修复',
    status: 'reconstructing_3dgs',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 312,
    likeCount: 67,
    isLiked: false,
    downloadCount: 24,
    shareCount: 18,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    endAt: undefined,
    error: undefined,
    lightning: true,
    fps: 30,
    videoCount: 1,
    objectDescription: '古代陶瓷文物3D扫描重建，高精度还原文物细节',
    ownerUsername: 'heritage',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1004',
    headimg: 'assets/logo.png',
    nickname: 'heritage',
    isNew: true,
    type: 'mesh'
  },
  {
    taskId: 'task_005',
    taskName: '汽车模型展示',
    status: 'completed',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 445,
    likeCount: 89,
    isLiked: false,
    downloadCount: 56,
    shareCount: 23,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 68 * 60 * 60 * 1000).toISOString(),
    error: undefined,
    lightning: false,
    fps: 30,
    videoCount: 1,
    objectDescription: '经典老爷车3D模型重建，细节完美还原',
    ownerUsername: 'autocars',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1005',
    headimg: 'assets/logo.png',
    nickname: 'autocars',
    isNew: false,
    type: 'mesh'
  },
  {
    taskId: 'task_006',
    taskName: '人物肖像扫描',
    status: 'completed',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 178,
    likeCount: 34,
    isLiked: false,
    downloadCount: 12,
    shareCount: 8,
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 92 * 60 * 60 * 1000).toISOString(),
    error: undefined,
    lightning: true,
    fps: 30,
    videoCount: 1,
    objectDescription: '人物面部3D扫描重建，高精度还原面部特征',
    ownerUsername: 'portraitscan',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1006',
    headimg: 'assets/logo.png',
    nickname: 'portraitscan',
    isNew: false,
    type: 'mesh'
  },
  {
    taskId: 'task_007',
    taskName: '地形地貌测绘',
    status: 'completed',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 267,
    likeCount: 51,
    isLiked: false,
    downloadCount: 38,
    shareCount: 14,
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 116 * 60 * 60 * 1000).toISOString(),
    error: undefined,
    lightning: false,
    fps: 30,
    videoCount: 1,
    objectDescription: '山地地形3D扫描测绘，精确还原地形特征',
    ownerUsername: 'terrainmap',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1007',
    headimg: 'assets/logo.png',
    nickname: 'terrainmap',
    isNew: false,
    type: 'mesh'
  },
  {
    taskId: 'task_008',
    taskName: '游戏角色建模',
    status: 'reconstructing_3dgs',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 523,
    likeCount: 102,
    isLiked: false,
    downloadCount: 67,
    shareCount: 31,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    endAt: undefined,
    error: undefined,
    lightning: true,
    fps: 30,
    videoCount: 1,
    objectDescription: '游戏角色3D建模绑定，高品质角色渲染',
    ownerUsername: 'gamechar',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1008',
    headimg: 'assets/logo.png',
    nickname: 'gamechar',
    isNew: true,
    type: 'mesh'
  },
  {
    taskId: 'task_009',
    taskName: '工业零件检测',
    status: 'completed',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 156,
    likeCount: 23,
    isLiked: false,
    downloadCount: 45,
    shareCount: 9,
    createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 140 * 60 * 60 * 1000).toISOString(),
    error: undefined,
    lightning: false,
    fps: 30,
    videoCount: 1,
    objectDescription: '工业机械零件3D扫描检测，精度达到毫米级',
    ownerUsername: 'industrial3d',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1009',
    headimg: 'assets/logo.png',
    nickname: 'industrial3d',
    isNew: false,
    type: 'mesh'
  },
  {
    taskId: 'task_010',
    taskName: '珠宝设计展示',
    status: 'completed',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 298,
    likeCount: 56,
    isLiked: false,
    downloadCount: 28,
    shareCount: 15,
    createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 164 * 60 * 60 * 1000).toISOString(),
    error: undefined,
    lightning: true,
    fps: 30,
    videoCount: 1,
    objectDescription: '珠宝首饰3D建模展示，精美绝伦的细节还原',
    ownerUsername: 'jewelry3d',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1010',
    headimg: 'assets/logo.png',
    nickname: 'jewelry3d',
    isNew: false,
    type: 'mesh'
  },
  {
    taskId: 'task_011',
    taskName: '校园导览系统',
    status: 'completed',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 412,
    likeCount: 78,
    isLiked: false,
    downloadCount: 34,
    shareCount: 22,
    createdAt: new Date(Date.now() - 192 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() - 188 * 60 * 60 * 1000).toISOString(),
    error: undefined,
    lightning: false,
    fps: 30,
    videoCount: 1,
    objectDescription: '大学校园3D全景重建，虚拟导览系统基础数据',
    ownerUsername: 'campus3d',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1011',
    headimg: 'assets/logo.png',
    nickname: 'campus3d',
    isNew: false,
    type: 'mesh'
  },
  {
    taskId: 'task_012',
    taskName: '医疗影像重建',
    status: 'reconstructing_3dgs',
    isPublic: true,
    nsfwBlocked: false,
    viewCount: 234,
    likeCount: 42,
    isLiked: false,
    downloadCount: 19,
    shareCount: 11,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    endAt: undefined,
    error: undefined,
    lightning: true,
    fps: 30,
    videoCount: 1,
    objectDescription: '人体器官3D重建，医疗影像可视化应用',
    ownerUsername: 'medical3d',
    authorAvatar: undefined,
    preview: 'https://picsum.photos/400/500?random=1012',
    headimg: 'assets/logo.png',
    nickname: 'medical3d',
    isNew: false,
    type: 'mesh'
  },
])

// Mesh 滚动相关逻辑
const meshScrollRef = ref<HTMLElement | null>(null)
const meshScrollLeft = ref(0)

// 鼠标拖动相关
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const hasDragged = ref(false) // 是否真正拖动过

const meshCanScrollLeft = computed(() => meshScrollLeft.value > 0)
const meshCanScrollRight = computed(() => {
  if (!meshScrollRef.value) return false
  const { scrollWidth, clientWidth } = meshScrollRef.value
  return meshScrollLeft.value < scrollWidth - clientWidth - 10
})

const handleMeshScroll = () => {
  if (meshScrollRef.value) {
    meshScrollLeft.value = meshScrollRef.value.scrollLeft
  }
}

const scrollMesh = (direction: 'left' | 'right') => {
  if (!meshScrollRef.value) return
  const scrollAmount = meshScrollRef.value.clientWidth * 0.8
  meshScrollRef.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  })
}

// 鼠标拖动滚动
const onMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  hasDragged.value = false
  startX.value = e.pageX
  if (meshScrollRef.value) {
    scrollLeft.value = meshScrollRef.value.scrollLeft
  }
}

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !meshScrollRef.value) return
  e.preventDefault()
  const x = e.pageX
  const walk = (startX.value - x) // 拖动速度系数
  if (Math.abs(walk) > 5) {
    hasDragged.value = true
  }
  meshScrollRef.value.scrollLeft = scrollLeft.value + walk
}

const onMouseUp = () => {
  isDragging.value = false
}

const onMouseLeave = () => {
  isDragging.value = false
}

// Gaussian 滚动相关逻辑
const gaussianScrollRef = ref<HTMLElement | null>(null)
const gaussianScrollLeft = ref(0)

// Gaussian 鼠标拖动相关
const gaussianIsDragging = ref(false)
const gaussianStartX = ref(0)
const gaussianScrollLeftVal = ref(0)
const gaussianHasDragged = ref(false)

const gaussianCanScrollLeft = computed(() => gaussianScrollLeft.value > 0)
const gaussianCanScrollRight = computed(() => {
  if (!gaussianScrollRef.value) return false
  const { scrollWidth, clientWidth } = gaussianScrollRef.value
  return gaussianScrollLeft.value < scrollWidth - clientWidth - 10
})

const handleGaussianScroll = () => {
  if (gaussianScrollRef.value) {
    gaussianScrollLeft.value = gaussianScrollRef.value.scrollLeft
  }
}

const scrollGaussian = (direction: 'left' | 'right') => {
  if (!gaussianScrollRef.value) return
  const scrollAmount = gaussianScrollRef.value.clientWidth * 0.8
  gaussianScrollRef.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  })
}

const onGaussianMouseDown = (e: MouseEvent) => {
  gaussianIsDragging.value = true
  gaussianHasDragged.value = false
  gaussianStartX.value = e.pageX
  if (gaussianScrollRef.value) {
    gaussianScrollLeftVal.value = gaussianScrollRef.value.scrollLeft
  }
}

const onGaussianMouseMove = (e: MouseEvent) => {
  if (!gaussianIsDragging.value || !gaussianScrollRef.value) return
  e.preventDefault()
  const x = e.pageX
  const walk = (gaussianStartX.value - x)
  if (Math.abs(walk) > 5) {
    gaussianHasDragged.value = true
  }
  gaussianScrollRef.value.scrollLeft = gaussianScrollLeftVal.value + walk
}

const onGaussianMouseUp = () => {
  gaussianIsDragging.value = false
}

const onGaussianMouseLeave = () => {
  gaussianIsDragging.value = false
}

const handleGaussianCardClick = (model: Model) => {
  if (!gaussianHasDragged.value) {
    openModelDetail(model)
  }
}

// 加载状态
const meshLoading = ref(false)
const gaussianLoading = ref(false)

// 骨架屏数量
const meshSkeletonCount = 12
const gaussianSkeletonCount = 12

const _3DModel = ref<Model[]>([])
const gaussianTotal = ref(0)
const gaussianSectionRef = ref<HTMLElement | null>(null)

const tasksParams = ref<GetTaskListParams>({
  page: 1,
  pageSize: 12,
})  

const mapToModels = (tasks: Model[], type: 'mesh' | 'gaussian'): Model[] => tasks.map(task => ({
  taskId: task.taskId || task.id || 'unknown_id',
  taskName: task.taskName || task.task_name || '未命名任务',
  status: task.status || '"completed"',
  objectDescription: task.objectDescription || '暂无描述',
  ownerUsername: task.ownerUsername || '未知用户',
  authorAvatar: task.authorAvatar || '',
  preview: task.preview || task.preview_image || '',
  nickname: task.nickname || '未知',
  isPublic: task.isPublic ?? true,
  viewCount: task.viewCount ?? 0,
  likeCount: task.likeCount ?? 0,
  isLiked: task.isLiked ?? false,
  downloadCount: task.downloadCount ?? 0,
  shareCount: task.shareCount ?? 0,
  isNew: task.viewCount === 0,
  type
}))

const fetchGaussianModels = async () => {
  gaussianLoading.value = true
  try {
    const response = await ApiServer.request({
      url: API.GET_OFFICIAL_MODEL,
      method: "get",
    })
    const tasks = response?.data?.data || []
    _3DModel.value = mapToModels(tasks, 'gaussian')
    gaussianTotal.value = _3DModel.value.length
  } finally {
    gaussianLoading.value = false
  }
}

const handleGaussianPageChange = async (page: number) => {
  tasksParams.value.page = page
  await fetchGaussianModels()
  await nextTick()
  gaussianSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const openModelDetail = (model: Model)  => {
  const routeData = router.resolve(`/officialModel/${model.taskId}`)
   window.open(routeData.href, '_blank')
}

// 处理卡片点击，只有在非拖动情况下才触发
const handleCardClick = (model: Model) => {
  if (!hasDragged.value) {
    openModelDetail(model)
  }
}

const handleResumeSuccess = async () => {
  await fetchGaussianModels()
}

onMounted(async () => {
  try {
    await fetchGaussianModels()
  } catch (error) {
    console.error('error:', error)
    const err = error as {
      message?: string
      statusCode?: number
    }
    console.error('err:', err)
    if (err?.message?.length && err.message.length > 0) {
      message.error(err.message)
      return
    }

    const statusCode = err?.statusCode
    if (statusCode === 401) {
      message.error('未授权访问（401）')
    } else if (statusCode === 403) {
      message.error('访问被禁止（403）')
    }
  }
})

</script>

<style scoped>
/* Entry animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.section-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 滚动轮播容器 */
.models-carousel {
  position: relative;
  display: flex;
  align-items: center;
}

.models-carousel .models-grid {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  padding: 4px 0;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.models-carousel .models-grid.is-dragging {
  cursor: grabbing;
  scroll-behavior: auto;
}

.models-carousel .models-grid::-webkit-scrollbar {
  display: none;
}

.models-carousel .models-grid > * {
  flex-shrink: 0;
  width: 200px;
}

/* 滚动按钮 */
.scroll-btn {
  position: absolute;
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-primary);
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

/* Loading skeleton */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.skeleton-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 4/5;
  background: var(--glass-border);
  border-radius: 8px;
  margin-bottom: 10px;
}

.skeleton-title {
  height: 14px;
  width: 70%;
  background: var(--glass-border);
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-desc {
  height: 12px;
  width: 50%;
  background: var(--glass-border);
  border-radius: 4px;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* Community Section */
.community-section {
  margin-top: 40px;
}

.community-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.community-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.community-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.platform-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.youtube-icon {
  background: #ff0000;
  color: white;
}

.discord-icon {
  background: #5865f2;
  color: white;
}

.card-title h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-title p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Video Preview */
.video-preview {
  background: var(--glass-surface);
  border-radius: 12px;
  overflow: hidden;
}

.video-thumb {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  position: relative;
}

.play-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #ff0000;
  margin-bottom: 12px;
}

.video-title {
  font-size: 13px;
  color: white;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-actions {
  display: flex;
  padding: 10px;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px;
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--glass-surface);
  color: var(--text-primary);
}

/* Discord Preview */
.discord-preview {
  border-radius: 12px;
  overflow: hidden;
}

.discord-banner {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #5865f2, #7289da);
  display: flex;
  align-items: center;
  justify-content: center;
}

.discord-logo {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

/* Responsive */
@media (max-width: 1023px) {
  .models-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .community-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .models-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
