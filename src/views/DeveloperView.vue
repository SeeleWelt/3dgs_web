<template>
  <div class="developer-view">
    <div class="top-nav">
      <div class="pill-tabs">
        <button
          class="pill-tab"
          :class="{ active: currentTab === 'api' }"
          @click="currentTab = 'api'"
        >
          API
        </button>
        <button
          class="pill-tab"
          :class="{ active: currentTab === 'webhook' }"
          @click="currentTab = 'webhook'"
        >
          Webhook
        </button>
      </div>
    </div>

    <!-- API Tab -->
    <div v-if="currentTab === 'api'" class="tab-content">
      <div class="section-header">
        <h2>API Keys</h2>
        <a-button
          type="primary"
          :loading="isCreatingApiKey"
          :disabled="isCreatingApiKey"
          @click="showCreateApiKeyModal = true"
        >
          Create API Key
        </a-button>
      </div>
      
      <p style="color: #1890ff; font-weight: bold;" class="section-desc">第一次创建 API 密钥后，将自动赠送开发算力点给您进行测试</p>
      <p class="section-desc">请妥善保管您的 API 密钥，生成后仅会显示一次。请勿与他人分享或在客户端代码中暴露您的 API 密钥。</p>


      <div class="custom-card table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Usage</th>
              <th>Created</th>
              <th width="50"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in apiKeys" :key="key.id">
              <td>{{ key.name }}</td>
              <td>{{ key.key }}</td>
              <td>{{ key.usage }} 算力点</td>
              <td>{{ key.created }}</td>
              <td>
                <a-dropdown placement="bottomRight">
                  <button class="actions-btn">···</button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="openRenameModal(key)">
                        重命名
                      </a-menu-item>
                      <a-menu-item
                        :disabled="isDeletingApiKey"
                        @click="deleteApiKey(key.id)"
                        style="color: #ff4d4f"
                      >
                        删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </td>
            </tr>
            <tr v-if="apiKeys.length === 0">
              <td colspan="5" class="empty-text">No API keys found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section-header mt-8">
        <h2>Usage</h2>
      </div>
      <p class="section-desc">API使用情况</p>

      <div class="usage-cards">
        <div class="custom-card usage-card">
          <div class="card-label">总 API 使用量</div>
          <div class="card-value">{{ usage.total }}</div>
          <div class="card-hint">
            <svg viewBox="0 0 24 24" class="hint-icon" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <a-tooltip title="每次调用消耗1开发算力点">
              <span>每次 API 调用的费用是多少？</span>
            </a-tooltip>
          </div>
        </div>
        <div class="custom-card usage-card">
          <div class="card-flex">
            <div>
              <div class="card-label">剩余开发算力点</div>
              <div class="card-value">{{ usage.left }}</div>
              <div class="card-bottom-text">开发算力点有效期：永久</div>
            </div>
            <!-- <button class="btn-cyan btn-topup">
              <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon" width="16" height="16">
                <path d="M4 6V4a2 2 0 012-2h12a2 2 0 012 2v2M4 6v14a2 2 0 002 2h12a2 2 0 002-2V6M4 6h16M11 12h2M11 16h2"/>
              </svg>
              充值
            </button> -->
          </div>
        </div>
      </div>

      <!-- <div class="section-header mt-8">
        <h3>每日使用情况</h3>
        <span class="total-text">总计: {{ usage.total }} 算力点</span>
      </div>
      <p class="section-desc">过去 30 天</p>

      <div class="chart-container">
        <div class="y-axis">
          <span>3</span>
          <span>2.5</span>
          <span>2</span>
          <span>1.5</span>
          <span>1</span>
          <span>0.5</span>
          <span>0</span>
        </div>
        <div class="chart-area">
          <div class="grid-lines">
            <div class="grid-line" v-for="i in 7" :key="i"></div>
          </div>
          <svg class="chart-svg" viewBox="0 0 1000 200" preserveAspectRatio="none">
            
            <path d="M 0 198 L 400 198 L 400 2 L 405 2 L 405 198 L 1000 198" fill="none" stroke="currentColor" stroke-width="2" class="chart-line"/>
            <circle cx="400" cy="2" r="3" fill="currentColor" class="chart-dot"/>
          </svg>
        </div>
        <div class="x-axis">
          <span>2月 13</span>
          <span>2月 17</span>
          <span>2月 21</span>
          <span>2月 25</span>
          <span>3月 1</span>
          <span>3月 5</span>
          <span>3月 9</span>
        </div>
      </div> -->

      <div class="section-header mt-8">
        <h3>算力点变更情况</h3>
      </div>
      <div class="custom-card table-container no-padding">
        <a-table
          :data-source="history"
          :pagination="{ pageSize: pageSize, showSizeChanger: false }"
          row-key="id"
          :columns="historyColumns"
          size="middle"
        />
      </div>
    </div>

    <!-- Webhook Tab -->
    <div v-else class="tab-content">
      <div class="section-header">
        <h2>Webhooks</h2>
        <a-button type="primary" @click="openWebhookModal()">
          {{ hasWebhook ? 'Edit Webhook' : 'Add Webhook' }}
        </a-button>
      </div>
      <p class="section-desc">使用webHooks监听模型状态改变事件</p>

      <div class="custom-card table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Callback URL</th>
              <th>Created</th>
              <th width="50"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="wh in webhooks" :key="wh.url">
              <td>{{ wh.url }}</td>
              <td>
                <a-dropdown placement="bottomRight">
                  <button class="actions-btn">···</button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="openWebhookModal(wh)">
                        编辑
                      </a-menu-item>
                      <a-menu-item @click="deleteWebhook" style="color: #ff4d4f">
                        删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </td>
            </tr>
            <tr v-if="webhooks.length === 0">
              <td colspan="4" class="empty-text">No Webhooks found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <a-modal
      v-model:open="showCreateApiKeyModal"
      title="Create API Key"
      @ok="createApiKey"
      @cancel="showCreateApiKeyModal = false"
      okText="Create"
      cancelText="Cancel"
      :okButtonProps="{ disabled: !newKeyName, loading: isCreatingApiKey }"
    >
      <div class="form-group">
        <label>Name</label>
        <a-input v-model:value="newKeyName" placeholder="Enter API key name..." />
      </div>
    </a-modal>

    <!-- 不显示关闭按钮 -->
    <a-modal
      v-model:open="showApiKeyResultModal"
      title="Create API Key"
      @ok="closeApiKeyResult"
      @cancel="closeApiKeyResult"
      okText="完成"
      :closable="false"
      :maskClosable="false"
      :cancelButtonProps="{ style: { display: 'none' } }"
    >
      <p class="result-desc">
        API key正确生成了！请复制并妥善保管您的 API key，
        <strong>关闭此对话框后将无法再次查看该密钥</strong>。
      </p>
      <div class="result-row">
        <a-input :value="createdApiKey" readonly />
        <a-button class="copy-btn" @click="copyApiKey">复制</a-button>
      </div>
    </a-modal>

    <a-modal
      v-model:open="showCreateWebhookModal"
      :title="isEditingWebhook ? 'Edit Webhook' : 'Create Webhook'"
      @ok="createWebhook"
      @cancel="closeWebhookModal"
      :okText="isEditingWebhook ? 'Save' : 'Add'"
      cancelText="Cancel"
      :okButtonProps="{ disabled: !isWebhookFormValid, loading: isCreatingWebhook }"
    >
      <div class="form-group">
        <label>Callback URL</label>
        <a-input-group compact>
          <a-input style="width: 110px" value="https://" disabled />
          <a-input
            v-model:value="newWebhookUrl"
            :maxlength="80"
            placeholder="example.com/webhook"
            style="width: calc(100% - 110px)"
          />
        </a-input-group>
        <p v-if="webhookUrlError" class="form-error">{{ webhookUrlError }}</p>
        <p class="form-help">每当模型重建进度发生改变时，相关信息会发送到此 URL地址</p>
      </div>
      <div class="form-group mt-4">
        <label>Secret</label>
        <a-input-password v-model:value="newWebhookSecret" placeholder="********" :maxlength="50" />
        <p v-if="webhookSecretError" class="form-error">{{ webhookSecretError }}</p>
        <p class="form-help">用于签署每个请求的密钥，并通过 X-Signature 头验证 webhook 是否来自 MetaST</p>
      </div>
    </a-modal>

    <!-- Rename API Key Modal -->
    <a-modal
      v-model:open="showRenameModal"
      title="Rename API Key"
      @ok="confirmRename"
      @cancel="showRenameModal = false"
      okText="Confirm"
      cancelText="Cancel"
      :okButtonProps="{ style: { background: '#15DFCD', borderColor: '#15DFCD' }, loading: isRenamingApiKey }"
    >
      <div class="form-group">
        <label>New Name</label>
        <a-input v-model:value="editingKeyName" placeholder="Enter new API key name..." />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, createVNode, computed } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import API from '@/utils/api'
