<template>
  <a-modal
    v-model:open="visible"
    title="算力点记录"
    :footer="null"
    :width="520"
    class="points-logs-modal"
  >
    <div class="points-logs-container">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <a-spin size="large" />
        <span class="loading-text">加载中...</span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="fetchError" class="error-state">
        <div class="error-icon">
          <svg t="1773206444988" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2435" width="48" height="48">
            <path d="M512 0a512 512 0 0 0-512 512 512 512 0 0 0 512 512 512 512 0 0 0 512-512 512 512 0 0 0-512-512z" fill="#FD6B6D" p-id="2436"></path>
            <path d="M513.755429 565.540571L359.277714 720.018286a39.058286 39.058286 0 0 1-55.296-0.073143 39.277714 39.277714 0 0 1 0.073143-55.442286l154.331429-154.331428-155.062857-155.136a36.571429 36.571429 0 0 1 51.712-51.785143l365.714285 365.714285a36.571429 36.571429 0 1 1-51.785143 51.785143L513.755429 565.540571z m157.549714-262.582857a35.254857 35.254857 0 1 1 49.737143 49.737143l-106.057143 108.982857a35.254857 35.254857 0 1 1-49.883429-49.810285l106.203429-108.982858z" fill="#FFFFFF" p-id="2437"></path>
          </svg>
        </div>
        <p class="error-text">{{ fetchError }}</p>
        <button class="retry-btn" @click="handleRetry">重新加载</button>
      </div>

      <!-- 内容区域 -->
      <template v-else>
        <!-- 顶部统计卡片 -->
        <div class="points-summary">
          <div class="summary-card current">
            <div class="summary-icon">
              <!-- 优化的算力图标 -->
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 4H6C4.89 4 4 4.89 4 6V18C4 19.11 4.89 20 6 20H18C19.11 20 20 19.11 20 18V6C20 4.89 19.11 4 18 4M15 8H9V10H15V8M15 12H9V14H15V12M15 16H9V18H15V16Z" />
              </svg>
            </div>
            <div class="summary-content">
              <span class="summary-label">当前算力点</span>
              <span class="summary-value">{{ currentPoints }}</span>
            </div>
          </div>
          <div class="summary-card total">
            <div class="summary-icon">
              <!-- 优化的累计图标 -->
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3M19 19H5V5H19V19M7 7H17V9H7V7M7 11H17V13H7V11M7 15H14V17H7V15Z" />
              </svg>
            </div>
            <div class="summary-content">
              <span class="summary-label">累计获得</span>
              <span class="summary-value positive">+{{ totalPoints }}</span>
            </div>
          </div>
        </div>

        <!-- 日志标题 -->
        <div class="logs-header">
          <span class="logs-title">变动记录</span>
          <span class="logs-count">{{ logs.length }} 条</span>
        </div>

        <!-- 日志列表 -->
        <div class="logs-list" v-if="displayedLogs.length > 0">
          <div
            v-for="(log, index) in displayedLogs"
            :key="index"
            class="log-item"
            :class="{ positive: String(log.rewards_amount).startsWith('+'), negative: String(log.rewards_amount).startsWith('-') }"
          >
            <div class="log-icon" :class="{ positive: String(log.rewards_amount).startsWith('+'), negative: String(log.rewards_amount).startsWith('-') }">
              <!-- 优化的加减图标 -->
              <svg v-if="String(log.rewards_amount).startsWith('+')" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div class="log-info">
              <span class="log-type">{{ log.rewards_type }}</span>
              <span class="log-date">{{ formatDate(log.created_at) }}</span>
            </div>
            <span
              class="log-amount"
              :class="{ positive: String(log.rewards_amount).startsWith('+'), negative: String(log.rewards_amount).startsWith('-') }"
            >
              {{ log.rewards_amount }}
            </span>
          </div>
        </div>

        <!-- 空状态 -->
        <a-empty v-else description="暂无算力点记录" class="empty-state" />

        <!-- 提示文字 -->
        <div v-if="logs.length > displayCount" class="limit-hint">
          仅显示最近 {{ displayCount }} 条记录
        </div>
      </template>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePointsStore } from '@/stores/points'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const pointsStore = usePointsStore()

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

// 加载状态
const isLoading = ref(false)
// 错误状态
const fetchError = ref<string | null>(null)

