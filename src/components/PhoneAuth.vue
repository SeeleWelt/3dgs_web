<template>
  <div class="phone-auth-section">
    <!-- 步骤1：手机号输入区域 -->
    <div v-if="currentStep === 'phone'" class="step-container">
      <a-form
        ref="phoneFormRef"
        :model="phoneForm"
        :rules="phoneRules"
        layout="vertical"
        class="form-fields"
      >
        <a-form-item
          name="phone"
          :label="t('login.phone') || '手机号'"
          class="form-group"
        >
          <a-input
            v-model:value="phoneForm.phone"
            type="tel"
            class="form-input phone-input"
            @keypress.enter="sendVerificationCode"
          >
            <template #prefix>
              <a-select
                v-model:value="selectedAreaCode"
                class="area-code-select"
                @change="handleAreaCodeChange"
              >
                <a-select-option value="+86">
                  <span class="flag-option"><span class="fi fi-cn"></span> +86</span>
                </a-select-option>
                <a-select-option value="+1">
                  <span class="flag-option"><span class="fi fi-us"></span> +1</span>
                </a-select-option>
                <a-select-option value="+44">
                  <span class="flag-option"><span class="fi fi-gb"></span> +44</span>
                </a-select-option>
                <a-select-option value="+81">
                  <span class="flag-option"><span class="fi fi-jp"></span> +81</span>
                </a-select-option>
                <a-select-option value="+49">
                  <span class="flag-option"><span class="fi fi-de"></span> +49</span>
                </a-select-option>
                <a-select-option value="+33">
                  <span class="flag-option"><span class="fi fi-fr"></span> +33</span>
                </a-select-option>
                <a-select-option value="+7">
                  <span class="flag-option"><span class="fi fi-ru"></span> +7</span>
                </a-select-option>
                <a-select-option value="+34">
                  <span class="flag-option"><span class="fi fi-es"></span> +34</span>
                </a-select-option>
              </a-select>
            </template>
          </a-input>
        </a-form-item>
      </a-form>

      <a-button
        type="primary"
        class="btn btn-full"
        :loading="isLoading"
        :disabled="!isPhoneValid"
        @click="sendVerificationCode"
      >
        {{ t('login.getCode') || '获取验证码' }}
      </a-button>
    </div>

    <!-- 步骤2：验证码输入区域 -->
    <div v-if="currentStep === 'code'" class="step-container" :class="{ 'is-loading': isLoading }">
      <!-- 手机号信息展示 -->
      <div class="phone-info">
        <span class="info-value">{{ selectedAreaCode }} {{ phoneForm.phone }}</span>
        <a class="back-btn" @click="backToPhoneStep">{{ t('login.back') || '返回修改' }}</a>
      </div>

      <!-- 验证码输入框 -->
      <div class="code-input-section">
        <SmsCodeInput
          @update="onCodeChange"
          @complete="onCodeComplete"
          @enter="handlePhoneAuth"
          :length="6"
          class="verification-input"
        />
      </div>

      <!-- 倒计时/重新发送 链接样式，居中 -->
      <div class="resend-container">
        <a
          class="resend-link"
          :class="{ disabled: countdown > 0 }
          "
          @click.prevent="countdown <= 0 && resendVerificationCode()"
        >
          <span v-if="countdown > 0">{{ countdown }}s {{ t('login.resend') || '后重发' }}</span>
          <span v-else>{{ t('login.resendCode') || '重新发送验证码' }}</span>
        </a>
      </div>

      <!-- 提交按钮 -->
      <a-button
        type="primary"
        class="btn btn-full"
        :loading="isLoading"
        :disabled="!verificationCode"
        @click="handlePhoneAuth"
      >
        {{ t('login.submit') || '提交验证' }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
// 引入验证码输入插件
import SmsCodeInput from './SmsCodeInput.vue'
import API from '@/utils/api'
import { ApiServer } from '@/utils/taskService'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

// 定义 props
const props = defineProps<{
  agree?: boolean
  shareCode?: string
}>()

// 定义 emit
const emit = defineEmits<{
  (e: 'require-agree', payload: string): void
}>()

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
// 步骤控制：phone（手机号输入）/ code（验证码输入）
const currentStep = ref('phone')
const phoneFormRef = ref()
const isLoading = ref(false)
const countdown = ref(0)
const selectedAreaCode = ref('+86')
// 验证码存储（独立于phoneForm，因为插件是独立输入）
const verificationCode = ref('')
let timer = ref<NodeJS.Timeout>()
const conuntTime = 60
const SHARE_CODE_COOKIE = 'shareCode'

const clearCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
}
const resolveRequestErrorMessage = (err: any, defaultMessage: string) => {
  if (err?.message && String(err.message).length > 0) {
    return String(err.message)
  }

  switch (err?.statusCode) {
    case 400:
      return '请求错误，请检查输入'
    case 401:
      return '未授权，请重新登录'
    case 402:
      return '验证码错误'
    case 429:
      return '请求过于频繁，请稍后再试'
    case 500:
      return '服务器错误，请稍后重试'
    default:
      return defaultMessage
  }
}

