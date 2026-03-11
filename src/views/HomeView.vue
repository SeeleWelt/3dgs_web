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
          <div class="search-box" v-if="!isManagementMode">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input v-model="searchQuery" type="text" placeholder="按作品名称或描述进行搜索" />
          </div>
          <!-- Management mode buttons -->
          <template v-if="isManagementMode">
            <div class="select-all-wrap">
              <a-checkbox
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              />
              <span class="select-all-text">全选</span>
            </div>
            <span class="selected-count">已选 {{ selectedCount }} 项</span>
            <Transition name="fade-slide">
              <button
                v-if="canPause"
                class="action-btn pause-btn"
                @click="handleBatchPause"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
                批量暂停
              </button>
            </Transition>
            <Transition name="fade-slide">
              <button
                v-if="canResume"
                class="action-btn start-btn"
                @click="handleBatchResume"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                批量开始
              </button>
            </Transition>
            <Transition name="fade-slide">
              <button
                v-if="canExport"
                class="action-btn export-btn"
                @click="handleBatchExport"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                批量导出
              </button>
            </Transition>
            <Transition name="fade-slide">
              <button
                v-if="selectedCount > 0"
                class="action-btn delete-btn"
                @click="handleBatchDelete"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                批量删除
              </button>
            </Transition>
          </template>
          <button class="select-btn" :class="{ active: isManagementMode }" @click="toggleManagementMode">
            <svg v-if="!isManagementMode" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            {{ isManagementMode ? '退出' : t('home.select') }}
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
            :show-checkbox="isManagementMode"
            :checked="isSelected(model.taskId)"
            
            @click="handleCardClick(model)"
            @resume-success="handleResumeSuccess"
            @task-action-success="handleResumeSuccess"
            @task-deleted="handleResumeSuccess"
            @update:checked="(val) => handleSelectionChange(model.taskId, val)"
          />
        </div>

        <div class="pagination-wrap" v-if="displayTotal > activePageSize">
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

      <div v-else-if="isLoading" class="loading-state">
        <div class="loading-grid">
          <div v-for="i in 8" :key="i" class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-desc"></div>
          </div>
        </div>
      </div>

      <div v-else-if="isSearching && !hasBaseData" class="search-empty-state">
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

      <EmptyState v-else :type="activeTypeTab === 'mesh' ? 'mesh-scan' : '3dgs-scan'" :error="fetchError" @retry="fetchCurrentTab" />
    </div>

    <!-- Batch Export Format Modal -->
    <a-modal
      v-model:open="showBatchExportModal"
      title="批量导出"
      :mask-closable="isExporting"
      :closable="!isExporting"
      :footer="null"

    >
      <div class="export-form">
        <div class="form-item">
          <label class="form-label">导出格式</label>
          <a-select
            v-model:value="selectedExportFormat"
            :options="formatOptions"
            placeholder="请选择导出格式"
            style="width: 100%"
          />
        </div>

        <div class="format-tip">
          <span class="tip-label">支持情况：</span>
          <span class="tip-ok">PLY、SOG 可导出</span>
          <span class="tip-split">|</span>
          <span class="tip-disabled">OBJ、FBX、GLTF 暂不支持</span>
        </div>

        <div v-if="exportStatusText" class="status-text">{{ exportStatusText }}</div>

        <a-progress
          v-if="isExporting"
          :percent="exportProgress"
          :status="isExporting ? 'active' : 'normal'"
        />

        <div class="export-actions">
          <a-button @click="cancelBatchExport" :disabled="isExporting">关闭</a-button>
          <a-button
            type="primary"
            :loading="isExporting"
            :disabled="isExporting"
            @click="confirmBatchExport"
          >
            开始导出
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import CreateSection from '../components/CreateSection.vue'
import EmptyState from '../components/EmptyState.vue'
import ModelCard from '../components/ModelCard.vue'
import { ApiServer, GetTaskListParams, TaskModel } from '@/utils/taskService'
import API from '@/utils/api'

const { t } = useI18n()
const router = useRouter()

