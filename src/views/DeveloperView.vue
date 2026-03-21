<template>
  <div class="developer-view">
    <div class="top-nav">
      <div class="pill-tabs">
        <button
          class="pill-tab"
          :class="{ active: currentTab === 'api' }"
          @click="currentTab = 'api'"
        >
          {{ t('developerLang.api') }}
        </button>
        <button
          class="pill-tab"
          :class="{ active: currentTab === 'webhook' }"
          @click="currentTab = 'webhook'"
        >
          {{ t('developerLang.webhook') }}
        </button>
      </div>
    </div>

    <!-- API Tab -->
    <div v-if="currentTab === 'api'" class="tab-content">
      <div class="section-header">
        <h2>{{ t('developerLang.apiKeys') }}</h2>
        <a-button
          type="primary"
          :loading="isCreatingApiKey"
          :disabled="isCreatingApiKey"
          @click="showCreateApiKeyModal = true"
        >
          {{ t('developerLang.createApiKey') }}
        </a-button>
      </div>
      
      <p style="color: #1890ff; font-weight: bold;" class="section-desc">{{ t('developerLang.bonusTip') }}</p>
      <p class="section-desc">{{ t('developerLang.securityTip') }}</p>


      <div class="custom-card table-container">
        <table class="custom-table centered">
          <thead>
            <tr>
              <th>{{ t('developerLang.name') }}</th>
              <th>{{ t('developerLang.key') }}</th>
              <th>{{ t('developerLang.created') }}</th>
              <th width="50"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in apiKeys" :key="key.id">
              <td>{{ key.name }}</td>
              <td>{{ key.key }}</td>
              <td>{{ key.created }}</td>
              <td>
                <a-dropdown placement="bottomRight">
                  <button class="actions-btn">···</button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="openRenameModal(key)">
                        {{ t('developerLang.rename') }}
                      </a-menu-item>
                      <a-menu-item
                        :disabled="isDeletingApiKey"
                        @click="deleteApiKey(key.id)"
                        style="color: #ff4d4f"
                      >
                        {{ t('developerLang.delete') }}
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </td>
            </tr>
            <tr v-if="apiKeys.length === 0">
              <td colspan="5" class="empty-text">{{ t('developerLang.noApiKeys') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section-header mt-8">
        <h2>{{ t('developerLang.usageTitle') }}</h2>
      </div>
      <p class="section-desc">{{ t('developerLang.usageDesc') }}</p>

      <div class="usage-cards">
        <div class="custom-card usage-card">
          <div class="card-label">{{ t('developerLang.totalUsage') }}</div>
          <div class="card-value">{{ usage.total }}</div>
          <div class="card-hint">
            <svg viewBox="0 0 24 24" class="hint-icon" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <a-tooltip :title="t('developerLang.costTooltip')">
              <span>{{ t('developerLang.costQuestion') }}</span>
            </a-tooltip>
          </div>
        </div>
        <div class="custom-card usage-card">
          <div class="card-flex">
            <div>
              <div class="card-label">{{ t('developerLang.leftCredits') }}</div>
              <div class="card-value">{{ usage.left }}</div>
              <div class="card-bottom-text">{{ t('developerLang.validity') }}</div>
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
        <h3>{{ t('developerLang.historyTitle') }}</h3>
      </div>
      <div class="custom-card table-container no-padding">
        <a-table
          :data-source="history"
          :pagination="{ pageSize: pageSize, showSizeChanger: false }"
          row-key="id"
          :columns="historyColumns"
          :scroll="{ x: 720 }"
          size="middle"
          class="centered-table"
        />
      </div>
    </div>

    <!-- Webhook Tab -->
    <div v-else class="tab-content">
      <div class="section-header">
        <h2>{{ t('developerLang.webhooksTitle') }}</h2>
        <a-button type="primary" @click="openWebhookModal()">
          {{ hasWebhook ? t('developerLang.editWebhook') : t('developerLang.addWebhook') }}
        </a-button>
      </div>
      <p class="section-desc">{{ t('developerLang.webhookDesc') }}</p>

      <div class="custom-card table-container">
        <table class="custom-table centered">
          <thead>
            <tr>
              <th>{{ t('developerLang.callbackUrl') }}</th>
              <th>{{ t('developerLang.created') }}</th>
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
                        {{ t('developerLang.editWebhook') }}
                      </a-menu-item>
                      <a-menu-item @click="deleteWebhook" style="color: #ff4d4f">
                        {{ t('developerLang.delete') }}
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </td>
            </tr>
            <tr v-if="webhooks.length === 0">
              <td colspan="4" class="empty-text">{{ t('developerLang.noWebhooks') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <a-modal
      v-model:open="showCreateApiKeyModal"
      :title="t('developerLang.createApiKey')"
      @ok="createApiKey"
      @cancel="showCreateApiKeyModal = false"
      :okText="t('developerLang.create')"
      :cancelText="t('developerLang.cancel')"
      :okButtonProps="{ disabled: !newKeyName, loading: isCreatingApiKey }"
    >
      <div class="form-group">
        <label>{{ t('developerLang.name') }}</label>
        <a-input v-model:value="newKeyName" :placeholder="t('developerLang.enterName')" />
      </div>
    </a-modal>

    <!-- 不显示关闭按钮 -->
    <a-modal
      v-model:open="showApiKeyResultModal"
      :title="t('developerLang.createApiKey')"
      @ok="closeApiKeyResult"
      @cancel="closeApiKeyResult"
      :okText="t('developerLang.gotIt')"
      :closable="false"
      :maskClosable="false"
      :cancelButtonProps="{ style: { display: 'none' } }"
    >
      <p class="result-desc">
        {{ t('developerLang.createSuccessModal') }}
      </p>
      <div class="result-row">
        <a-input :value="createdApiKey" readonly />
        <a-button class="copy-btn" @click="copyApiKey">{{ t('developerLang.copy') }}</a-button>
      </div>
    </a-modal>

    <a-modal
      v-model:open="showCreateWebhookModal"
      :title="isEditingWebhook ? t('developerLang.editWebhook') : t('developerLang.addWebhook')"
      @ok="createWebhook"
      @cancel="closeWebhookModal"
      :okText="isEditingWebhook ? t('developerLang.save') : t('developerLang.add')"
      :cancelText="t('developerLang.cancel')"
      :okButtonProps="{ disabled: !isWebhookFormValid, loading: isCreatingWebhook }"
    >
      <div class="form-group">
        <label>{{ t('developerLang.callbackUrl') }}</label>
        <a-input-group compact>
          <a-input style="width: 110px" value="https://" disabled />
          <a-input
            v-model:value="newWebhookUrl"
            :maxlength="80"
            :placeholder="t('developerLang.callbackPlaceholder')"
            style="width: calc(100% - 110px)"
          />
        </a-input-group>
        <p v-if="webhookUrlError" class="form-error">{{ webhookUrlError }}</p>
        <p class="form-help">{{ t('developerLang.webhookUrlHelp') }}</p>
      </div>
      <div class="form-group mt-4">
        <label>Secret</label>
        <a-input-password v-model:value="newWebhookSecret" placeholder="********" :maxlength="50" />
        <p v-if="webhookSecretError" class="form-error">{{ webhookSecretError }}</p>
        <p class="form-help">{{ t('developerLang.secretHelp') }}</p>
      </div>
    </a-modal>

    <!-- Rename API Key Modal -->
    <a-modal
      v-model:open="showRenameModal"
      :title="t('developerLang.renameModalTitle')"
      @ok="confirmRename"
      @cancel="showRenameModal = false"
      :okText="t('developerLang.confirm')"
      :cancelText="t('developerLang.cancel')"
      :okButtonProps="{ style: { background: '#8B5CF6', borderColor: '#8B5CF6' }, loading: isRenamingApiKey }"
    >
      <div class="form-group">
        <label>{{ t('developerLang.newName') }}</label>
        <a-input v-model:value="editingKeyName" :placeholder="t('developerLang.enterNewName')" />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, createVNode, computed, onMounted, onUnmounted } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import API from '@/utils/api'
import { ApiServer } from '@/utils/taskService'

const { t } = useI18n()
const currentTab = ref('api')

const developerContentClass = 'developer-content'

const setDeveloperContentClass = () => {
  const contentElement = document.querySelector('.content')
  if (!contentElement) return
  contentElement.classList.add(developerContentClass)
}

const unsetDeveloperContentClass = () => {
  const contentElement = document.querySelector('.content')
  if (!contentElement) return
  contentElement.classList.remove(developerContentClass)
}

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
  return isValidWebhookUrl.value ? '' : t('developerLang.invalidDomain')
})

const webhookSecretError = computed(() => {
  if (!newWebhookSecret.value) return ''
  const length = newWebhookSecret.value.length
  if (length < 6) return t('developerLang.secretMinLength')
  return length > 50 ? t('developerLang.secretMaxLength') : ''
})

const isWebhookSecretValid = computed(() => {
  const length = newWebhookSecret.value.length
  return length >= 6 && length <= 150
})

const isWebhookFormValid = computed(() => isValidWebhookUrl.value && isWebhookSecretValid.value)

const history = ref([
])

const historyColumns = computed(() => [
  { title: t('developerLang.timeColumn'), dataIndex: 'date', key: 'date' },
  {
    title: t('developerLang.reasonColumn'),
    dataIndex: 'rewards_type',
    key: 'rewards_type',
    customRender: ({ text }: { text: number }) => text === 1 ? t('developerLang.reasonRegister') : text === 2 ? t('developerLang.reasonConsume') : text === 3 ? t('developerLang.reasonRefund') : text === 5 ? t('developerLang.reasonRecharge') : t('developerLang.reasonUnknown')
  },
  {
    title: t('developerLang.amountColumn'),
    dataIndex: 'usage',
    key: 'usage',
    customRender: ({ text }: { text: number }) => `${text} ${t('developerLang.currencyUnit')}`
  }
])

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
      message.success(t('developerLang.createSuccess'))
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
    message.success(t('developerLang.copySuccess'))
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
        message.success(t('developerLang.renameSuccess'))
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
    title: t('developerLang.deleteApiKeyTitle'),
    icon: createVNode(ExclamationCircleOutlined),
    content: t('developerLang.deleteApiKeyContent'),
    okText: t('developerLang.delete'),
    okType: 'danger',
    cancelText: t('developerLang.cancel'),
    async onOk() {
      if (isDeletingApiKey.value) return
      isDeletingApiKey.value = true
      try {
        const response = await ApiServer.request({
          url: API.DELETE_API_KEY + `/${id}`,
          method: 'delete'
        })
        if (response?.data?.code == 200) {
          message.success(t('developerLang.deleteSuccess'))
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
      message.success(isEditingWebhook.value ? t('developerLang.editSuccess') : t('developerLang.createSuccess'))
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
    title: t('developerLang.deleteWebhookTitle'),
    icon: createVNode(ExclamationCircleOutlined),
    content: t('developerLang.deleteWebhookContent'),
    okText: t('developerLang.delete'),
    okType: 'danger',
    cancelText: t('developerLang.cancel'),
    onOk() {
      ApiServer.request({
        url: API.DELETE_WEBHOOKS,
        method: 'delete'
      }).then(response => {
        if (response?.data?.code == 200) {
          message.success(t('developerLang.deleteWebhookSuccess'))
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

onMounted(() => {
  setDeveloperContentClass()
})

onUnmounted(() => {
  unsetDeveloperContentClass()
})
</script>

<style scoped>
.developer-view {
  padding: 32px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  color: var(--text-primary);
  --btn-cyan-bg: #8B5CF6;
  --btn-cyan-hover: #7C3AED;
  --border-color: #e8e8e8;
  --bg-card: #ffffff;
  --text-main: #1a1a1a;
  --text-muted: #666666;
  animation: fadeInUp 0.4s ease-out;
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

.top-nav {
  margin-bottom: 24px;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 14px;
}

.pill-tabs {
  display: flex;
  gap: 8px;
}

.pill-tab {
  padding: 8px 18px;
  border-radius: 22px;
  border: none;
  background: #f5f5f5;
  color: #666666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.pill-tab:hover {
  background: #eeeeee;
  color: #333333;
}

.pill-tab.active {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h2 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.section-header h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.mt-8 { margin-top: 36px; }
.mt-4 { margin-top: 16px; }

.section-desc {
  color: #666666;
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
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}
.btn-cyan:hover {
  background: var(--btn-cyan-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(21, 223, 205, 0.3);
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
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  width: 100%;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}
.table-container.no-padding {
  padding: 0;
}

.custom-table.centered thead th {
  text-align: center;
}

.custom-table.centered tbody td {
  text-align: center;
}

.centered-table :deep(.ant-table-thead > tr > th) {
  text-align: center;
}

.centered-table :deep(.ant-table-tbody > tr > td) {
  text-align: center;
}

.custom-table {
  width: 100%;
  min-width: 720px;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 14px;
}

.tab-content {
  width: 100%;
  max-width: 100%;
}

.centered-table :deep(.ant-table) {
  width: 100%;
  max-width: 100%;
}

.centered-table :deep(.ant-table-container) {
  overflow-x: auto;
}

.centered-table :deep(.ant-table-content) {
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch;
}

.custom-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fafafa;
  color: #666666;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.custom-table tbody td {
  padding: 16px 20px;
  color: #1a1a1a;
  border-bottom: 1px solid #f5f5f5;
  vertical-align: middle;
  font-size: 13px;
}

.custom-table tbody tr:nth-child(even) {
  background: #fafafa;
}

.custom-table tbody tr:hover {
  background: rgba(139, 92, 246, 0.06);
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
  color: #999999;
  padding: 30px !important;
  font-size: 14px;
}

.actions-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  color: #888888;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.actions-btn:hover {
  border-color: #e8e8e8;
  color: #1a1a1a;
  background: #f5f5f5;
}

.usage-cards {
  display: flex;
  gap: 20px;
}

.usage-card {
  flex: 1;
}

.card-label {
  color: #666666;
  font-size: 13px;
  margin-bottom: 8px;
  font-weight: 600;
}

.card-value {
  font-size: 38px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.1;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888888;
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
  font-size: 12px;
  color: #888888;
  margin-top: 4px;
}

.btn-topup {
  height: 36px;
}

.total-text {
  font-size: 14px;
  color: #666666;
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
  color: #999999;
  font-size: 11px;
  padding-right: 15px;
  text-align: right;
  width: 40px;
  height: calc(100% - 25px);
}

.chart-area {
  flex: 1;
  position: relative;
  border-bottom: 1px solid #e8e8e8;
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
  border-top: 1px dashed #e8e8e8;
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
  color: #999999;
  font-size: 11px;
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
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.form-help {
  font-size: 12px;
  color: #888888;
  margin-top: 6px;
  line-height: 1.4;
}

.form-error {
  font-size: 12px;
  color: #ef4444;
  margin-top: 6px;
  line-height: 1.4;
}

.result-desc {
  color: #666666;
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
  font-weight: 600;
}
.status-badge.active {
  background: rgba(139, 92, 246, 0.15);
  color: #7c3aed;
}

@media (max-width: 960px) {
  :global(.content.developer-content) {
    width: 100vw;
    max-width: 100vw;
    margin: 0;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .developer-view {
    padding: 20px;
    width: 100%;
    overflow-x: hidden;
    min-width: 0;
    max-width: 100vw;
    margin: 0;
    box-sizing: border-box;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    max-width: 100%;
  }

  .section-header h2 {
    font-size: 18px;
  }

  .section-header h3 {
    font-size: 15px;
  }

  .usage-cards {
    flex-direction: column;
    max-width: 100%;
  }

  .pill-tabs {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 4px;
    max-width: 100%;
  }

  .pill-tabs::-webkit-scrollbar {
    display: none;
  }

  .pill-tab {
    flex: 0 0 auto;
    text-align: center;
    padding: 10px 16px;
    font-size: 13px;
    white-space: nowrap;
  }

  .custom-card {
    padding: 16px;
    border-radius: 12px;
    max-width: 100%;
    overflow-x: auto;
    box-sizing: border-box;
  }

  .custom-table {
    display: table;
    min-width: 720px;
    max-width: 100%;
  }

  .custom-table thead th {
    padding: 14px 16px;
    font-size: 12px;
    white-space: nowrap;
  }

  .custom-table tbody td {
    padding: 14px 16px;
    font-size: 13px;
    white-space: nowrap;
    min-width: 0;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-value {
    font-size: 32px;
  }

  .form-group {
    margin-bottom: 16px;
    max-width: 100%;
    overflow-x: hidden;
  }

  .result-row {
    flex-direction: column;
  }

  .result-row .ant-input {
    width: 100% !important;
  }

  .copy-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .developer-view {
    padding: 14px;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
    margin: 0;
    box-sizing: border-box;
  }

  .section-header {
    margin-bottom: 10px;
    max-width: 100%;
  }

  .section-header h2 {
    font-size: 16px;
  }

  .section-header h3 {
    font-size: 14px;
  }

  .pill-tabs {
    flex-direction: row;
    gap: 6px;
    padding-bottom: 4px;
    max-width: 100%;
    overflow-x: auto;
  }

  .pill-tab {
    padding: 8px 14px;
    font-size: 12px;
    border-radius: 18px;
  }

  .pill-tab.active {
    padding: 8px 14px;
  }

  .section-desc {
    font-size: 13px;
    margin-bottom: 16px;
    max-width: 100%;
    overflow-x: hidden;
  }

  .custom-card {
    padding: 14px;
    border-radius: 10px;
    max-width: 100%;
    overflow-x: auto;
    box-sizing: border-box;
  }

  .custom-table {
    min-width: 680px;
  }

  .card-label {
    font-size: 12px;
  }

  .card-value {
    font-size: 26px;
  }

  .card-bottom-text {
    font-size: 11px;
  }

  .empty-text {
    padding: 20px !important;
    font-size: 13px;
  }

  .actions-btn {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
}
</style>