const phoneForm = ref({
  phone: '',    
  code: ''
})

// 手机号格式验证规则映射
const phonePatterns = {
  '+86': /^1[3-9]\d{9}$/, // 中国大陆手机号
  '+1': /^\d{10}$/, // 美国手机号
  '+44': /^\d{10,11}$/, // 英国手机号
  '+81': /^\d{10,11}$/, // 日本手机号
  '+49': /^\d{10,11}$/, // 德国手机号
  '+33': /^\d{9,10}$/, // 法国手机号
  '+7': /^\d{10}$/, // 俄罗斯手机号
  '+34': /^\d{9}$/ // 西班牙手机号
}

// 手机号验证错误消息映射
const phoneErrorMessages = {
  '+86': '请输入有效的中国大陆手机号',
  '+1': '请输入有效的美国手机号',
  '+44': '请输入有效的英国手机号',
  '+81': '请输入有效的日本手机号',
  '+49': '请输入有效的德国手机号',
  '+33': '请输入有效的法国手机号',
  '+7': '请输入有效的俄罗斯手机号',
  '+34': '请输入有效的西班牙手机号'
}

// 计算属性：检查手机号是否有效
const isPhoneValid = computed(() => {
  const pattern = phonePatterns[selectedAreaCode.value as keyof typeof phonePatterns]
  return pattern && pattern.test(phoneForm.value.phone)
})

// 表单验证规则（仅用于手机号验证）
const phoneRules = ref({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (!value) return Promise.resolve()
        const pattern = phonePatterns[selectedAreaCode.value as keyof typeof phonePatterns]
        if (!pattern || !pattern.test(value)) {
          const msg = t('login.invalidPhone') || phoneErrorMessages[selectedAreaCode.value as keyof typeof phoneErrorMessages] || '请输入有效的手机号'
          return Promise.reject(new Error(msg))
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
})

// 监听area-code变化，重新验证手机号
const handleAreaCodeChange = () => {
  if (phoneFormRef.value) {
    phoneFormRef.value.validateFields(['phone'])
  }
}

// 验证码输入变化回调
const onCodeChange = (code: string) => {
  verificationCode.value = code
}

// 验证码输入完成回调
const onCodeComplete = (code: string) => {
  verificationCode.value = code
  // 可选：输入完成后自动提交
  // handlePhoneAuth()
}

// 返回手机号输入步骤
const backToPhoneStep = () => {
  currentStep.value = 'phone'
  verificationCode.value = ''
  // 清除倒计时
  countdown.value = 0
}

// 发送验证码（第一次或切换手机号时调用，包含验证）
const sendVerificationCode = async () => {
  if (!props.agree) {
    emit('require-agree', 'sendCode')
    return
  }
  // 已发送且仍在倒计时，则不重复发送
  if (countdown.value > 0) return
  // 先验证手机号表单
  if (!phoneFormRef.value) return
  isLoading.value = true
  try {
    await phoneFormRef.value.validate()
    if (!isPhoneValid.value) {
      message.error(t('login.invalidPhone') || '请输入有效的手机号')
      return
    }

    await ApiServer.request({
      method: 'post',
      url: API.SEND_CODE,
      data: { phone: phoneForm.value.phone }
    })
    currentStep.value = 'code'
    // 启动倒计时
    countdown.value = conuntTime
    timer.value = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer.value)
      }
    }, 1000)

    message.success(t('login.codeSentSuccess') || '验证码已发送')

  } catch (error: any) {
    currentStep.value = 'phone'
    clearInterval(timer.value)
    countdown.value = 0
    message.error(resolveRequestErrorMessage(error, t('login.phoneValidateFailed') || '手机号验证失败，请检查输入'))
    return
  }finally {
    isLoading.value = false
  }
}