import { ApiServer } from '@/utils/taskService'
const currentTab = ref('api')

const showCreateApiKeyModal = ref(false)
const showCreateWebhookModal = ref(false)
const showRenameModal = ref(false)
const showApiKeyResultModal = ref(false)
const isCreatingApiKey = ref(false)
const isCreatingWebhook = ref(false)
const isRenamingApiKey = ref(false)
const isDeletingApiKey = ref(false)

const newKeyName = ref('')
const newWebhookUrl = ref('')
const newWebhookSecret = ref('')
const editingKeyName = ref('')
const createdApiKey = ref('')
const isEditingWebhook = ref(false)

const page = ref(1)
const pageSize = ref(10)

const formatDateTime = (input: string | number | Date) => {
  if (!input) return ''
  let date: Date
  if (typeof input === 'number') {
    const ms = input < 1e12 ? input * 1000 : input
    date = new Date(ms)
  } else if (input instanceof Date) {
    date = input
  } else {
    const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(input)
    date = new Date(hasTz ? input : `${input}Z`)
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

type ApiKey = {
  id: number | string
  name: string
  key: string
  usage: number
  created: string
}

type Webhook = {
  url: string
  secret: string
}

const editingKeyId = ref<ApiKey['id'] | null>(null)

const usage = ref({
  total: 0,
  left: 0
})

const apiKeys = ref<ApiKey[]>([])

const webhooks = ref<Webhook[]>([])

const hasWebhook = computed(() => webhooks.value.length > 0)

const hostnameRegex = /^(?=.{1,253}$)(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/

const normalizeWebhookInput = (value: string) => value.trim()

const buildWebhookUrl = (value: string) => {
  const trimmed = normalizeWebhookInput(value)
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const isValidWebhookUrl = computed(() => {
  const trimmed = normalizeWebhookInput(newWebhookUrl.value)
  if (!trimmed) return false
  if (/\s/.test(trimmed)) return false
  const urlString = buildWebhookUrl(trimmed)
  try {
    const parsed = new URL(urlString)
    return hostnameRegex.test(parsed.hostname)
  } catch (error) {
    return false
  }
})

const webhookUrlError = computed(() => {
  if (!newWebhookUrl.value) return ''
  return isValidWebhookUrl.value ? '' : '请输入合法域名'
})

const webhookSecretError = computed(() => {
  if (!newWebhookSecret.value) return ''
  const length = newWebhookSecret.value.length
  if (length < 6) return 'Secret长度不能少于6'
  return length > 50 ? 'Signing Secret长度不能超过50' : ''
})

const isWebhookSecretValid = computed(() => {
  const length = newWebhookSecret.value.length
  return length >= 6 && length <= 150
})

const isWebhookFormValid = computed(() => isValidWebhookUrl.value && isWebhookSecretValid.value)

const history = ref([
])

const historyColumns = [
  { title: '时间', dataIndex: 'date', key: 'date' },
  {
    title: '原因',
    dataIndex: 'rewards_type',
    key: 'rewards_type',
    customRender: ({ text }: { text: number }) => text === 1 ? "注册赠送开发算力点" : text === 2 ? "重建模型扣除开发算力点" : text === 3 ? "重建失败返还开发算力点" : text === 5 ? "充值获得算力点" : "未知"
  },
  {
    title: '数额',
    dataIndex: 'usage',
    key: 'usage',
    customRender: ({ text }: { text: number }) => `${text} 算力点`
  }
]

const createApiKey = async () => {
  if (!newKeyName.value || isCreatingApiKey.value) return
  isCreatingApiKey.value = true
  try {
    const response = await ApiServer.request({
      url: API.CREATE_API_KEY,
      method: 'post',
      data: {
        name: newKeyName.value
      }
    })
    const newKey = response?.data?.data?.apiKey

    if (response?.data?.data?.bonusCredits !== 0) {
        message.info(`您已获赠${response.data.data.bonusCredits}算力点!`);
        getOpenCredits();
    }
    if (newKey) {
      createdApiKey.value = newKey
      showCreateApiKeyModal.value = false
      showApiKeyResultModal.value = true
      newKeyName.value = ''
      message.success('API Key created successfully')
      fetchApiKeys()
    } else {
    //   message.error('Failed to create API Key')
    }
  } catch (error) {
    // message.error('Failed to create API Key')
  } finally {
    isCreatingApiKey.value = false
  }
}

const copyApiKey = async () => {
  if (!createdApiKey.value) return
  try {
    await navigator.clipboard.writeText(createdApiKey.value)
    message.success('Copied to clipboard')
  } catch (error) {
    // message.error('Copy failed')
  }
}

const closeApiKeyResult = () => {
  showApiKeyResultModal.value = false
  createdApiKey.value = ''
}

const openRenameModal = (key: ApiKey) => {
  editingKeyId.value = key.id
  editingKeyName.value = key.name
  showRenameModal.value = true
}

const confirmRename = async () => {
  if (!editingKeyName.value || isRenamingApiKey.value) return
  if (editingKeyId.value) {
    isRenamingApiKey.value = true
    try {
      const response = await ApiServer.request({
        url: API.RENAME_API_KEY,
        method: 'post',
        data: {
          id: editingKeyId.value,
          name: editingKeyName.value
        }
      })
      if (response?.data?.code == 200) {
        message.success('API Key renamed successfully')
        fetchApiKeys()
      } else {
        // message.error('Failed to rename API Key')
        return
      }
    } finally {
      isRenamingApiKey.value = false
    }
  }
  showRenameModal.value = false
}

const deleteApiKey = (id: ApiKey['id']) => {
  Modal.confirm({
    title: '删除 API Key',
    icon: createVNode(ExclamationCircleOutlined),
    content: '您确定要删除此 API Key 吗？此操作无法撤销。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      if (isDeletingApiKey.value) return
      isDeletingApiKey.value = true
      try {
        const response = await ApiServer.request({
          url: API.DELETE_API_KEY + `/${id}`,
          method: 'delete'
        })
        if (response?.data?.code == 200) {
          message.success('API Key 删除成功')
          fetchApiKeys()
        } else {
        //   message.error('删除 API Key 失败')
        }
      } finally {
        isDeletingApiKey.value = false
      }
      
    },
  })
}

const createWebhook = async () => {
  if (!isWebhookFormValid.value || isCreatingWebhook.value) return
  isCreatingWebhook.value = true
  try {
    const url = buildWebhookUrl(newWebhookUrl.value)
    const payload = {
      web_hooks: url,
      signing_secret: newWebhookSecret.value
    }
    const response = await ApiServer.request({
      url: API.SET_WEBHOOKS,
      method: 'post',
      data: payload
    })
    if (response?.data?.code == 200) {
      message.success(isEditingWebhook.value ? '修改成功' : '创建成功')
      getWebhooks()
    }
    closeWebhookModal()
  } finally {
    isCreatingWebhook.value = false
  }
}

const openWebhookModal = (webhook?: Webhook) => {
  if (webhook) {
    isEditingWebhook.value = true
    newWebhookUrl.value = webhook.url.replace(/^https?:\/\//i, '')
    newWebhookSecret.value = webhook.secret
  } else if (hasWebhook.value) {
    const current = webhooks.value[0]
    isEditingWebhook.value = true
    newWebhookUrl.value = current.url.replace(/^https?:\/\//i, '')
    newWebhookSecret.value = current.secret
  } else {
    isEditingWebhook.value = false
    newWebhookUrl.value = ''
    newWebhookSecret.value = ''
  }
  showCreateWebhookModal.value = true
}

const closeWebhookModal = () => {
  showCreateWebhookModal.value = false
  isEditingWebhook.value = false
  newWebhookUrl.value = ''
  newWebhookSecret.value = ''
}

const deleteWebhook = () => {
  Modal.confirm({
    title: '删除 Webhook',
    icon: createVNode(ExclamationCircleOutlined),
    content: '您确定要删除此 Webhook 吗？此操作无法撤销。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      ApiServer.request({
        url: API.DELETE_WEBHOOKS,
        method: 'delete'
      }).then(response => {
        if (response?.data?.code == 200) {
          message.success('Webhook 删除成功')
          webhooks.value = []
        } else {
          // message.error('删除 Webhook 失败')
        }
      })
    }
  })
}

const getWebhooks = async () => {
  try {
    const response = await ApiServer.request({
      url: API.GET_WEBHOOKS,
      method: 'get'
    })
    const hooks = response?.data?.data || []
    webhooks.value = [{
      url: hooks.web_hooks,
      secret: hooks.signing_secret
    }]
  } catch (error) {
  }
}

const fetchApiKeys = async () => {
    const response = await ApiServer.request({
      url: API.GET_API_KEYS,
      method: 'get'
    })
    const keys = response?.data?.data || []
    console.log(response)
    apiKeys.value = keys.map((k: any) => ({
      id: k.id,
      name: k.name,
      key: k.key,
      usage: k.usage,
      created: formatDateTime(k.created_at)
    }))
}

const getOpenCredits = async () => {
  try {
    const response = await ApiServer.request({
      url: API.GET_OPEN_CREDITS,
      method: 'get'
    })
    const credits = response?.data?.data;
    usage.value.total = credits?.open_credits_used || 0
    usage.value.left = credits?.open_credits_available || 0
  } catch (error) {
  }
}
const getLogs = async () => {
  try {
    const response = await ApiServer.request({
      url: API.GET_OPEN_CREDITS_LOGS,
      method: 'get',
      params: {
        page: page.value,
        pageSize: pageSize.value
      }
    })
    const logs = response?.data?.data || [];
    history.value = logs.map((log: any) => ({
      date: formatDateTime(log.created_at),
      usage: log.rewards_amount,
      rewards_type: log.rewards_type
    }))
  } catch (error) {
  }
}

fetchApiKeys()
getOpenCredits()
getLogs()
getWebhooks()
</script>

<style scoped>
.developer-view {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--text-primary);
  /* Make sure default color scheme is adapted to light/dark */
  --btn-cyan-bg: #15DFCD;
  --btn-cyan-hover: #12cfbe;
  --border-color: var(--glass-border, #e5e7eb);
  --bg-card: var(--bg-secondary, #fafafa);
  --text-main: var(--text-primary, #111827);
  --text-muted: var(--text-secondary, #6b7280);
}

.top-nav {
  margin-bottom: 30px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 16px;
}

.pill-tabs {
  display: flex;
  gap: 10px;
}

.pill-tab {
  padding: 6px 16px;
  border-radius: 20px;
  border: none;
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-tab.active {
  background: var(--text-main);
  color: var(--bg-primary, #fff);
  font-weight: 500;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--text-main);
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-main);
}

.mt-8 { margin-top: 40px; }
.mt-4 { margin-top: 16px; }

.section-desc {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 20px;
}

.btn-cyan {
  background: var(--btn-cyan-bg);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.btn-cyan:hover {
  background: var(--btn-cyan-hover);
}
.btn-icon {
  width: 16px;
  height: 16px;
}


.info-alert {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.ref-badge {
  background: white;
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.ref-text {
  font-size: 13px;
  color: #3b82f6;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ref-text a {
  color: #3b82f6;
  text-decoration: underline;
}

.external-link-icon {
  width: 14px;
  height: 14px;
}

.custom-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
}
.table-container.no-padding {
  padding: 0;
}

.custom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 14px;
}

.custom-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--bg-card);
  color: var(--text-muted);
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.custom-table tbody td {
  padding: 14px 16px;
  color: var(--text-main);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.custom-table tbody tr:nth-child(even) {
  background: rgba(0, 0, 0, 0.02);
}

.custom-table tbody tr:hover {
  background: rgba(21, 223, 205, 0.06);
}

.custom-table tr:last-child td {
  border-bottom: none;
}

.custom-table td:nth-child(1),
.custom-table td:nth-child(2),
.custom-table td:nth-child(3),
.custom-table td:nth-child(4) {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-table th:last-child,
.custom-table td:last-child {
  width: 64px;
  text-align: right;
}


.empty-text {
  text-align: center;
  color: var(--text-muted);
  padding: 30px !important;
}

.actions-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.actions-btn:hover {
  border-color: var(--border-color);
  color: var(--text-main);
  background: rgba(0, 0, 0, 0.03);
}

.usage-cards {
  display: flex;
  gap: 20px;
}

.usage-card {
  flex: 1;
}

.card-label {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 8px;
}

.card-value {
  font-size: 42px;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1;
  margin-bottom: 12px;
}

.card-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
}
.card-hint a {
  color: #9ca3af;
  text-decoration: underline;
}
.hint-icon {
  width: 14px;
  height: 14px;
}

.card-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.card-bottom-text {
  font-size: 13px;
  color: var(--text-muted);
}

.btn-topup {
  height: 36px;
}

.total-text {
  font-size: 14px;
  color: var(--text-muted);
}

.chart-container {
  display: flex;
  height: 250px;
  position: relative;
  margin-top: 10px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 12px;
  padding-right: 15px;
  text-align: right;
  width: 40px;
  height: calc(100% - 25px);
}

.chart-area {
  flex: 1;
  position: relative;
  border-bottom: 1px solid var(--border-color);
  height: calc(100% - 25px);
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.grid-line {
  border-top: 1px dashed var(--border-color);
  opacity: 0.6;
}

.chart-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.chart-line {
  stroke: var(--btn-cyan-bg);
}

.chart-dot {
  color: var(--btn-cyan-bg);
}

.x-axis {
  position: absolute;
  bottom: 0;
  left: 40px;
  right: 0;
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 12px;
  padding-top: 10px;
  padding-left: 20px;
  padding-right: 20px;
}


.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: var(--text-main);
  margin-bottom: 8px;
}

.form-help {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 8px;
  line-height: 1.4;
}

.form-error {
  font-size: 13px;
  color: #ff4d4f;
  margin-top: 8px;
  line-height: 1.4;
}

.result-desc {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.result-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.copy-btn {
  min-width: 96px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.active {
  background: rgba(21, 223, 205, 0.1);
  color: #12cfbe;
}
</style>
