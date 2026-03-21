<template>
  <a-modal
    v-model:open="visible"
    title="算力点记录"
    :footer="null"
    :width="680"
    class="points-logs-modal"
    wrapClassName="points-logs-wrap"
  >
    <div class="points-logs-container">
      <div class="ledger-frame">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <a-spin size="large" />
          <span class="loading-text">加载中...</span>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="fetchError" class="error-state">
          <div class="error-icon">
            <CloseCircleFilled />
          </div>
          <p class="error-text">{{ fetchError }}</p>
          <button class="retry-btn" @click="handleRetry">重新加载</button>
        </div>

        <!-- 内容区域 -->
        <template v-else>
          <template v-if="isMobile">
            <div class="m-ledger">
              <div class="m-balance-card">
                <div class="m-balance-top">
                  <div class="m-balance-title">算力点余额</div>
                  <div class="m-balance-value">{{ currentPoints }}</div>
                </div>
                <div class="m-balance-sub">
                  <div class="m-pill total">
                    <GiftOutlined />
                    <span>累计 +{{ totalPoints }}</span>
                  </div>
                  <div class="m-pill count">
                    <UnorderedListOutlined />
                    <span>{{ logs.length }} 条记录</span>
                  </div>
                  <div class="m-pill scope">
                    <ClockCircleOutlined />
                    <span>最近 {{ Math.min(displayCount, logs.length) }} 条</span>
                  </div>
                </div>
              </div>

              <div class="m-toolbar">
                <div class="m-toolbar-top">
                  <div class="m-toolbar-title">变动记录</div>
                  <div class="m-toolbar-meta">最近 {{ Math.min(displayCount, logs.length) }} 条</div>
                </div>
              </div>

              <div class="m-list" v-if="displayedLogs.length > 0">
                <div
                  v-for="(log, index) in displayedLogs"
                  :key="index"
                  class="m-row"
                  :class="{ positive: isPositiveAmount(log.rewards_amount), negative: isNegativeAmount(log.rewards_amount) }"
                >
                  <div class="m-row-main">
                    <div class="m-row-title">{{ log.rewards_type }}</div>
                    <div class="m-row-meta">{{ formatDate(log.created_at) }}</div>
                  </div>
                  <div class="m-row-side">
                    <div
                      class="m-row-amount"
                      :class="{ positive: isPositiveAmount(log.rewards_amount), negative: isNegativeAmount(log.rewards_amount) }"
                    >
                      {{ log.rewards_amount }}
                    </div>
                  </div>
                </div>
              </div>

              <a-empty v-else description="暂无算力点记录" class="empty-state" />
            </div>
          </template>

          <template v-else>
            <header class="ledger-hero">
              <div class="hero-top">
                <div class="hero-text">
                  <span class="hero-kicker">META·ST / LEDGER</span>
                  <h3>算力点流水</h3>
                  <p>清晰查看每一笔变动，支持快速筛选</p>
                </div>
                <div class="hero-balance">
                  <span class="balance-label">当前余额</span>
                  <span class="balance-value">{{ currentPoints }}</span>
                </div>
              </div>

              <section class="ledger-stats">
                <div class="stat-tile total">
                  <div class="tile-icon">
                    <GiftOutlined />
                  </div>
                  <div class="tile-text">
                    <span>累计获得</span>
                    <strong>+{{ totalPoints }}</strong>
                  </div>
                </div>
                <div class="stat-tile count">
                  <div class="tile-icon">
                    <UnorderedListOutlined />
                  </div>
                  <div class="tile-text">
                    <span>记录数量</span>
                    <strong>{{ logs.length }}</strong>
                  </div>
                </div>
                <div class="stat-tile scope">
                  <div class="tile-icon">
                    <ClockCircleOutlined />
                  </div>
                  <div class="tile-text">
                    <span>展示范围</span>
                    <strong>最近 {{ Math.min(displayCount, logs.length) }} 条</strong>
                  </div>
                </div>
              </section>
            </header>

            <div class="ledger-toolbar">
              <div class="toolbar-left">
                <span class="ledger-title">变动记录</span>
                <span class="ledger-badge">最近 {{ Math.min(displayCount, logs.length) }} 条</span>
              </div>
            </div>

            <div class="ledger-list" v-if="displayedLogs.length > 0">
              <div
                v-for="(log, index) in displayedLogs"
                :key="index"
                class="ledger-row"
                :class="{ positive: isPositiveAmount(log.rewards_amount), negative: isNegativeAmount(log.rewards_amount) }"
              >
                <div class="row-dot"></div>
                <div class="row-main">
                  <div class="row-title">{{ log.rewards_type }}</div>
                  <div class="row-meta">{{ formatDate(log.created_at) }}</div>
                </div>
                <div class="row-side">
                  <span
                    class="row-amount"
                    :class="{ positive: isPositiveAmount(log.rewards_amount), negative: isNegativeAmount(log.rewards_amount) }"
                  >
                    {{ log.rewards_amount }}
                  </span>
                </div>
              </div>
            </div>

            <a-empty v-else description="暂无算力点记录" class="empty-state" />

            <div v-if="logs.length > 0" class="limit-hint">
              仅显示最近 {{ Math.min(displayCount, logs.length) }} 条记录
            </div>
          </template>
        </template>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch } from 'vue'