// 重新发送验证码（无需再次验证手机号，只要有原号码）
const resendVerificationCode = async () => {
  if (!props.agree) {
    emit('require-agree', 'resendCode')
    return
  }
  if (countdown.value > 0) return
  isLoading.value = true
  try {
 
    await ApiServer.request({
      method: 'post',
      url: API.SEND_CODE,
      data: { phone: phoneForm.value.phone }
    })
       // 保持在 code 步骤
    currentStep.value = 'code'
    countdown.value = conuntTime
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    message.success(t('login.codeSentSuccess') || '验证码已发送')
    
  } catch (error: any) {
    message.error(resolveRequestErrorMessage(error, t('login.phoneValidateFailed') || '手机号验证失败，请检查输入'))
  } finally {
    isLoading.value = false
  }
}

// 处理手机号+验证码验证提交
const handlePhoneAuth = async () => {
  // 检查是否同意服务条款
  if (!props.agree) {
    emit('require-agree', 'login');
    return
  }

  if (!verificationCode.value || verificationCode.value.length !== 6) {
    message.error(t('login.enter6DigitCode') || '请输入6位验证码')
    return
  }

  isLoading.value = true
  try {
    // 组装提交数据：区号+手机号+验证码
    const submitData = {
      areaCode: selectedAreaCode.value,
      phone: phoneForm.value.phone,
      code: verificationCode.value
    }
    console.log('提交验证数据：', submitData)
    const success = await userStore.phoneLogin(
      submitData.areaCode,
      submitData.phone,
      submitData.code,
      props.shareCode
    )
    if (success) {
      clearCookie(SHARE_CODE_COOKIE)
      router.push('/') // 登录成功后跳转到首页或其他页面
    }
  } finally {
    isLoading.value = false
  }
}

// 暴露方法供父组件调用
defineExpose({
  handlePhoneAuth,
  isPhoneValid,
  phoneForm,
  currentStep,
  backToPhoneStep,
  sendVerificationCode,
  resendVerificationCode,
  isLoading
})
</script>

<style scoped>
.phone-auth-section {
  width: 100%;
}

.step-container {
  width: 100%;
  position: relative;
}

.step-container.is-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(1px);
  border-radius: 8px;
  z-index: 10;
}

.form-fields {
  display: flex;
  flex-direction: column;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.phone-input {
  width: 80%;
  margin: 0 auto;
}

.area-code-select {
  border: none;
  background: transparent;
  z-index: 1;
}

/* 国旗选项样式 */
.flag-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.flag-option .fi {
  font-size: 16px;
}

/* 下拉菜单中的国旗 */
:deep(.ant-select-item-option-content .flag-option) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

:deep(.ant-select-item-option-content .fi) {
  font-size: 18px;
}

:deep(.area-code-select .ant-select-selector) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.area-code-select .ant-select-selection-item) {
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  color: #1a1a1a;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  position: relative;
  padding: 12px 16px;
}

.form-input:focus {
  background: #ffffff;
  border-color: #00c6ff;
  box-shadow: none;
}

.form-input:hover {
  border-color: #00c6ff;
}

.form-input::placeholder {
  color: #aaa;
}

/* 手机号信息展示样式 */
.phone-info {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 10px;
}

/* 重新发送链接样式 */
.resend-container {
  text-align: center;
  margin-bottom: 20px;
}
.resend-link {
  font-size: 13px;
  color: #0072ff;
  cursor: pointer;
  text-decoration: none;
}
.resend-link.disabled {
  color: #999;
  cursor: default;
}
.resend-link:hover:not(.disabled) {
  text-decoration: underline;
}

.info-label {
  font-size: 13px;
  color: #666;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.back-btn {
  font-size: 13px;
  color: #0072ff;
  cursor: pointer;
  text-decoration: none;
}

.back-btn:hover {
  color: #0058d9;
}

/* 验证码输入区域样式 */
.code-input-section {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.code-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

:deep(.verification-input) {
  display: flex;
  justify-content: center;
  width: 100%;
}

:deep(.verification-input .sms-code-input) {
  margin: 0 auto;
}

:deep(.verification-input .code-input-wrapper) {
  margin: 0 auto;
}

:deep(.verification-input input) {
  width: 40px !important;
  height: 40px !important;
  margin: 0 4px !important;
  border: 1px solid #e8e8e8 !important;
  border-radius: 8px !important;
  text-align: center !important;
  font-size: 18px !important;
  font-weight: 500 !important;
}

:deep(.verification-input input:focus) {
  border-color: #00c6ff !important;
  box-shadow: 0 0 0 2px rgba(0, 198, 255, 0.2) !important;
  outline: none !important;
}

:deep(.ant-btn){
  height:auto;
}
/* 按钮通用样式 */
.btn {
  width: 100%;
  padding: 14px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 114, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-full {
  margin-top: 8px;
}

:deep(.ant-form-item-explain-error) {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 4px;
}
</style>