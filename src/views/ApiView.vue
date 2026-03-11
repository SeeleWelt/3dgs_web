<template>
  <div class="api-page">
    <div class="api-layout">
      <!-- 左侧浮动搜索卡片 -->
      <aside class="search-sidebar">
        <div class="search-card">
          <div class="search-header">
            <SearchOutlined />
            <span>搜索接口</span>
          </div>
          <a-input
            v-model:value="search"
            placeholder="输入接口路径或描述..."
            class="search-input"
          />
        </div>

        <!-- 标签分类 -->
        <div class="tags-card">
          <div class="tags-header">
            <FilterOutlined />
            <span>接口分类</span>
          </div>
          <div class="tag-list">
            <div
              v-for="tag in tags"
              :key="tag.name"
              class="tag-item"
              :class="{ active: activeTag === tag.name }"
              @click="toggleTag(tag.name)"
            >
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-count">{{ getTagCount(tag.name) }}</span>
            </div>
          </div>
        </div>

        <!-- 接口列表 -->
        <div class="apis-card">
          <div class="apis-header">
            <ApiOutlined />
            <span>接口列表</span>
            <span class="apis-count">{{ filteredApis.length }}</span>
          </div>
          <div class="apis-list">
            <div
              v-for="item in displayedApis"
              :key="item.path + item.method"
              class="api-item"
              :class="{ active: activeApi?.path === item.path && activeApi?.method === item.method }"
              @click="selectApi(item)"
            >
              <span class="method-badge" :class="item.method.toLowerCase()">{{ item.method }}</span>
              <span class="api-name" v-html="highlightText(item.path, String(searchKeyword))"></span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧主体内容 -->
      <main class="api-main">
        <!-- 顶部标题 -->
        <div class="main-header">
          <div class="header-title">
            <ApiOutlined class="title-icon" />
            <div>
              <h1>API Reference</h1>
              <p>MetaST 3D 模型训练与任务管理接口</p>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredApis.length === 0" class="empty-state">
          <div class="empty-card">
            <FileTextOutlined class="empty-icon" />
            <h3>没有找到接口</h3>
            <p>尝试调整搜索条件或分类筛选</p>
          </div>
        </div>

        <!-- 所有API列表（未选中时显示全部） -->
        <template v-else-if="!activeApi">
          <div
            v-for="item in filteredApis"
            :key="item.path + item.method"
            class="detail-card"
          >
            <div class="detail-header">
              <div class="path-row">
                <span class="method-badge large" :class="item.method.toLowerCase()">{{ item.method }}</span>
                <code class="path-text">{{ item.path }}</code>
              </div>
              <h2 class="detail-summary">{{ item.summary }}</h2>
            </div>

            <div v-if="item.description" class="detail-section">
              <h3 class="section-label">描述</h3>
              <p class="section-desc">{{ item.description }}</p>
            </div>

            <div v-if="item.parameters?.length" class="detail-section">
              <h3 class="section-label">
                <TableOutlined />
                请求参数
              </h3>
              <div class="table-wrap">
                <table class="param-table">
                  <thead>
                    <tr>
                      <th>参数名</th>
                      <th>类型</th>
                      <th>必填</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in item.parameters" :key="p.name">
                      <td><code class="param-name">{{ p.name }}</code></td>
                      <td><a-tag color="blue">{{ p.type }}</a-tag></td>
                      <td>
                        <a-tag v-if="p.required" color="red">必填</a-tag>
                        <span v-else class="text-muted">可选</span>
                      </td>
                      <td class="text-muted">{{ p.description || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-if="item.responses?.length" class="detail-section">
              <h3 class="section-label">
                <InteractionOutlined />
                响应状态码
              </h3>
              <div class="response-list">
                <div
                  v-for="r in item.responses"
                  :key="r.code"
                  class="response-row"
                >
                  <span class="status-code" :class="getStatusClass(r.code)">{{ r.code }}</span>
                  <span class="text-muted">{{ r.description || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 选中单个API详情 -->
        <div v-else class="detail-card">
          <div class="detail-header">
            <div class="path-row">
              <span class="method-badge large" :class="activeApi.method.toLowerCase()">{{ activeApi.method }}</span>
              <code class="path-text">{{ activeApi.path }}</code>
            </div>
            <h2 class="detail-summary">{{ activeApi.summary }}</h2>
          </div>

          <div v-if="activeApi.description" class="detail-section">
            <h3 class="section-label">描述</h3>
            <p class="section-desc">{{ activeApi.description }}</p>
          </div>

          <div v-if="activeApi.parameters?.length" class="detail-section">
            <h3 class="section-label">
              <TableOutlined />
              请求参数
            </h3>
            <div class="table-wrap">
              <table class="param-table">
                <thead>
                  <tr>
                    <th>参数名</th>
                    <th>类型</th>
                    <th>必填</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in activeApi.parameters" :key="p.name">
                    <td><code class="param-name">{{ p.name }}</code></td>
                    <td><a-tag color="blue">{{ p.type }}</a-tag></td>
                    <td>
                      <a-tag v-if="p.required" color="red">必填</a-tag>
                      <span v-else class="text-muted">可选</span>
                    </td>
                    <td class="text-muted">{{ p.description || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="activeApi.responses?.length" class="detail-section">
            <h3 class="section-label">
              <InteractionOutlined />
              响应状态码
            </h3>
            <div class="response-list">
              <div
                v-for="r in activeApi.responses"
                :key="r.code"
                class="response-row"
              >
                <span class="status-code" :class="getStatusClass(r.code)">{{ r.code }}</span>
                <span class="text-muted">{{ r.description || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-label">
              <CodeOutlined />
              请求示例
            </h3>
            <div class="code-box">
              <div class="code-bar">
                <span>curl</span>
                <CopyOutlined class="copy-icon" @click="copyCode(curlExample)" />
              </div>
              <pre><code>{{ curlExample }}</code></pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  ApiOutlined,
  SearchOutlined,
  FilterOutlined,
  TableOutlined,
  InteractionOutlined,
  CodeOutlined,
  CopyOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'

interface ApiTag { name: string; description?: string }
interface ApiParameter { name: string; type: string; description: string; required: boolean }
interface ApiResponse { code: string; description: string }
interface ApiItem {
  path: string
  method: string
  summary: string
  description: string
  tags: string[]
  parameters: ApiParameter[]
  responses: ApiResponse[]
}

const search = ref('')
const searchKeyword = computed(() => search.value)
const tags = ref<ApiTag[]>([])
const apis = ref<ApiItem[]>([])
const activeTag = ref('')
const activeApi = ref<ApiItem | null>(null)

function parseOpenApi(json: any) {
  tags.value = (json.tags || []) as ApiTag[]
  const apiList: ApiItem[] = []

  Object.entries(json.paths || {}).forEach(([path, methods]: [string, any]) => {
    Object.entries(methods).forEach(([method, detail]: [string, any]) => {
      apiList.push({
        path,
        method: method.toUpperCase(),
        summary: detail.summary || '',
        description: detail.description || '',
        tags: detail.tags || [],
        parameters: (detail.parameters || []).map((p: any) => ({
          name: p.name,
          type: p.schema?.type || p.type || 'string',
          description: p.description || '',
          required: p.required || false
        })),
        responses: Object.entries(detail.responses || {}).map(([code, resp]: [string, any]) => ({
          code,
          description: resp.description || ''
        }))
      })
    })
  })

  apis.value = apiList
  if (tags.value.length) activeTag.value = tags.value[0].name
}

const filteredApis = computed(() => {
  return apis.value.filter(item => {
    const tagMatch = activeTag.value ? item.tags.includes(activeTag.value) : true
    const searchMatch = search.value.trim() ? (
      item.path.toLowerCase().includes(search.value.trim()) ||
      item.summary.toLowerCase().includes(search.value.trim()) ||
      item.description.toLowerCase().includes(search.value.trim())
    ) : true
    return tagMatch && searchMatch
  })
})

// 接口列表始终显示所有过滤后的接口
const displayedApis = computed(() => {
  return filteredApis.value
})

function getTagCount(name: string) {
  return apis.value.filter(i => i.tags.includes(name)).length
}

function toggleTag(name: string) {
  activeTag.value = activeTag.value === name ? '' : name
}

function selectApi(item: ApiItem) {
  // 如果点击的是当前选中的接口，则取消选中
  if (activeApi.value?.path === item.path && activeApi.value?.method === item.method) {
    activeApi.value = null
  } else {
    activeApi.value = item
  }
}

// 高亮搜索匹配的文本
function highlightText(text: string, keyword: string): string {
  if (!keyword.trim()) return text
  const regex = new RegExp(`(${keyword.trim()})`, 'gi')
  return text.replace(regex, '<mark style="background: rgba(255, 193, 7, 0.4); padding: 0 2px; border-radius: 2px;">$1</mark>')
}

function getStatusClass(code: string) {
  if (code.startsWith('2')) return 'success'
  if (code.startsWith('4')) return 'warning'
  if (code.startsWith('5')) return 'error'
  return 'info'
}

const curlExample = computed(() => {
  if (!activeApi.value) return ''
  const item = activeApi.value
  let curl = `curl -X ${item.method} "https://api.metast.com${item.path}"`
  const headers = ['-H "Content-Type: application/json"']

  if (item.parameters?.length) {
    const required = item.parameters.filter(p => p.required)
    if (required.length) {
      const obj: Record<string, string> = {}
      required.forEach(p => { obj[p.name] = `<${p.name}>` })
      headers.push(`-d '${JSON.stringify(obj, null, 2)}'`)
    }
  }

  if (headers.length > 1) curl += ` \\\n  ${headers.join(' \\\n  ')}`
  return curl
})

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  message.success('已复制')
}

fetch('/openapi.mock.json').then(r => r.json()).then(parseOpenApi).catch(console.error)
</script>

<style scoped>
.api-page {
  min-height: calc(100vh - 64px);
  background: var(--bg-primary);
  padding: 24px;
}

.api-layout {
  display: flex;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 左侧浮动搜索区域 */
.search-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 88px;
  height: fit-content;
}

/* 搜索卡片 */
.search-card, .tags-card, .apis-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  overflow: hidden;
}

.search-header, .tags-header, .apis-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: var(--glass-surface-hover);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--glass-border);
}

.search-input {
  padding: 12px 16px;
  border: none !important;
  background: transparent !important;
}

.search-input :deep(.ant-input) {
  background: transparent !important;
}

/* 标签卡片 */
.tag-list {
  padding: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.tag-item:hover {
  background: var(--glass-surface-hover);
}

.tag-item.active {
  background: var(--accent-blue);
  color: white;
}

.tag-count {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0,0,0,0.08);
  border-radius: 10px;
}

.tag-item.active .tag-count {
  background: rgba(255,255,255,0.2);
}

/* 接口列表卡片 */
.apis-header span:first-child {
  font-size: 16px;
}

.apis-count {
  margin-left: auto;
  font-size: 12px;
  padding: 2px 8px;
  background: var(--accent-blue);
  color: white;
  border-radius: 10px;
}

.apis-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.api-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.api-item:hover {
  background: var(--glass-surface-hover);
}

.api-item.active {
  background: linear-gradient(90deg, rgba(0, 114, 255, 0.15) 0%, rgba(0, 114, 255, 0.05) 100%);
  margin-left: -3px;
  box-shadow: 0 2px 8px rgba(0, 114, 255, 0.15);
}

.method-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.method-badge.get { background: #4096ff; color: white; }
.method-badge.post { background: #34c759; color: white; }
.method-badge.put { background: #ff9500; color: white; }
.method-badge.delete { background: #ff375f; color: white; }

.method-badge.large {
  font-size: 12px;
  padding: 6px 14px;
}

.api-name {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.api-item.active .api-name {
  color: var(--accent-blue);
  font-weight: 500;
}

/* 右侧主体 */
.api-main {
  flex: 1;
  min-width: 0;
}

/* 主标题 */
.main-header {
  margin-bottom: 24px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  font-size: 36px;
  color: var(--accent-blue);
}

.header-title h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-title p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

/* 空状态 */
.empty-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 80px 40px;
  text-align: center;
}

.empty-icon {
  font-size: 56px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

.empty-card h3 {
  margin: 0 0 8px;
  color: var(--text-primary);
}

.empty-card p {
  margin: 0;
  color: var(--text-secondary);
}

/* 详情卡片 */
.detail-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 28px;
}

/* 详情头部 */
.detail-header {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: 24px;
}

.path-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.path-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', monospace;
}

.detail-summary {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* 区块 */
.detail-section {
  margin-top: 24px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--glass-border);
}

.section-desc {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 表格 */
.table-wrap {
  overflow-x: auto;
}

.param-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.param-table th {
  text-align: left;
  padding: 12px;
  background: var(--glass-surface-hover);
  color: var(--text-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--glass-border);
}

.param-table td {
  padding: 12px;
  border-bottom: 1px solid var(--glass-border);
  color: var(--text-primary);
}

.param-name {
  font-family: 'Monaco', 'Menlo', monospace;
  padding: 2px 8px;
  background: rgba(0, 114, 255, 0.1);
  color: var(--accent-blue);
  border-radius: 4px;
  font-size: 13px;
}

.text-muted {
  color: var(--text-secondary);
  font-size: 13px;
}

/* 响应 */
.response-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.response-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--glass-surface-hover);
  border-radius: 8px;
}

.status-code {
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
}

.status-code.success { background: rgba(52, 199, 89, 0.15); color: #34c759; }
.status-code.warning { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
.status-code.error { background: rgba(255, 59, 48, 0.15); color: #ff375f; }
.status-code.info { background: rgba(0, 122, 255, 0.15); color: #007aff; }

/* 代码块 */
.code-box {
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.code-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
}

.code-bar span {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
}

.copy-icon {
  color: #888;
  cursor: pointer;
}

.copy-icon:hover {
  color: white;
}

.code-box pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
}

.code-box code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #d4d4d4;
}

/* 响应式 */
@media (max-width: 992px) {
  .api-layout {
    flex-direction: column;
  }

  .search-sidebar {
    width: 100%;
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .search-card, .tags-card, .apis-card {
    flex: 1;
    min-width: 200px;
  }

  .apis-list {
    max-height: 200px;
  }
}

@media (max-width: 768px) {
  .api-page {
    padding: 16px;
  }

  .header-title h1 {
    font-size: 22px;
  }

  .detail-card {
    padding: 16px;
  }

  .path-text {
    font-size: 15px;
  }
}
</style>