const currentPoints = computed(() => pointsStore.current_points)
const logs : any = computed(() => pointsStore.points_logs || [])

// 只显示最近10条记录
const displayCount = 10
const displayedLogs = computed(() => logs.value.slice(0, displayCount))

// 计算累计获得的算力点
const totalPoints = computed(() =>
  pointsStore.total_points
)

// 格式化时间戳
const formatDate = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 加载数据
const fetchData = async () => {
  isLoading.value = true
  fetchError.value = null
  try {
    await Promise.all(
      [ 
        pointsStore.getPointsAllLogs(),
        pointsStore.getPoints()
      ]
    )
  } catch (error) {
    const err = error as Error
    fetchError.value = err.message || '加载数据失败，请稍后重试'
    console.log(fetchError.value)
  } finally {
    isLoading.value = false
  }
}

// 重试
const handleRetry = () => {
  fetchData()
}

// 打开弹窗时加载数据
watch(() => props.open, (newVal) => {
  if (newVal) {
    fetchData()
  }
})
</script>

<style scoped>
.points-logs-container {
  max-height: 50vh;
  overflow-y: auto;
  padding: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.1) transparent;
}

.points-logs-container::-webkit-scrollbar {
  width: 6px;
}

.points-logs-container::-webkit-scrollbar-track {
  background: transparent;
}

.points-logs-container::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.1);
  border-radius: 3px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 20px;
  animation: fadeIn 0.3s ease;
}

.loading-text {
  font-size: 15px;
  color: #666;
  font-weight: 500;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

.error-icon {
  color: #ff6b6b;
  margin-bottom: 16px;
  animation: shake 0.5s ease;
}

.error-text {
  font-size: 15px;
  color: #666;
  margin: 0 0 24px;
  line-height: 1.5;
}

.retry-btn {
  padding: 10px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.retry-btn:active {
  transform: translateY(0) scale(0.98);
}

/* 顶部统计卡片 */
.points-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  animation: slideUp 0.4s ease backwards;
}

.summary-card:nth-child(1) {
  animation-delay: 0.1s;
}

.summary-card:nth-child(2) {
  animation-delay: 0.2s;
}

.summary-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: bounceIn 0.5s ease backwards;
}

.summary-card:nth-child(1) .summary-icon {
  animation-delay: 0.2s;
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
}

.summary-card:nth-child(2) .summary-icon {
  animation-delay: 0.3s;
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
}

.summary-icon svg {
  color: white;
  width: 20px;
  height: 20px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
}

.summary-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.summary-value.positive {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 日志标题 */
.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.logs-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.logs-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--glass-surface-hover);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

/* 日志列表 */
.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  transition: all 0.3s ease;
  animation: slideUp 0.4s ease backwards;
}

.log-item:hover {
  transform: translateX(4px);
  border-color: var(--accent-blue);
}

.log-item:nth-child(1) { animation-delay: 0.1s; }
.log-item:nth-child(2) { animation-delay: 0.15s; }
.log-item:nth-child(3) { animation-delay: 0.2s; }
.log-item:nth-child(4) { animation-delay: 0.25s; }
.log-item:nth-child(5) { animation-delay: 0.3s; }
.log-item:nth-child(6) { animation-delay: 0.35s; }
.log-item:nth-child(7) { animation-delay: 0.4s; }
.log-item:nth-child(8) { animation-delay: 0.45s; }
.log-item:nth-child(9) { animation-delay: 0.5s; }
.log-item:nth-child(10) { animation-delay: 0.55s; }

.log-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: scaleIn 0.3s ease;
}

.log-icon.positive {
  background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
  color: #16a085;
}

.log-icon.negative {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: #e74c3c;
}

.log-icon svg {
  width: 14px;
  height: 14px;
}

.log-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.log-type {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-date {
  font-size: 11px;
  color: var(--text-tertiary);
}

.log-amount {
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}

.log-amount.positive {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.log-amount.negative {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 空状态 */
.empty-state {
  padding: 40px 0;
  animation: fadeIn 0.3s ease;
}

:deep(.empty-description) {
  color: var(--text-tertiary);
  font-size: 15px;
}

:deep(.ant-empty-img) {
  margin-bottom: 16px;
}

/* 限制提示 */
.limit-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--glass-border);
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
</style>