import { usePointsStore } from '@/stores/points'
import { ClockCircleOutlined, CloseCircleFilled, GiftOutlined, UnorderedListOutlined } from '@ant-design/icons-vue'

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
const logs = computed<any[]>(() => (pointsStore.points_logs as any[]) || [])
const sortedLogs = computed(() => {
  // 后端返回顺序不确定，这里统一按时间倒序展示，符合“流水/账单”常见体验
  return [...logs.value].sort((a, b) => Number(b?.created_at || 0) - Number(a?.created_at || 0))
})

const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const syncIsMobile = () => {
  isMobile.value = !!mediaQuery?.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 640px)')
  syncIsMobile()
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', syncIsMobile)
  } else {
    // Safari < 14
    mediaQuery.addListener(syncIsMobile)
  }
})

onBeforeUnmount(() => {
  if (!mediaQuery) return
  if (typeof mediaQuery.removeEventListener === 'function') {
    mediaQuery.removeEventListener('change', syncIsMobile)
  } else {
    mediaQuery.removeListener(syncIsMobile)
  }
  mediaQuery = null
})

// 只显示最近10条记录
const displayCount = 10
const displayedLogs = computed(() => sortedLogs.value.slice(0, displayCount))

// 计算累计获得的算力点
const totalPoints = computed(() =>
  pointsStore.total_points
)

// 格式化时间戳
const formatDate = (timestamp: number | string) => {
  if (timestamp === null || timestamp === undefined || timestamp === '') return '-'
  const raw = Number(timestamp)
  if (!Number.isFinite(raw) || raw <= 0) return '-'
  // 兼容后端返回秒 / 毫秒
  const ts = raw < 1e12 ? raw * 1000 : raw
  const date = new Date(ts)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const isNegativeAmount = (amount: unknown) => String(amount ?? '').trim().startsWith('-')
const isPositiveAmount = (amount: unknown) => !isNegativeAmount(amount)

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
:deep(.points-logs-modal) {
  --ledger-ink: var(--text-primary);
  --ledger-muted: var(--text-secondary);
  --ledger-line: var(--glass-border);
  --ledger-line-hover: var(--glass-border-hover);
  --ledger-bg: var(--bg-primary);
  --ledger-card: var(--glass-surface);
  --ledger-card-hover: var(--glass-surface-hover);
  --ledger-accent: var(--accent-blue);
  --ledger-accent-2: var(--accent-purple);
  --ledger-success: var(--accent-green);
  --ledger-danger: var(--accent-pink);
  --ledger-chip-bg: rgba(0, 0, 0, 0.06);
  --ledger-dot: rgba(0, 0, 0, 0.35);
  --ledger-scroll: rgba(0, 0, 0, 0.22);
  font-family: var(--global-font-family);
}

:deep([data-theme="dark"] .points-logs-modal) {
  --ledger-chip-bg: rgba(255, 255, 255, 0.12);
  --ledger-dot: rgba(255, 255, 255, 0.28);
  --ledger-scroll: rgba(255, 255, 255, 0.24);
}

:deep(.points-logs-wrap .ant-modal) {
  padding-bottom: env(safe-area-inset-bottom);
}

:deep(.points-logs-modal .ant-modal-content) {
  background: linear-gradient(180deg, var(--ledger-card-hover), var(--ledger-bg));
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
}

:deep(.points-logs-modal .ant-modal-header) {
  background: transparent;
  border-bottom: none;
  padding: 18px 18px 0;
}

:deep(.points-logs-modal .ant-modal-title) {
  font-weight: 700;
  color: var(--ledger-ink);
  letter-spacing: 0.02em;
}

:deep(.points-logs-modal .ant-modal-body) {
  padding: 12px 18px 18px;
}

.points-logs-container {
  position: relative;
  max-height: min(70vh, 720px);
  overflow-y: auto;
  padding: 10px 2px 2px;
  scrollbar-width: thin;
  scrollbar-color: var(--ledger-scroll) transparent;
}

.points-logs-container::before {
  content: '';
  position: absolute;
  inset: -40px -40px auto -40px;
  height: 220px;
  pointer-events: none;
  background:
    radial-gradient(120px 120px at 15% 30%, rgba(0, 114, 255, 0.26), transparent 70%),
    radial-gradient(140px 140px at 75% 10%, rgba(175, 82, 222, 0.22), transparent 70%),
    radial-gradient(120px 120px at 55% 80%, rgba(255, 55, 95, 0.12), transparent 70%);
  opacity: 0.9;
  filter: blur(2px);
}

.points-logs-container::-webkit-scrollbar {
  width: 6px;
}

.points-logs-container::-webkit-scrollbar-track {
  background: transparent;
}

.points-logs-container::-webkit-scrollbar-thumb {
  background-color: var(--ledger-scroll);
  border-radius: 3px;
}

.ledger-frame {
  position: relative;
  background: var(--ledger-card);
  border: 1px solid var(--ledger-line);
  border-radius: 18px;
  padding: 16px;
  backdrop-filter: blur(14px);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  gap: 14px;
}

.loading-text {
  font-size: 14px;
  color: var(--ledger-muted);
  font-weight: 500;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 20px;
  text-align: center;
}

.error-icon {
  color: var(--ledger-danger);
  margin-bottom: 12px;
}

.error-icon :deep(.anticon) {
  font-size: 48px;
}

.error-text {
  font-size: 14px;
  color: var(--ledger-muted);
  margin: 0 0 18px;
  line-height: 1.5;
}

.retry-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, var(--ledger-accent), var(--ledger-accent-2));
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  filter: brightness(0.96);
  transform: translateY(-1px);
}

