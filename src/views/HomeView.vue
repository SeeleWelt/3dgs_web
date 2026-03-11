<template>
  <div class="home-view">
    <CreateSection />
    
    <!-- Projects Section -->
    <div class="projects-section">
      <div class="section-tabs">
        <div class="tabs-left">
          <div
            v-for="tab in typeTabs"
            :key="tab.key"
            class="tab"
            :class="{ active: activeTypeTab === tab.key }"
            @click="activeTypeTab = tab.key"
          >
            {{ tab.label }}
          </div>
        </div>
        
        <div class="tabs-right">
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input v-model="searchQuery" type="text" placeholder="按作品名称或描述进行搜索" />
          </div>
          <button class="select-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            {{ t('home.select') }}
          </button>
        </div>
      </div>

      <template v-if="filteredModels.length > 0">
        <div class="models-grid">
          <ModelCard
            v-for="model in filteredModels"
            :key="model.taskId"
            :model="model"
            :highlight-keyword="searchQuery"
            @click="openModelDetail(model)"
            @resume-success="handleResumeSuccess"
            @task-action-success="handleResumeSuccess"
            @task-deleted="handleResumeSuccess"
          />
        </div>

        <div class="pagination-wrap" v-if="!searchQueryTrimmed && displayTotal > activePageSize">
          <a-pagination
            :current="activePagination.page"
            :page-size="activePageSize"
            :total="displayTotal"
            :show-size-changer="false"
            :show-less-items="true"
            @change="handlePageChange"
          />
        </div>
      </template>

      <div v-else-if="isSearching && hasBaseData" class="search-empty-state">
        <div class="search-empty-icon" aria-hidden="true">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="M20 20L16.65 16.65"></path>
            <path d="M8.5 10.5h5"></path>
          </svg>
        </div>
        <p class="search-empty-title">没有找到对应结果</p>
        <p class="search-empty-desc">试试更短的关键词，或搜索作品名称/描述中的其他词</p>
      </div>

      <EmptyState v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CreateSection from '../components/CreateSection.vue'
import EmptyState from '../components/EmptyState.vue'
import ModelCard from '../components/ModelCard.vue'
import { ApiServer, GetTaskListParams, TaskModel } from '@/utils/taskService'

const { t } = useI18n()
const router = useRouter()

interface Model extends TaskModel {
  isNew: boolean
  type: 'mesh' | 'gaussian'
}

const activeTypeTab = ref('scan')
const searchQuery = ref('')

const defaultMeshModels: Model[] = [
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
  }
]

const MeshModel = ref<Model[]>([...defaultMeshModels])
const Model3D = ref<Model[]>([])

const meshPagination = ref<GetTaskListParams>({
  page: 1,
  pageSize: 12,
  mode: 'scan'
})

const model3DPagination = ref<GetTaskListParams>({
  page: 1,
  pageSize: 12,
  mode: '3dgs'
})

const meshTotal = ref(defaultMeshModels.length)
const model3DTotal = ref(0)

const typeTabs = computed(() => [
  { key: 'scan', label: t('home.scan') },
  { key: '3dgs', label: t('home.gs3d') },
  // { key: '4dgs', label: t('home.gs4d') }
])

const displayModels = computed(() => {
  if (activeTypeTab.value === 'scan') return MeshModel.value
  if (activeTypeTab.value === '3dgs') return Model3D.value
  return []
})

const displayTotal = computed(() => {
  if (activeTypeTab.value === 'scan') return meshTotal.value
  if (activeTypeTab.value === '3dgs') return model3DTotal.value
  return 0
})

const activePagination = computed(() => {
  if (activeTypeTab.value === 'scan') return meshPagination.value
  if (activeTypeTab.value === '3dgs') return model3DPagination.value
  return { page: 1, pageSize: 12 }
})

const activePageSize = computed(() => Number(activePagination.value.pageSize || 12))

const searchQueryTrimmed = computed(() => searchQuery.value.trim())
const isSearching = computed(() => searchQueryTrimmed.value.length > 0)
const hasBaseData = computed(() => displayModels.value.length > 0)

const normalizeText = (text: string) => text.toLowerCase().replace(/\s+/g, '')

const filteredModels = computed(() => {
  const models = displayModels.value
  const keyword = normalizeText(searchQueryTrimmed.value)
  if (!keyword) return models

  return models.filter((item) => {
    const name = normalizeText(item.taskName || '')
    const desc = normalizeText(item.objectDescription || '')
    return name.includes(keyword) || desc.includes(keyword)
  })
})

const mapToModels = (tasks: TaskModel[], type: 'mesh' | 'gaussian'): Model[] => tasks.map(task => ({
  ...task,
  isNew: task.viewCount === 0,
  type
}))

const fetchScanModels = async () => {
  try {

    MeshModel.value = []
    meshTotal.value = 0

  } catch (error) {
    console.error('Fetch scan models failed:', error)
    MeshModel.value = [...defaultMeshModels]
    meshTotal.value = defaultMeshModels.length
  }
}

const fetch3DModels = async () => {
  try {
    const tasks = await ApiServer.getTaskList(model3DPagination.value)
    Model3D.value = mapToModels(tasks, 'gaussian')
    model3DTotal.value = ApiServer.totalTasks || 0
  } catch (error) {
    console.error('Fetch 3DGS models failed:', error)
    Model3D.value = []
    model3DTotal.value = 0
  }
}

const fetchCurrentTab = async () => {
  if (activeTypeTab.value === 'scan') {
    await fetchScanModels()
    return
  }
  if (activeTypeTab.value === '3dgs') {
    await fetch3DModels()
  }
}

const handlePageChange = async (page: number) => {
  if (activeTypeTab.value === 'scan') {
    meshPagination.value.page = page
    await fetchScanModels()
    return
  }
  if (activeTypeTab.value === '3dgs') {
    model3DPagination.value.page = page
    await fetch3DModels()
  }
}

const openModelDetail = (model: Model) => {
  router.push(`/model/${model.taskId}`)
}

const handleResumeSuccess = async () => {
  if (activeTypeTab.value === 'scan') {
    await fetchScanModels()
    return
  }
  if (activeTypeTab.value === '3dgs') {
    await fetch3DModels()
  }
}

watch(activeTypeTab, async () => {
  await fetchCurrentTab()
})

onMounted(async () => {
  await fetchScanModels()
  await fetch3DModels()
})
</script>

<style scoped>
.home-view {
  width: 100%;
}

.projects-section {
  margin-top: 32px;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.search-empty-state {
  margin-top: 20px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary);
}

.search-empty-icon {
  width: 92px;
  height: 92px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--glass-border);
  background: var(--glass-surface);
  color: var(--text-tertiary);
  margin-bottom: 14px;
}

.search-empty-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.search-empty-desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.section-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.tabs-left {
  display: flex;
  gap: 24px;
}

.tab {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  padding-bottom: 8px;
  position: relative;
  transition: color 0.3s ease;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent-blue);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-blue);
  border-radius: 2px;
}

.tabs-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-secondary);
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  width: 120px;
  color: var(--text-primary);
}

.search-box input::placeholder {
  color: var(--text-tertiary);
}

.select-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-btn:hover {
  background: var(--glass-surface-hover);
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .section-tabs {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .models-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .tabs-right {
    width: 100%;
  }

  .search-box {
    flex: 1;
  }
}
</style>