interface Model extends TaskModel {
  isNew: boolean
  type: 'mesh' | 'gaussian'
}

// 保存当前选中的tab
const getInitialTab = () => {
  try {
    return sessionStorage.getItem('home_active_tab') || 'mesh'
  } catch {
    return 'mesh'
  }
}

const activeTypeTab = ref(getInitialTab())
const searchQuery = ref('')

// Management mode state
const isManagementMode = ref(false)
const selectedModels = ref<Set<string>>(new Set())

// Toggle management mode
const toggleManagementMode = () => {
  if (isManagementMode.value) {
    // Exit management mode and clear selections
    selectedModels.value.clear()
  }
  isManagementMode.value = !isManagementMode.value
}

// Check if a model is selected
const isSelected = (taskId: string) => selectedModels.value.has(taskId)

// Handle selection change
const handleSelectionChange = (taskId: string, checked: boolean) => {
  if (checked) {
    selectedModels.value.add(taskId)
  } else {
    selectedModels.value.delete(taskId)
  }
}

// Get selected count
const selectedCount = computed(() => selectedModels.value.size)

// Check if selected models can be exported (all must be completed)
const canExport = computed(() => {
  if (selectedCount.value === 0) return false
  const selected = filteredModels.value.filter(m => selectedModels.value.has(m.taskId || ''))
  return selected.length > 0 && selected.every(m => m.status === 'completed')
})

// Processing status list
const processingStatusList = [
  'received',
  'slicing',
  'reconstructing_colmap',
  'reconstructing_3dgs',
  'reconstructing_lightning',
  'processing_bg_removal',
  'resuming',
]

// Check if all visible models are selected
const isAllSelected = computed(() => {
  const visibleModels = filteredModels.value
  if (visibleModels.length === 0) return false
  return visibleModels.every(m => selectedModels.value.has(m.taskId || ''))
})

// Check if some models are selected (indeterminate state)
const isIndeterminate = computed(() => {
  const visibleModels = filteredModels.value
  if (visibleModels.length === 0) return false
  const selectedCount = visibleModels.filter(m => selectedModels.value.has(m.taskId || '')).length
  return selectedCount > 0 && selectedCount < visibleModels.length
})

// Handle select all
const handleSelectAll = () => {
  if (isAllSelected.value) {
    // Deselect all visible models
    filteredModels.value.forEach(m => {
      if (m.taskId) selectedModels.value.delete(m.taskId)
    })
  } else {
    // Select all visible models
    filteredModels.value.forEach(m => {
      if (m.taskId) selectedModels.value.add(m.taskId)
    })
  }
  // Trigger reactivity
  selectedModels.value = new Set(selectedModels.value)
}

// Check if can pause (ALL selected models must be processing)
const canPause = computed(() => {
  if (selectedCount.value === 0) return false
  const selected = filteredModels.value.filter(m => selectedModels.value.has(m.taskId || ''))
  if (selected.length === 0) return false
  // All selected models must be processing (not paused, not failed, not completed)
  return selected.every(m => processingStatusList.includes(m.status || '') && !m.nsfwBlocked)
})

// Check if can resume (ALL selected models must be paused or failed)
const canResume = computed(() => {
  if (selectedCount.value === 0) return false
  const selected = filteredModels.value.filter(m => selectedModels.value.has(m.taskId || ''))
  if (selected.length === 0) return false
  // All selected models must be paused or failed
  return selected.every(m => (m.status === 'paused' || m.status === 'failed') && !m.nsfwBlocked)
})

