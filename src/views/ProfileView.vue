<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- 顶部信息卡片 -->
      <a-card class="profile-header-card" :bordered="false">
        <div class="profile-header-content">
          <!-- 头像区域 -->

          <div class="profile-identity-row">
            <div class="avatar-section">
              <div class="avatar-wrapper">
                <a-image
                  :src="avatarSrc"
                  class="avatar-image"
                  placeholder
                  fallback="data:image/png;base64,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"
                  preview
                  />
              </div>
              <button 
                class="avatar-edit-btn" 
                @click="triggerFile" 
                :title="t('profile.editAvatar')"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
                </svg>
              </button>
              <input 
                ref="fileInput" 
                type="file" 
                accept="image/*" 
                @change="onFileChange" 
                class="avatar-file-input"
              />
            </div>

            <!-- 基础信息 -->
            <div class="user-basic-info">
              <h2 class="username">{{ user?.username || t('profile.anonymous') }}</h2>

              <!-- 昵称显示 -->
              <div class="nickname-row">
                <span class="nickname-badge">
                  <UserOutlined />
                  <span>{{ user?.nickname || t('profile.noNickname') }}</span>
                </span>
                <button
                  class="nickname-edit-btn"
                  @click="toggleEditName"
                  :title="t('profile.editNickname')"
                >
                  <EditOutlined />
                </button>
              </div>

              <!-- 登录时间 -->
              <div class="login-time-row" v-if="user?.loginTime">
                <ClockCircleOutlined />
                <span>上次登录: {{ formatLoginTime(user.loginTime) }}</span>
              </div>
            </div>

            <!-- 右侧算力点 -->
            <div class="user-right-section">
              <div class="points-display" @click="showPointsLogs = true">
                  <svg t="1773227143569" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3763" width="48" height="48"><path d="M512 0c282.763636 0 512 229.236364 512 512s-229.236364 512-512 512S0 794.763636 0 512 229.236364 0 512 0z m208.011636 209.454545H460.194909a5.306182 5.306182 0 0 0-4.654545 3.188364L279.970909 563.502545a7.168 7.168 0 0 0 0 6.237091 5.352727 5.352727 0 0 0 4.654546 3.141819h118.202181l-60.625454 280.41309c-1.303273 6.097455 5.073455 10.379636 9.006545 6.027637l391.819637-432.663273c1.629091-1.861818 2.094545-4.491636 1.28-6.842182-0.814545-2.373818-2.816-3.909818-5.026909-3.909818h-149.248l134.213818-196.235636a7.144727 7.144727 0 0 0 0.651636-6.632728 5.492364 5.492364 0 0 0-4.910545-3.584z" fill="#F1BA5A" p-id="3764"></path></svg>
                <div class="points-info">
                  <span class="points-value">{{ currentPoints }}</span>
                  <span class="points-label">算力点</span>
                </div>
                <RightOutlined class="points-arrow" />
              </div>
            </div>
          </div>
        </div>
      </a-card>

      <!-- 主体内容区域 -->
      <div class="profile-body">
        <div class="profile-grid">
          <!-- 左侧统计卡片 -->
          <div class="profile-sidebar">
            <a-card class="stats-card" :bordered="false">
              <h3 class="card-title">{{ t('profile.accountStats') }}</h3>
              <div class="stats-list">
                <div class="stat-item">
                  <div class="stat-label">{{ t('profile.lastLogin') }}</div>
                  <div class="stat-value">{{ formatLoginTime(user?.loginTime || '') || '-' }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">{{ t('profile.accountStatus') }}</div>
                  <div class="stat-value">
                    <a-tag color="success">{{ t('profile.active') }}</a-tag>
                  </div>
                </div>
              </div>
            </a-card>

            <!-- 账户安全卡片 -->
            <a-card class="security-card" :bordered="false">
              <h3 class="card-title">{{ t('profile.accountSecurity') }}</h3>
              <div class="security-actions">
                <a-button 
                  type="primary" 
                  block 
                  @click="showChangePwdModal = true"
                  class="change-pwd-btn"
                >
                  {{ t('profile.changePassword') }}
                </a-button>
              </div>
            </a-card>
          </div>

          <!-- 右侧详细信息 -->
          <div class="profile-content">
            <a-card class="details-card" :bordered="false">
              <h3 class="card-title">{{ t('profile.personalDetails') }}</h3>
              <a-list class="details-list">
                <a-list-item class="detail-item">
                  <span class="detail-label">{{ t('profile.nickname') }}:</span>
                  <span class="detail-value">{{ user?.nickname || '-' }}</span>
                </a-list-item>
                <a-list-item class="detail-item">
                  <span class="detail-label">{{ t('profile.phone') }}:</span>
                  <span class="detail-value">
                    <template v-if="hasBoundPhone">{{ user?.phone }}</template>
                    <a-button v-else type="link" class="bind-phone-link" @click="openBindPhoneModal">去绑定</a-button>
                  </span>
                </a-list-item>
                <a-list-item class="detail-item">
                  <span class="detail-label">{{ t('login.email') }}:</span>
                  <span class="detail-value">
                    <template v-if="hasBoundEmail">{{ displayEmail }}</template>
                    <a-button v-else type="link" class="bind-phone-link" @click="openBindEmailModal">去绑定</a-button>
                  </span>
                </a-list-item>
              </a-list> 
            </a-card>

            <!-- 账户设置卡片 -->
            <a-card class="settings-card" :bordered="false">
              <h3 class="card-title">{{ t('profile.accountSettings') }}</h3>
            </a-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <a-modal
      v-model:open="showChangePwdModal"
      :title="t('profile.changePassword')"
      :ok-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      @ok="handleChangePwd"
      
    >
      <a-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" layout="vertical" class="pwd-form" @keydown.enter.prevent="handleChangePwd">
        <a-form-item name="oldPwd" :label="t('profile.oldPassword')">
          <a-input-password 
            v-model:value="pwdForm.oldPwd" 
            :placeholder="t('profile.enterOldPwd')"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item name="newPwd" :label="t('profile.newPassword')">
          <a-input-password 
            v-model:value="pwdForm.newPwd" 
            :placeholder="t('profile.enterNewPwd')"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item name="confirmPwd" :label="t('profile.confirmPassword')">
          <a-input-password 
            v-model:value="pwdForm.confirmPwd" 
            :placeholder="t('profile.confirmNewPwd')"
            autocomplete="off"
          />
        </a-form-item>
        </a-form>
      </a-modal>

    <!-- 昵称编辑弹窗 -->
    <a-modal
      v-model:open="editingName"
      :title="t('profile.editNickname')"
      :ok-text="t('common.save')"
      :cancel-text="t('common.cancel')"
      @ok="saveName"

      @cancel="nameValue = editingNameOriginal; editingName = false"
      :ok-button-props="{ disabled: !canSaveNickname }"
      mask
    >
      <a-input
        v-model:value="nameValue"
        :placeholder="t('profile.enterNickname')"
        @press.enter="saveName"
        @keydown.enter.prevent="saveName"
      />
    </a-modal>

    <a-modal
      v-model:open="showBindPhoneModal"
      title="绑定手机号"
      :footer="null"
      @cancel="closeBindPhoneModal"
    >
      <div class="bind-phone-section">
        <div v-if="bindStep === 'phone'" class="bind-step-container">
          <a-form
            ref="bindPhoneFormRef"
            :model="bindPhoneForm"
            :rules="bindPhoneRules"
            layout="vertical"
            class="pwd-form"
            @keydown.enter.prevent="goBindPhoneNext"
          >
            <a-form-item name="phone" label="手机号">
              <a-input
                v-model:value="bindPhoneForm.phone"
                type="tel"
                placeholder="请输入手机号"
                maxlength="16"
                autocomplete="off"
                @press.enter="goBindPhoneNext"
              >
                <template #prefix>
                  <a-select
                    v-model:value="selectedBindAreaCode"
                    class="bind-area-code-select"
                    @change="handleBindAreaCodeChange"
                  >
                    <a-select-option value="+86">+86</a-select-option>
                    <a-select-option value="+1">+1</a-select-option>
                    <a-select-option value="+44">+44</a-select-option>
                    <a-select-option value="+81">+81</a-select-option>
                    <a-select-option value="+49">+49</a-select-option>
                    <a-select-option value="+33">+33</a-select-option>
                    <a-select-option value="+7">+7</a-select-option>
                    <a-select-option value="+34">+34</a-select-option>
                  </a-select>
                </template>
              </a-input>
            </a-form-item>
          </a-form>
          <a-button type="primary" block :loading="isBindLoading" @click="goBindPhoneNext">下一步</a-button>
        </div>

        <div v-else class="bind-step-container">
          <div class="phone-info">
            <span class="info-value">{{ selectedBindAreaCode }} {{ bindPhoneForm.phone }}</span>
            <a class="back-btn" @click="backToBindPhoneStep">返回修改</a>
          </div>

          <div class="code-input-section">
            <SmsCodeInput
              v-model="bindPhoneForm.code"
              :length="6"
              class="verification-input"
              @enter="submitBindPhone"
            />
          </div>

          <div class="resend-container">
            <a class="resend-link" :class="{ disabled: bindCountdown > 0 }" @click.prevent="bindCountdown <= 0 && sendBindPhoneCode()">
              <span v-if="bindCountdown > 0">{{ bindCountdown }}s 后重发</span>
              <span v-else>重新发送验证码</span>
            </a>
          </div>

          <a-button type="primary" block :loading="isBindLoading" @click="submitBindPhone">绑定手机号</a-button>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="showBindEmailModal"
      title="绑定邮箱"
      :footer="null"
      @cancel="closeBindEmailModal"
    >
      <div class="bind-phone-section">
        <div v-if="bindEmailStep === 'email'" class="bind-step-container">
          <a-form
            ref="bindEmailFormRef"
            :model="bindEmailForm"
            :rules="bindEmailRules"
            layout="vertical"
            class="pwd-form"
            @keydown.enter.prevent="goBindEmailNext"
          >
            <a-form-item name="email" label="邮箱">
              <a-auto-complete
                v-model:value="bindEmailForm.email"
                :options="bindEmailOptions"
                placeholder="请输入邮箱"
                
                class="bind-email-autocomplete"
              >
                <a-input
                  class="bind-email-input"
                  placeholder="请输入邮箱"
                  autocomplete="off"
                  @press.enter="goBindEmailNext"
                />
              </a-auto-complete>
            </a-form-item>
          </a-form>
          <a-button type="primary" block :loading="isBindEmailLoading" @click="goBindEmailNext">下一步</a-button>
        </div>

        <div v-else class="bind-step-container">
          <div class="email-code-section">
            <div class="email-code-head">
              <p class="email-code-tip">验证码已发送至 {{ bindEmailForm.email }}</p>
              <a class="email-code-back" @click="backToBindEmailStep">返回修改邮箱</a>
            </div>
            <p class="email-code-validity">验证码 10 分钟内有效</p>

            <EmailInputCode
              v-model="bindEmailForm.code"
              :length="6"
              @enter="submitBindEmail"
              class="email-code-input-wrap"
            />
          </div>

          <a-button type="primary" block :loading="isBindEmailLoading" @click="submitBindEmail">绑定邮箱</a-button>
        </div>
      </div>
    </a-modal>

    <AvatarCropper
      v-model:open="showCropperModal"
      :image="cropperImageUrl"
      :file-name="cropperFileName"
      aspect-ratio="1:1"
      img-format="jpeg"
      :image-size="cropperImageSize"
      @crop="handleCropResult"
    />

    <!-- 算力点日志弹窗 -->
    <PointsLogs v-model:open="showPointsLogs" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { usePointsStore } from '@/stores/points'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { EditOutlined, UserOutlined, ClockCircleOutlined, RightOutlined } from '@ant-design/icons-vue'
import SmsCodeInput from '../components/SmsCodeInput.vue'
import EmailInputCode from '../components/EmailInputCode.vue'
import AvatarCropper from '../components/AvatarCropper.vue'
import PointsLogs from '../components/PointsLogs.vue'

const { t } = useI18n()
const userStore = useUserStore()
const pointsStore = usePointsStore()
const user = computed(() => userStore.userInfo || null)

//算力点相关
const showPointsLogs = ref(false)
const currentPoints = computed(() => pointsStore.current_points)

onMounted(() => {
  try {
    pointsStore.getPoints()
    pointsStore.getPointsAllLogs()
  } catch (error) {
    console.error('获取算力点信息失败:', error)
  }
})

// 格式化登录时间
const formatLoginTime = (time: string) => {
  if (!time) return '-'
  const date = new Date(time)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const editingName = ref(false)
const nameValue = ref('')
const editingNameOriginal = ref('')

const avatarPreview = ref<string | null>('/default.svg')
const fileInput = ref<HTMLInputElement | null>(null)
const showCropperModal = ref(false)
const cropperImageUrl = ref('')
const cropperImageSize = ref(0)
const cropperFileName = ref('avatar.jpg')

const showChangePwdModal = ref(false)
const pwdFormRef = ref<FormInstance>()
const pwdForm = ref({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})

const showBindPhoneModal = ref(false)
const bindPhoneFormRef = ref<FormInstance>()
const bindStep = ref<'phone' | 'code'>('phone')
const bindPhoneForm = ref({
  phone: '',
  code: ''
})
const selectedBindAreaCode = ref('+86')
const bindCountdown = ref(0)
const isBindLoading = ref(false)
let bindCountdownTimer: ReturnType<typeof setInterval> | null = null

const showBindEmailModal = ref(false)
const bindEmailFormRef = ref<FormInstance>()
const bindEmailStep = ref<'email' | 'code'>('email')
const bindEmailForm = ref({
  email: '',
  code: ''
})
const isBindEmailLoading = ref(false)

const buildEmailOptions = (value: string) => {
  const input = (value || '').trim()
  if (!input) return []

  const domains = ['gmail.com', 'qq.com', '163.com', '126.com', 'outlook.com', 'hotmail.com']
  if (input.includes('@')) {
    const [name, domainPart] = input.split('@')
    if (!name) return []
    return domains
      .filter(domain => domain.startsWith(domainPart || ''))
      .map(domain => ({ value: `${name}@${domain}` }))
  }

  return domains.map(domain => ({ value: `${input}@${domain}` }))
}

const bindEmailOptions = computed(() => buildEmailOptions(bindEmailForm.value.email))

const canSaveNickname = computed(() => nameValue.value.trim().length > 0)
const avatarSrc = computed(() => avatarPreview.value || user.value?.headimg || '')
const isPhoneLoginUser = computed(() => user.value?.loginType === 'phone')
const hasBoundPhone = computed(() => !!user.value?.phone && String(user.value.phone).trim().length > 0)
const boundEmailMatch = computed(() => {
  const username = user.value?.username || ''
  return username.match(/^user_(.+@[^\s@]+\.[^\s@]+)$/i)
})
const hasBoundEmail = computed(() => !!boundEmailMatch.value?.[1])
const displayEmail = computed(() => {
  const username = user.value?.username || ''
  const prefixedEmailMatch = username.match(/^user_(.+@[^\s@]+\.[^\s@]+)$/i)
  if (prefixedEmailMatch?.[1]) return prefixedEmailMatch[1]
  return '未绑定'
})

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/
const phonePatterns = {
  '+86': /^1[3-9]\d{9}$/,
  '+1': /^\d{10}$/,
  '+44': /^\d{10,11}$/,
  '+81': /^\d{10,11}$/,
  '+49': /^\d{10,11}$/,
  '+33': /^\d{9,10}$/,
  '+7': /^\d{10}$/,
  '+34': /^\d{9}$/
}

const resolveBindPhonePattern = () => {
  return phonePatterns[selectedBindAreaCode.value as keyof typeof phonePatterns] || /^1\d{10}$/
}

const buildBindPhonePayload = (phone: string) => {
  const rawPhone = phone.trim()
  if (selectedBindAreaCode.value === '+86') {
    return rawPhone
  }
  return `${selectedBindAreaCode.value}${rawPhone}`
}
const pwdRules = computed(() => ({
  oldPwd: [
    {
      validator(_: any, value: string) {
        if (isPhoneLoginUser.value) {
          return Promise.resolve()
        }
        if (!value || !value.trim()) {
          return Promise.reject(new Error('请输入原密码'))
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 16, message: t('login.passwordRange') || '密码长度应为8-16位', trigger: 'blur' },
    { pattern: passwordRegex, message: t('login.passwordRule') || '密码必须包含大写字母、小写字母和数字', trigger: 'blur' }
  ],
  confirmPwd: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator(_: any, value: string) {
        if (value !== pwdForm.value.newPwd) {
          return Promise.reject(new Error(t('login.confirmPasswordMismatch') || '两次输入的密码不一致'))
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}))

const bindPhoneRules = computed(() => ({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator(_: any, value: string) {
        if (!value || !value.trim()) {
          return Promise.resolve()
        }
        const pattern = resolveBindPhonePattern()
        if (!pattern.test(value.trim())) {
          return Promise.reject(new Error('请输入有效的手机号'))
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}))

const bindEmailRules = computed(() => ({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}))

if (user.value) {
  nameValue.value = user.value.nickname || ''
  avatarPreview.value = user.value.headimg || '/default.svg'
}

const toggleEditName = () => {
  editingNameOriginal.value = nameValue.value
  editingName.value = true
}

const saveName = () => {
  const newName = nameValue.value.trim()
  if (!newName) {
    message.warning(t('profile.nicknameRequired'))
    return
  }
  userStore.modifyNickname(newName)
  editingName.value = false
  message.success(t('profile.saveSuccess'))
}

const triggerFile = () => {
  fileInput.value?.click()
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    message.error(t('profile.avatarSizeLimit'))
    return
  }

  if (cropperImageUrl.value) {
    URL.revokeObjectURL(cropperImageUrl.value)
  }

  cropperImageUrl.value = URL.createObjectURL(file)
  cropperImageSize.value = file.size
  cropperFileName.value = file.name || 'avatar.jpg'
  showCropperModal.value = true

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleCropResult = (payload: { dataUrl: string }) => {
  avatarPreview.value = payload.dataUrl
  userStore.modifyHeadImage(payload.dataUrl)
  message.success(t('profile.avatarSaved'))
}

const handleChangePwd = async () => {
  try {
    await pwdFormRef.value?.validate()
  } catch {
    return
  }

  const oldPwdValue = isPhoneLoginUser.value ? '' : pwdForm.value.oldPwd.trim()
  const ok = await userStore.modifyPassword(oldPwdValue, pwdForm.value.newPwd.trim())
  if (!ok) return

  showChangePwdModal.value = false
  pwdForm.value = { oldPwd: '', newPwd: '', confirmPwd: '' }
  pwdFormRef.value?.clearValidate()
}

const startBindCountdown = () => {
  if (bindCountdownTimer) {
    clearInterval(bindCountdownTimer)
  }
  bindCountdown.value = 60
  bindCountdownTimer = setInterval(() => {
    bindCountdown.value -= 1
    if (bindCountdown.value <= 0 && bindCountdownTimer) {
      clearInterval(bindCountdownTimer)
      bindCountdownTimer = null
    }
  }, 1000)
}

const openBindPhoneModal = () => {
  bindStep.value = 'phone'
  bindPhoneForm.value = { phone: '', code: '' }
  selectedBindAreaCode.value = '+86'
  bindCountdown.value = 0
  if (bindCountdownTimer) {
    clearInterval(bindCountdownTimer)
    bindCountdownTimer = null
  }
  showBindPhoneModal.value = true
}

const closeBindPhoneModal = () => {
  showBindPhoneModal.value = false
  bindStep.value = 'phone'
  bindPhoneForm.value = { phone: '', code: '' }
  selectedBindAreaCode.value = '+86'
  bindPhoneFormRef.value?.clearValidate()
  if (bindCountdownTimer) {
    clearInterval(bindCountdownTimer)
    bindCountdownTimer = null
  }
  bindCountdown.value = 0
}

const handleBindAreaCodeChange = () => {
  bindPhoneFormRef.value?.validateFields(['phone'])
}

const backToBindPhoneStep = () => {
  bindStep.value = 'phone'
  bindPhoneForm.value.code = ''
  bindCountdown.value = 0
  if (bindCountdownTimer) {
    clearInterval(bindCountdownTimer)
    bindCountdownTimer = null
  }
}

const goBindPhoneNext = async () => {
  isBindLoading.value = true
  try {
    await bindPhoneFormRef.value?.validateFields(['phone'])
    bindStep.value = 'code'
    bindPhoneForm.value.code = ''
    const ok = await userStore.sendPhoneCode(buildBindPhonePayload(bindPhoneForm.value.phone.trim()))
    if (!ok) return
    startBindCountdown()
  } catch {
    return
  } finally {
    isBindLoading.value = false
  }
}

const sendBindPhoneCode = async () => {
  if (bindCountdown.value > 0) return
  isBindLoading.value = true
  const phone = bindPhoneForm.value.phone.trim()
  if (!resolveBindPhonePattern().test(phone)) {
    message.warning('请输入有效的手机号')
    isBindLoading.value = false
    return
  }
  const ok = await userStore.sendPhoneCode(buildBindPhonePayload(phone))
  if (ok) {
    startBindCountdown()
  }
  isBindLoading.value = false
}

const submitBindPhone = async () => {
  const code = bindPhoneForm.value.code.trim()
  const phone = bindPhoneForm.value.phone.trim()
  if (!code || code.length !== 6) {
    message.warning('请输入6位验证码')
    return
  }
  if (!resolveBindPhonePattern().test(phone)) {
    message.warning('请输入有效的手机号')
    return
  }
  isBindLoading.value = true
  const ok = await userStore.bindPhone(buildBindPhonePayload(phone), code)
  isBindLoading.value = false
  if (!ok) return
  closeBindPhoneModal()
}

const openBindEmailModal = () => {
  bindEmailStep.value = 'email'
  bindEmailForm.value = { email: '', code: '' }
  showBindEmailModal.value = true
}

const closeBindEmailModal = () => {
  showBindEmailModal.value = false
  bindEmailStep.value = 'email'
  bindEmailForm.value = { email: '', code: '' }
  bindEmailFormRef.value?.clearValidate()
}

const backToBindEmailStep = () => {
  bindEmailStep.value = 'email'
  bindEmailForm.value.code = ''
}

const goBindEmailNext = async () => {
  isBindEmailLoading.value = true
  try {
    await bindEmailFormRef.value?.validateFields(['email'])
  } catch {
    isBindEmailLoading.value = false
    return
  }
  bindEmailStep.value = 'code'
  bindEmailForm.value.code = ''
  const ok = await userStore.sendEmailCode(bindEmailForm.value.email.trim())
  isBindEmailLoading.value = false
  if (!ok) return
  message.info('绑定邮箱提交接口暂未开放，当前为流程演示')
}

const submitBindEmail = () => {
  if (!bindEmailForm.value.code || bindEmailForm.value.code.trim().length !== 6) {
    message.warning('请输入6位验证码')
    return
  }
  message.info('绑定邮箱接口暂未开放，暂无法提交绑定')
}

onBeforeUnmount(() => {
  if (cropperImageUrl.value) {
    URL.revokeObjectURL(cropperImageUrl.value)
  }
  if (bindCountdownTimer) {
    clearInterval(bindCountdownTimer)
    bindCountdownTimer = null
  }
})
</script>

<style scoped>
/* 全局容器 */
.profile-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
}

.profile-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* 顶部头部卡片 */
.profile-header-card {
  background: var(--glass-surface);
  border-radius: 16px;
  padding: 24px 32px;
  margin-bottom: 24px;
  border: 1px solid var(--glass-border);
  position: relative;
  animation: slideUp 0.5s ease backwards;
}

.profile-header-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.profile-identity-row {
  display: flex;
  align-items: center;
  gap: 32px;
}

/* 头像区域 */
.avatar-section {
  position: relative;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  animation: bounceIn 0.6s ease backwards;
}

.avatar-wrapper {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--accent-blue);
  transition: all 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar-image {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-wrapper :deep(.ant-image),
.avatar-wrapper :deep(.ant-image-img),
.avatar-wrapper :deep(.ant-image img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

:deep(.ant-image img) {
  aspect-ratio: 1 / 1 !important;
}

.avatar-edit-btn {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-blue);
  border: 2px solid var(--glass-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.avatar-edit-btn:hover {
  transform: scale(1.1);
  background: var(--accent-purple);
}

.avatar-file-input {
  display: none;
}

/* 用户基础信息 */
.user-basic-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.1s;
}

/* 右侧算力点区域 */
.user-right-section {
  display: flex;
  align-items: center;
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.2s;
}

/* 昵称行 */
.nickname-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--glass-surface-hover);
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
}

.nickname-badge :deep(.anticon) {
  font-size: 12px;
}

/* 登录时间 */
.login-time-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.login-time-row :deep(.anticon) {
  font-size: 13px;
}

.username {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* 昵称编辑按钮 */
.nickname-edit-btn {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nickname-edit-btn:hover {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

/* 算力点显示 */
.points-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15));
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.points-display:hover {
  transform: translateY(-2px);
  border-color: rgba(251, 191, 36, 0.5);
}

.points-circle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
}

.points-circle svg {
  color: white;
}

.points-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.points-arrow {
  color: var(--text-tertiary);
  font-size: 12px;
}

.points-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.points-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 主体内容网格 */
.profile-body {
  width: 100%;
}

.profile-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

/* 左侧侧边栏 */
.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 卡片通用样式 */
:deep(.ant-card) {
  border-radius: 14px;
  transition: all 0.25s ease;
  border: 1px solid var(--glass-border);
}

:deep(.ant-card):hover {
  transform: translateY(-2px);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--glass-border);
  position: relative;
}

.card-title::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 24px;
  height: 2px;
  background: var(--accent-blue);
  border-radius: 1px;
}

/* 统计卡片 */
.stats-card {
  padding: 20px;
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.15s;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--glass-surface-hover);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: var(--glass-border);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

/* 账户安全卡片 */
.security-card {
  padding: 20px;
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.25s;
}

.security-actions {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--glass-border);
}

.change-pwd-btn {
  background: var(--accent-blue) !important;
  border: none !important;
  font-weight: 500 !important;
  height: 40px !important;
  border-radius: 10px !important;
}

.change-pwd-btn:hover {
  background: var(--accent-purple) !important;
}

/* 右侧内容区域 */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 详细信息卡片 */
.details-card {
  padding: 20px;
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.2s;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.detail-item:hover {
  background: var(--glass-surface-hover);
  margin: 0 -8px;
  padding: 14px 8px;
  border-radius: 8px;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.bind-phone-link {
  padding: 0;
  height: auto;
  color: var(--accent-blue);
  font-weight: 500;
  font-size: 13px;
}

.bind-phone-link:hover {
  color: var(--accent-purple);
}

/* 账户设置卡片 */
.settings-card {
  padding: 20px;
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.3s;
}

/* 绑定手机/邮箱弹窗 */
.bind-phone-section {
  margin-top: 8px;
}

.bind-area-code-select {
  width: 76px;
}

.bind-area-code-select :deep(.ant-select-selector) {
  border: none !important;
  box-shadow: none !important;
  padding-left: 0 !important;
}

.bind-email-autocomplete {
  width: 100%;
}

.bind-email-input {
  width: 100%;
}

.bind-step-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.bind-code-row {
  display: flex;
  gap: 10px;
}

.bind-code-row :deep(.ant-input) {
  width: 100%;
}

.phone-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--glass-surface-hover);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
}

.info-value {
  color: var(--text-primary);
  font-weight: 600;
}

.back-btn {
  color: var(--accent-blue);
  cursor: pointer;
  font-size: 13px;
}

.back-btn:hover {
  text-decoration: underline;
}

.code-input-section {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.resend-container {
  text-align: center;
}

.resend-link {
  color: var(--accent-blue);
  cursor: pointer;
  font-size: 13px;
}

.resend-link.disabled {
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.email-code-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.email-code-tip {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.email-code-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.email-code-back {
  font-size: 12px;
  color: var(--accent-blue);
  cursor: pointer;
}

.email-code-validity {
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 修改密码弹窗样式 */
:deep(.pwd-form) {
  margin-top: 16px;
}

:deep(.pwd-form .ant-form-item) {
  margin-bottom: 20px;
}

/* 动画定义 */
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
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式适配 */
@media (max-width: 992px) {
  .profile-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .profile-sidebar {
    order: 2;
  }

  .profile-content {
    order: 1;
  }
}

@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }

  .profile-header-card {
    padding: 20px;
  }

  .profile-identity-row {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .username {
    font-size: 22px;
  }

  .nickname-wrapper {
    justify-content: center;
    flex-wrap: wrap;
  }

  .nickname-edit-container {
    flex-direction: column;
    width: 100%;
  }

  .detail-item {
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .profile-page {
    padding: 12px;
  }

  .profile-header-card {
    padding: 16px;
    border-radius: 14px;
  }

  .username {
    font-size: 20px;
  }

  .avatar-section {
    width: 72px;
    height: 72px;
  }

  .avatar-wrapper {
    width: 72px;
    height: 72px;
  }

  .avatar-image {
    width: 72px;
    height: 72px;
  }
}
</style>