.ledger-hero {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
  background:
    radial-gradient(180px 140px at 16% 18%, rgba(0, 114, 255, 0.26), transparent 70%),
    radial-gradient(220px 160px at 84% 10%, rgba(175, 82, 222, 0.22), transparent 72%),
    linear-gradient(135deg, var(--ledger-card-hover), var(--ledger-card));
  border: 1px solid var(--ledger-line);
  animation: fadeUp 0.45s ease both;
}

.hero-top {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-kicker {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ledger-muted);
  opacity: 0.95;
}

.hero-text h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--ledger-ink);
}

.hero-text p {
  margin: 0;
  font-size: 12px;
  color: var(--ledger-muted);
}

.hero-balance {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: var(--ledger-card-hover);
  border-radius: 14px;
  border: 1px solid var(--ledger-line);
  min-width: 180px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.balance-label {
  font-size: 12px;
  color: var(--ledger-muted);
  font-weight: 500;
}

.balance-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--ledger-ink);
}

.ledger-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 6px;
}

.stat-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--ledger-card);
  border: 1px solid var(--ledger-line);
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.stat-tile:hover {
  transform: translateY(-1px);
  border-color: var(--ledger-line-hover);
  background: var(--ledger-card-hover);
}

.tile-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--ledger-accent), var(--ledger-accent-2));
  box-shadow: 0 10px 20px rgba(0, 114, 255, 0.22);
}

.tile-icon :deep(.anticon) {
  font-size: 18px;
  line-height: 1;
}

.stat-tile.count .tile-icon {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow: 0 10px 20px rgba(245, 158, 11, 0.2);
}

.stat-tile.scope .tile-icon {
  background: linear-gradient(135deg, #10b981, #34d399);
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.18);
}

.tile-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tile-text span {
  font-size: 12px;
  color: var(--ledger-muted);
  font-weight: 500;
}

.tile-text strong {
  font-size: 15px;
  color: var(--ledger-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ledger-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 14px 2px 10px;
  padding: 10px 10px;
  border-radius: 14px;
  background: var(--ledger-card);
  border: 1px solid var(--ledger-line);
  backdrop-filter: blur(14px);
  position: sticky;
  top: 0;
  z-index: 2;
  animation: fadeUp 0.5s ease both;
  animation-delay: 0.06s;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ledger-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ledger-ink);
  white-space: nowrap;
}

.ledger-badge {
  font-size: 11px;
  color: var(--ledger-muted);
  background: var(--ledger-chip-bg);
  padding: 4px 8px;
  border-radius: 999px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ledger-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ledger-row {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  background: var(--ledger-card);
  border: 1px solid var(--ledger-line);
  border-radius: 14px;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  animation: fadeUp 0.5s ease both;
}

.ledger-row:hover {
  transform: translateY(-1px);
  border-color: var(--ledger-line-hover);
  background: var(--ledger-card-hover);
}

.row-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ledger-dot);
}