// Batch pause
const handleBatchPause = async () => {
  const selected = filteredModels.value.filter(m =>
    selectedModels.value.has(m.taskId || '') &&
    processingStatusList.includes(m.status || '') &&
    !m.nsfwBlocked
  )

  if (selected.length === 0) {
    message.warning('没有可暂停的任务')
    return
  }

  Modal.confirm({
    title: '确认批量暂停',
    content: `确定要暂停选中的 ${selected.length} 个任务吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      let successCount = 0

      for (const model of selected) {
        try {
          const token = localStorage.getItem('token') || undefined
          await ApiServer.request({
            url: `${API.BASE_URL}${API.TASK_DETAIL}/${model.taskId}/pause`,
            method: 'post',
            data: { taskId: model.taskId, task_id: model.taskId },
          }, token)
          successCount++
        } catch (error) {
          console.error(`Pause task ${model.taskId} failed:`, error)
        }
      }

      message.success(`成功暂停 ${successCount} 个任务`)
      await fetchCurrentTab()
    }
  })
}

// Batch resume/start
const handleBatchResume = async () => {
  const selected = filteredModels.value.filter(m =>
    selectedModels.value.has(m.taskId || '') &&
    (m.status === 'paused' || m.status === 'failed') &&
    !m.nsfwBlocked
  )

  if (selected.length === 0) {
    message.warning('没有可开始的任务')
    return
  }

  Modal.confirm({
    title: '确认批量开始',
    content: `确定要开始选中的 ${selected.length} 个任务吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      let successCount = 0

      for (const model of selected) {
        try {
          const token = localStorage.getItem('token') || undefined
          await ApiServer.request({
            url: `${API.TASK_DETAIL}/${model.taskId}/resume`,
            method: 'post',
            data: { taskId: model.taskId, task_id: model.taskId },
          }, token)
          successCount++
        } catch (error) {
          console.error(`Resume task ${model.taskId} failed:`, error)
        }
      }

      message.success(`成功开始 ${successCount} 个任务`)
      await fetchCurrentTab()
    }
  })
}

// Batch export modal state
const showBatchExportModal = ref(false)
const selectedExportFormat = ref('sog')
const isExporting = ref(false)
const exportProgress = ref(0)
const exportStatusText = ref('')
const abortController = ref<AbortController | null>(null)

const formatOptions = [
  { label: 'SOG', value: 'sog' },
  { label: 'PLY', value: 'ply' },
  { label: 'OBJ（暂不支持）', value: 'obj', disabled: true },
  { label: 'FBX（暂不支持）', value: 'fbx', disabled: true },
  { label: 'GLTF（暂不支持）', value: 'gltf', disabled: true },
]

// Open batch export modal
const handleBatchExport = () => {
  showBatchExportModal.value = true
  exportProgress.value = 0
  exportStatusText.value = ''
}

// Cancel batch export
const cancelBatchExport = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isExporting.value = false
  showBatchExportModal.value = false
}