.ledger-row.positive .row-dot {
  background: var(--ledger-success);
}

.ledger-row.negative .row-dot {
  background: var(--ledger-danger);
}

.m-ledger {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.m-balance-card {
  background: var(--ledger-card);
  border: 1px solid var(--ledger-line);
  border-radius: 16px;
  padding: 12px;
  backdrop-filter: blur(14px);
}

.m-balance-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.m-balance-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ledger-muted);
  letter-spacing: 0.02em;
}

.m-balance-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--ledger-ink);
}

.m-balance-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.m-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--ledger-chip-bg);
  border: 1px solid var(--ledger-line);
  font-size: 12px;
  white-space: nowrap;
}

.m-pill span {
  color: var(--ledger-muted);
}

.m-pill :deep(.anticon) {
  font-size: 14px;
  line-height: 1;
}

.m-toolbar {
  background: var(--ledger-card);
  border: 1px solid var(--ledger-line);
  border-radius: 16px;
  padding: 12px;
  backdrop-filter: blur(14px);
}

.m-toolbar-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}

.m-toolbar-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ledger-ink);
}

.m-toolbar-meta {
  font-size: 12px;
  color: var(--ledger-muted);
}

.m-list {
  background: var(--ledger-card);
  border: 1px solid var(--ledger-line);
  border-radius: 16px;
  overflow: hidden;
  min-height: 0;
  flex: 1;
  height: 0; /* make it take the remaining space within a flex column */
  min-height: min(240px, 40vh); /* explicit height floor, but never forces overflow on small screens */
}

.m-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--ledger-line);
}

.m-row:last-child {
  border-bottom: none;
}

.m-row-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.m-row-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ledger-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.m-row-meta {
  font-size: 11px;
  color: var(--ledger-muted);
}

.m-row-side {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.m-row-amount {
  font-size: 15px;
  font-weight: 800;
  color: var(--ledger-ink);
  text-align: right;
}

.m-row-amount.positive {
  color: var(--ledger-success);
}

.m-row-amount.negative {
  color: var(--ledger-danger);
}


.row-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.row-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ledger-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-meta {
  font-size: 11px;
  color: var(--ledger-muted);
}

.row-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.row-amount {
  font-size: 14px;
  font-weight: 700;
  color: var(--ledger-ink);
}

.row-amount.positive {
  color: var(--ledger-success);
}

.row-amount.negative {
  color: var(--ledger-danger);
}


/* 空状态 */
.empty-state {
  padding: 32px 0 24px;
}

:deep(.ant-empty-description) {
  color: var(--ledger-muted);
  font-size: 14px;
}

:deep(.ant-empty-img) {
  margin-bottom: 12px;
}

/* 限制提示 */
.limit-hint {
  text-align: center;
  font-size: 12px;
  color: var(--ledger-muted);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--ledger-line);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ledger-hero,
  .ledger-toolbar,
  .ledger-row {
    animation: none !important;
  }

  .ledger-row:hover,
  .stat-tile:hover,
  .retry-btn:hover {
    transform: none;
  }
}

@media (max-width: 640px) {
  :deep(.points-logs-wrap .ant-modal) {
    width: 100vw !important;
    max-width: 100vw !important;
    margin: 0;
    top: 0;
    height: 100vh;
    height: 100dvh;
    padding-bottom: 0;
  }

  :deep(.points-logs-wrap .ant-modal-content) {
    height: 100%;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    box-shadow: none;
  }

  :deep(.points-logs-wrap .ant-modal-header) {
    padding: calc(14px + env(safe-area-inset-top)) 14px 0;
  }

  :deep(.points-logs-wrap .ant-modal-close-x) {
    width: 46px;
    height: 46px;
    line-height: 46px;
  }

  :deep(.points-logs-wrap .ant-modal-body) {
    flex: 1;
    overflow: hidden;
    padding: 10px 12px calc(12px + env(safe-area-inset-bottom));
  }

  .points-logs-container {
    height: 100%;
    max-height: none;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .points-logs-container::before {
    inset: -60px -40px auto -40px;
    height: 200px;
  }

  .ledger-frame {
    flex: 1;
    min-height: 0;
    padding: 0;
    border-radius: 0;
    border: none;
    background: transparent;
    backdrop-filter: none;
    display: flex;
    flex-direction: column;
  }

  .m-ledger {
    flex: 1;
    min-height: 0;
    padding: 8px 0 0;
    overflow: hidden;
  }

  .m-list {
    max-height: 50vh;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .limit-hint {
    border-top: none;
    padding-top: 0;
    margin-top: 0;
    opacity: 0.85;
  }
}
</style>