// Download helper
const downloadBlob = (blob: Blob, fileName: string) => {
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

// Confirm and start batch export
const confirmBatchExport = async () => {
  const selected = filteredModels.value.filter(m => selectedModels.value.has(m.taskId || ''))
  if (selected.length === 0) {
    message.warning('请先选择要导出的任务')
    return
  }

  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在准备导出...'
  abortController.value = new AbortController()
  const token = localStorage.getItem('token')

  let successCount = 0

  for (let i = 0; i < selected.length; i++) {
    const model = selected[i]
    exportStatusText.value = `正在导出 ${i + 1}/${selected.length}: ${model.taskName || model.taskId}`

    try {
      // Get download token
      const tokenResp = await ApiServer.request({
        url: `${API.TASK_DETAIL}/${model.taskId}/download-token`,
        method: 'post',
        data: null,
        signal: abortController.value.signal,
      }, token || undefined)

      const downloadToken = tokenResp?.data?.token
      if (!downloadToken) {
        console.warn(`获取下载令牌失败: ${model.taskId}`)
        continue
      }

      // Download the file
      const response = await ApiServer.request({
        url: `${API.DOWNLOAD_MODEL}/${model.taskId}`,
        method: 'get',
        params: {
          format: selectedExportFormat.value,
          token: downloadToken,
        },
        responseType: 'blob',
        signal: abortController.value.signal,
        onDownloadProgress: (event) => {
          if (!event.total) return
          const percent = Math.round((event.loaded / event.total) * 100)
          exportProgress.value = Math.round(((i + percent / 100) / selected.length) * 100)
        },
      }, token || undefined)

      // Save file
      const baseName = (model.taskName || 'model').replace(/\.[^/.]+$/, '')
      const fileName = `${baseName}.${selectedExportFormat.value}`
      downloadBlob(response.data, fileName)
      successCount++

    } catch (error: any) {
      const canceled = error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
      if (canceled) {
        exportStatusText.value = '导出已取消'
        isExporting.value = false
        return
      }
      console.warn(`导出失败: ${model.taskId}`, error)
    }finally {
      isExporting.value = false
    }
  }

  exportProgress.value = 100
  exportStatusText.value = `导出完成，成功 ${successCount}/${selected.length}`
  message.success(`成功导出 ${successCount} 个任务`)
  isExporting.value = false

  setTimeout(() => {
    showBatchExportModal.value = false
  }, 1500)
}

// Batch delete
const handleBatchDelete = async () => {
  if (selectedCount.value === 0) {
    message.warning('请先选择要删除的任务')
    return
  }

  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedCount.value} 个任务吗？此操作不可恢复。`,
    okText: '确认删除',
    cancelText: '取消',
    onOk: async () => {
      const taskIds = Array.from(selectedModels.value)
      let successCount = 0

      for (const taskId of taskIds) {
        try {
          const token = localStorage.getItem('token') || undefined
          await ApiServer.request({
            url: API.TASK_DELETE,
            method: 'post',
            data: { taskId, task_id: taskId },
          }, token)
          successCount++
        } catch (error) {
          console.error(`Delete task ${taskId} failed:`, error)
        }
      }

      message.success(`成功删除 ${successCount} 个任务`)
      selectedModels.value.clear()
      isManagementMode.value = false
      await fetchCurrentTab()
    }
  })
}

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
  mode: '3dgs',
  query: ''
})

const meshTotal = ref(defaultMeshModels.length)
const model3DTotal = ref(0)

const typeTabs = computed(() => [
  { key: 'mesh', label: t('home.scan') },
  { key: '3dgs', label: t('home.gs3d') },
  // { key: '4dgs', label: t('home.gs4d') }
])

const displayModels = computed(() => {
  if (activeTypeTab.value === 'mesh') return MeshModel.value
  if (activeTypeTab.value === '3dgs') return Model3D.value
  return []
})

const displayTotal = computed(() => {
  if (activeTypeTab.value === 'mesh') return meshTotal.value
  if (activeTypeTab.value === '3dgs') return model3DTotal.value
  return 0
})

const activePagination = computed(() => {
  if (activeTypeTab.value === 'mesh') return meshPagination.value
  if (activeTypeTab.value === '3dgs') return model3DPagination.value
  return { page: 1, pageSize: 12 }
})

const activePageSize = computed(() => Number(activePagination.value.pageSize || 12))

// 错误状态
type ErrorType = 'network' | 'server' | 'unknown' | null
const fetchError = ref<ErrorType>(null)

// 加载状态
const isLoading = ref(false)

const searchQueryTrimmed = computed(() => searchQuery.value.trim())
const isSearching = ref(false)
const hasBaseData = computed(() => filteredModels.value.length > 0)

const normalizeText = (text: string) => text.toLowerCase().replace(/\s+/g, '')

const filteredModels = computed(() => {
  // 3dgs 模式：搜索在服务器端进行，直接返回服务器结果
  if (activeTypeTab.value === '3dgs') {
    return displayModels.value
  }

  // mesh 模式：使用本地过滤
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

// 判断错误类型
const getErrorType = (error: any): ErrorType => {
  if (!error) return 'unknown'

  // 网络错误
  if (error.isNetworkError) {
    return 'network'
  }

  // 服务器错误 (5xx)
  const statusCode = error.statusCode || error.response?.status
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return 'server'
  }

  return 'unknown'
}

const fetchScanModels = async () => {
  fetchError.value = null
  isLoading.value = true
  try {
    MeshModel.value = defaultMeshModels
    meshTotal.value = 1
  } catch (error: any) {
    console.error('Fetch scan models failed:', error)
    fetchError.value = getErrorType(error)
    MeshModel.value = [...defaultMeshModels]
    meshTotal.value = defaultMeshModels.length
  } finally {
    isLoading.value = false
  }
}

const fetch3DModels = async () => {
  fetchError.value = null
  isLoading.value = true
  try {
    const tasks = await ApiServer.getTaskList(model3DPagination.value)
    console.log(model3DPagination.value, tasks)
    Model3D.value = mapToModels(tasks, 'gaussian')
    model3DTotal.value = ApiServer.totalTasks || 0
  } catch (error: any) {
    fetchError.value = getErrorType(error)
    Model3D.value = []
    model3DTotal.value = 0
  } finally {
    isLoading.value = false
  }
}

const fetchCurrentTab = async () => {
  if (activeTypeTab.value === 'mesh') {
    await fetchScanModels()
    return
  }
  if (activeTypeTab.value === '3dgs') {
    await fetch3DModels()
  }
}

const handlePageChange = async (page: number) => {
  if (activeTypeTab.value === 'mesh') {
    meshPagination.value.page = page
    await fetchScanModels()
    return
  }
  if (activeTypeTab.value === '3dgs') {
    model3DPagination.value.page = page
    await fetch3DModels()
  }
}

const handleCardClick = (model: Model) => {
  if (isManagementMode.value) {
    // In management mode, toggle selection
    const taskId = model.taskId || ''
    if (selectedModels.value.has(taskId)) {
      selectedModels.value.delete(taskId)
    } else {
      selectedModels.value.add(taskId)
    }
    // Trigger reactivity
    selectedModels.value = new Set(selectedModels.value)
    return
  }
  const routeData = router.resolve(`/model/${model.taskId}`)
    
   window.open(routeData.href, '_blank')
}

const handleResumeSuccess = async () => {
  if (activeTypeTab.value === 'mesh') {
    await fetchScanModels()
    return
  }
  if (activeTypeTab.value === '3dgs') {
    await fetch3DModels()
  }
}

// 防抖搜索定时器
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_DELAY = 500 // 500ms 防抖延迟

// 监听搜索词变化，防抖请求服务器
watch(searchQueryTrimmed, async (newQuery) => {
  // 清除之前的定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  
  if (activeTypeTab.value === '3dgs'){
    
    searchDebounceTimer = setTimeout(async () => {
      model3DPagination.value.page = 1
      model3DPagination.value.query = newQuery
      await fetch3DModels()
      isSearching.value = searchQueryTrimmed.value.length > 0
    }, DEBOUNCE_DELAY)
  }
  else if(activeTypeTab.value === 'mesh'){
    isSearching.value = searchQueryTrimmed.value.length > 0
  }

})

watch(activeTypeTab, async (newTab) => {
  // 保存当前切换的tag到sessionStorage
  try {
    sessionStorage.setItem('home_active_tab', newTab)
  } catch {}

  // 如果切换到 3dgs 且有搜索词，需要重新搜索
  if (newTab === '3dgs' && searchQueryTrimmed.value) {
    model3DPagination.value.query = searchQueryTrimmed.value
    model3DPagination.value.page = 1
  }

  await fetchCurrentTab()
})

onMounted(async () => {
  await fetchScanModels()
  await fetch3DModels()
})
</script>

<style scoped>
/* Button show/hide animation */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

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

/* Loading 状态 */
.loading-state {
  margin-top: 20px;
}

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

.select-btn.active {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

.select-btn.active:hover {
  background: var(--accent-blue-hover, #1d4ed8);
}

.selected-count {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 0 8px;
}

.select-all-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.select-all-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pause-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  color: white;
}

.pause-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

.start-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.export-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
}

.export-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
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

/* Batch Export Modal */
.export-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.format-tip {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.tip-label {
  color: var(--text-secondary);
}

.tip-ok {
  color: #1677ff;
}

.tip-split {
  margin: 0 6px;
  color: var(--text-tertiary);
}

.tip-disabled {
  color: var(--text-tertiary);
}

.status-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.export-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
</style>
