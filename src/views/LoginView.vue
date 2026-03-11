<template>
  <div class="login-page" :data-theme="themeStore.appliedTheme">
    <!-- Left Side - Showcase -->
    <div class="login-showcase">
      <div class="showcase-content">
        <div class="showcase-carousel">
          <div 
            class="carousel-slide"
            v-for="(slide, index) in slides"
            :key="index"
            :class="{ active: currentSlide === index }"
          >
            <div class="slide-info">
              <h2>{{ slide.title }}</h2>
            </div>
          </div>
        </div>
        
        <div class="carousel-dots">
          <span 
            v-for="(_, index) in slides" 
            :key="index"
            class="dot"
            :class="{ active: currentSlide === index }"
            @click="goToSlide(index)"
          />
        </div>
      </div>
    </div>

    <!-- Right Side - Auth Forms -->
    <div class="auth-container" >
      
      <!-- Back Button (for register/login forms) -->
      <button v-if="currentView !== 'welcome'" class="back-btn" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        {{ t('login.back') }}
      </button>
      <div class="auth-mode-switch-content">
          <a-tooltip :title="modeTooltip" placement="leftTop" color="#5d86f7" v-if="currentView === 'welcome'">
            <div class="corner-img-wrapper" @click="handleChangeMode">
              <!-- 账号图标  -->
              <UserOutlined class="corner-img account-img" v-if="currentMode==='qr'"/>
              <!-- 二维码图片 -->
              <QrcodeOutlined class="corner-img account-img" v-else-if="currentMode==='account'"/>
            </div>
          </a-tooltip>
              <div class="auth-wrapper" v-if="currentMode === 'account'">
        <!-- Welcome View -->
        <div v-if="currentView === 'welcome'" class="auth-view welcome-view">
          <div class="login-logo">
            <img src="/logo/MetaST_logo_500x500.svg" alt="MetaST" class="login-logo-image">
            <h1>{{ t('login.welcome') }}</h1>
          </div>

          <div class="auth-buttons">
            <button class="btn btn-primary" @click="currentView = 'register'">
              {{ t('login.register') }}
            </button>
            <button class="btn btn-secondary" @click="currentView = 'login'">
              {{ t('login.login') }}
            </button>
            <button class="btn btn-secondary" @click="currentView = 'phoneAuth'">
              {{ t('login.phoneAuth') }}
            </button>
          </div>

          <div class="divider">
            <span>{{ t('login.or') }}</span>
          </div>

          <SocialLogin
            @google-success="handleGoogleCredential"
            @google-error="handleGoogleError"
          />

          <p class="terms">
            {{ t('login.terms') }} <a href="#">{{ t('login.termsLink') }}</a> {{ t('login.and') }} <a href="#">{{ t('login.privacyLink') }}</a>
          </p>
        </div>

        <!-- Register View -->
        <div v-if="currentView === 'register'" class="auth-view form-view">
          <h2 class="form-title">{{ t('login.registerTitle') }}</h2>
          <p class="form-subtitle">
            {{ isEmailCodeStep ? '请输入邮箱验证码，输入完成后将自动注册' : t('login.registerSubtitle') }}
          </p>

          <!-- Ant Design Vue 注册表单 -->
          <a-form
            v-if="!isEmailCodeStep"
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            layout="vertical"
            class="form-fields"
          >
            <a-form-item
              name="email"
              :label="t('login.email')"
              class="form-group"
            >
              <a-auto-complete
                v-model:value="registerForm.email"
                :options="registerEmailOptions"
                :filter-option="false"
                class="email-autocomplete"
              >
                <a-input
                  type="email"
                  :placeholder="t('login.emailPlaceholder')"
                  class="form-input"
                />
              </a-auto-complete>
            </a-form-item>
            <a-form-item
              name="password"
              :label="t('login.password')"
              class="form-group password-group"
            >
              <a-input-password
                v-model:value="registerForm.password"
                :placeholder="t('login.passwordPlaceholder')"
                class="form-input"
              />
              <a-tooltip :title="t('login.passwordTooltip')">
                <span class="info-icon" aria-hidden="true">
                  <InfoCircleOutlined />
                </span>
              </a-tooltip>
            </a-form-item>
              <a-form-item
                name="confirmPassword"
                :label="t('login.confirmPassword')"
                class="form-group"
              >
                <a-input-password
                  v-model:value="registerForm.confirmPassword"
                  :placeholder="t('login.confirmPasswordPlaceholder')"
                  class="form-input"
                />
              </a-form-item>
          </a-form>

          <button v-if="!isEmailCodeStep" class="btn btn-primary btn-full" :disabled="isLoading" @click="handleRegister">
            {{ isLoading ? '发送中...' : '发送邮箱验证码' }}
          </button>

          <div v-if="isEmailCodeStep" class="email-code-section">
            <div class="email-code-head">
              <p class="email-code-tip">验证码已发送至 {{ pendingRegister.email }}</p>
              <a class="email-code-back" href="#" @click.prevent="backToEmailForm">返回修改邮箱</a>
            </div>
            <p class="email-code-validity">验证码 10 分钟内有效</p>
            <EmailInputCode
              v-model="emailCode"
              :length="6"
              :disabled="isLoading"
              @complete="handleEmailCodeComplete"
              @enter="handleEmailCodeEnter"
            />
          </div>

          <p class="switch-text">
            {{ t('login.hasAccount') }}<a href="#" @click.prevent="currentView = 'login'">{{ t('login.login') }}</a>
          </p>

          <div class="divider">
            <span>{{ t('login.or') }}</span>
          </div>

          <SocialLogin
            @google-success="handleGoogleCredential"
            @google-error="handleGoogleError"
          />
        </div>

        <!-- Login View -->
        <div v-if="currentView === 'login'" class="auth-view form-view">
          <h2 class="form-title">{{ t('login.loginTitle') }}</h2>
          <p class="form-subtitle">{{ t('login.loginSubtitle') }}</p>

          <!-- Ant Design Vue 登录表单 -->
          <a-form
            ref="loginFormRef"
            :rules="loginRules"
            :model="loginForm"
            layout="vertical"
            class="form-fields"
          >
            <a-form-item
              name="email"
              :label="t('login.email')"
              class="form-group"
            >
              <a-auto-complete
                v-model:value="loginForm.email"
                :options="loginEmailOptions"
                :filter-option="false"
                class="email-autocomplete"
              >
                <a-input
                  type="email"
                  :placeholder="t('login.emailPlaceholder')"
                  class="form-input"
                />
              </a-auto-complete>
            </a-form-item>
            <a-form-item
              name="password"
              :label="t('login.password')"
              class="form-group"
            >
              <div class="password-wrapper">
                <a-input-password
                  v-model:value="loginForm.password"
                  :placeholder="t('login.passwordPlaceholder')"
                  class="form-input"
                  @keydown.enter="handleLogin"
                />
                <a href="#" class="forgot-link">{{ t('login.forgotPassword') }}</a>
              </div>
            </a-form-item>
          </a-form>

          <button class="btn btn-primary btn-full" :disabled="isLoading" @click="handleLogin">
            {{ isLoading ? t('login.loggingIn') : t('login.login') }}
          </button>

          <p class="switch-text">
            {{ t('login.noAccount') }}<a href="#" @click.prevent="currentView = 'register'">{{ t('login.register') }}</a>
          </p>

          <div class="divider">
            <span>{{ t('login.or') }}</span>
          </div>

          <SocialLogin
            @google-success="handleGoogleCredential"
            @google-error="handleGoogleError"
          />
        </div>

        <!-- Phone Auth View -->
        <div v-if="currentView === 'phoneAuth'" class="auth-view form-view">
          <h2 class="form-title">{{ t('login.phoneAuthTitle') }}</h2>
          <p class="form-subtitle">{{ t('login.phoneAuthSubtitle') }}</p>
          <PhoneAuth />

          <div class="divider">
            <span>{{ t('login.or') }}</span>
          </div>

          <SocialLogin
            @google-success="handleGoogleCredential"
            @google-error="handleGoogleError"
          />
        </div>  
      </div>

      <div class="auth-qr" v-else-if = "currentMode === 'qr'">
        <WechatQrLogin />
      </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '../stores/theme'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import {
  InfoCircleOutlined,
  QrcodeOutlined,
  UserOutlined
} from '@ant-design/icons-vue';
import PhoneAuth from '@/components/PhoneAuth.vue'
import WechatQrLogin from '@/components/WechatQrLogin.vue'
import EmailInputCode from '@/components/EmailInputCode.vue'
import SocialLogin from '@/components/SocialLogin.vue'
import API from '@/utils/api'
import { ApiServer } from '@/utils/taskService'

const router = useRouter()
const { t } = useI18n() 
const themeStore = useThemeStore()
const userStore = useUserStore()

const currentMode = ref<'account' | 'qr'>('account')
const currentView = ref<'welcome' | 'register' | 'login' | 'phoneAuth'>('welcome')
const currentSlide = ref(0)
const isLoading = ref(false)
const isEmailCodeStep = ref(false)
const emailCode = ref('')
const pendingRegister = ref<{ email: string; password: string }>({ email: '', password: '' })
// const googleAuthUrl = 'https://localhost:6026/api/auth/google/verify'
const googleAuthUrl = 'https://szgm.tenyunn.com:50585/api/auth/google/verify'

// 表单引用
const registerFormRef = ref()
const loginFormRef = ref()

// 注册表单数据
const registerForm = ref({
  email: '',
  password: '',
  confirmPassword: ''
})

// 登录表单数据
const loginForm = ref({
  email: '',
  password: ''
})

const EMAIL_SUFFIXES = [
  'gmail.com',
  'qq.com',
  '163.com',
  '126.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'yahoo.com',
]

const buildEmailOptions = (rawValue: string) => {
  const value = (rawValue || '').trim()
  if (!value) return []

  if (!value.includes('@')) {
    return EMAIL_SUFFIXES.map((suffix) => ({ value: `${value}@${suffix}` }))
  }

  const [localPart, domainPart = ''] = value.split('@')
  if (!localPart) return []

  return EMAIL_SUFFIXES
    .filter((suffix) => suffix.toLowerCase().startsWith(domainPart.toLowerCase()))
    .map((suffix) => ({ value: `${localPart}@${suffix}` }))
}

const registerEmailOptions = computed(() => buildEmailOptions(registerForm.value.email))
const loginEmailOptions = computed(() => buildEmailOptions(loginForm.value.email))

// 注册表单验证规则
const loginRules = ref({
  email: [
    { required: true, message: t('login.requiredEmail'), trigger: 'blur' },
    { type: 'email', message: t('login.invalidEmail') || '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('login.requiredPassword'), trigger: 'blur' },
  ]
})

// 注册表单验证规则
const registerRules = ref({
  email: [
    { required: true, message: t('login.requiredEmail'), trigger: 'blur' },
    { type: 'email', message: t('login.invalidEmail') || '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('login.requiredPassword'), trigger: 'blur' },
    { min: 8, max: 16, message: t('login.passwordRange') || '密码长度应为8-16位', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/, message: t('login.passwordRule') || '密码必须包含大写字母、小写字母和数字', trigger: 'blur' }
  ]
  ,
  confirmPassword: [
    { required: true, message: t('login.requiredConfirmPassword') || '请确认密码', trigger: 'blur' },
    {
      validator(_: any, value: string) {
        if (value !== registerForm.value.password) {
          return Promise.reject(new Error(t('login.confirmPasswordMismatch') || '两次输入的密码不一致'))
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
})

const slides = [
  { title: 'Start\n3D Scanning\nfor Game' },
  { title: 'Start\n3D Scanning\nfor' },
  { title: 'Start\n3D Scanning\nfor 3D Printing' }
]

let autoPlayInterval: ReturnType<typeof setInterval> | null = null

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}

const goToSlide = (index: number) => {
  currentSlide.value = index
  resetAutoPlay()
}

const resetAutoPlay = () => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
  }
  autoPlayInterval = setInterval(nextSlide, 5000)
}

const handleChangeMode = () => {
  currentMode.value = currentMode.value === 'account' ? 'qr' : 'account'
}

const modeTooltip = computed(() =>
  currentMode.value === 'account' ? t('login.scanLogin') : t('login.accountLogin')
)

const getStatusCode = (error: any) => error?.status ?? error?.statusCode ?? error?.response?.status

const goBack = () => {
  currentView.value = 'welcome'
  // 重置表单
  registerForm.value = { email: '', password: '', confirmPassword: '' }
  loginForm.value = { email: '', password: '' }
  isEmailCodeStep.value = false
  emailCode.value = ''
  pendingRegister.value = { email: '', password: '' }
  if (registerFormRef.value) registerFormRef.value.resetFields()
  if (loginFormRef.value) loginFormRef.value.resetFields()
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  // 简单验证
  try {
    await loginFormRef.value.validate()
  } catch (error) {
    // 验证失败不做处理，Ant Design Vue 会自动显示错误提示
    return
  }

  isLoading.value = true
  try {
    await userStore.emailLogin(loginForm.value.email, loginForm.value.password)
    router.push('/')
  } catch (err: any) {
    if (err && err.isNetworkError) {
      message.error(t('login.networkError') || '网络错误，请检查您的网络连接')
    } else {
      const status = getStatusCode(err)
      if (status === 400) {
        message.error('邮件格式错误')
      } else if (status === 401) {
        message.error('错误的邮箱或密码')
      } else if (status === 430) {
        message.error('账号已被封禁')
      } else if (status === 432) {
        message.error('账号已注销，无法登录')
      } else {
        message.error(err?.message || t('login.loginFailed') || '登录失败，请检查您的邮箱和密码')
      }
    }
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    const values = await registerFormRef.value.validate()

    isLoading.value = true
    await ApiServer.request({
      url: API.SEND_EMAIL,
      method: 'post',
      data: {
        email: values.email
      }
    })

    pendingRegister.value = {
      email: values.email,
      password: values.password
    }
    emailCode.value = ''
    isEmailCodeStep.value = true
    message.success('验证码已发送，请查收邮箱')
  } catch (error) {
    const err: any = error

    if (err?.errorFields) {
      return
    }

    const status = getStatusCode(err)
    if (status === 400) {
      message.error('邮件格式错误')
    } else if (status === 429) {
      message.error('发送邮件过于频繁')
    } else {
      message.error(err?.message || '验证码发送失败，请稍后重试')
    }
  } finally {
    isLoading.value = false
  }
}

const submitEmailRegister = async (code: string) => {
  if (isLoading.value) return
  if (!pendingRegister.value.email || !pendingRegister.value.password) return
  if (!code || code.length !== 6) {
    message.warning('请输入6位邮箱验证码')
    return
  }

  isLoading.value = true
  try {
    await userStore.emailRegister(pendingRegister.value.email, pendingRegister.value.password, code)
    message.success(t('login.registerSuccess') || '注册成功，请登录')
    currentView.value = 'login'
    loginForm.value.email = pendingRegister.value.email
    loginForm.value.password = ''
    isEmailCodeStep.value = false
    emailCode.value = ''
    pendingRegister.value = { email: '', password: '' }
  } catch (error: any) {
    if (error && error.isNetworkError) {
      message.error(t('login.networkError') || '网络错误，请检查您的网络连接')
    } else {
      const status = getStatusCode(error)
      if (status === 400) {
        message.error('邮件格式错误')
      } else if (status === 401) {
        message.error('验证码错误或已过期')
      } else if (status === 402) {
        message.error('邮箱已注册')
      } else if (status === 421) {
        message.error('密码必须至少8个字符，包含大写字母、小写字母和数字')
      } else {
        message.error(error?.message || t('login.registerFailed') || '注册失败，请稍后再试')
      }
    }
  } finally {
    isLoading.value = false
  }
}

const handleEmailCodeComplete = async (code: string) => {
  await submitEmailRegister(code)
}

const handleEmailCodeEnter = async (code: string) => {
  await submitEmailRegister(code)
}

const backToEmailForm = () => {
  if (isLoading.value) return
  isEmailCodeStep.value = false
  emailCode.value = ''
  pendingRegister.value = { email: '', password: '' }
}

const persistGoogleUser = (payload: { token?: string; user?: Record<string, any> }) => {
  const token = payload?.token
  const user = { ...(payload?.user || { headimg: payload.headimg, nickname: payload.nickname, point: payload.point, username: payload.username }), ...(token ? { token } : {}) }

  if (token) {
    localStorage.setItem('token', token)
  }

  localStorage.setItem('user', JSON.stringify(user))
  userStore.init()
}

const handleGoogleCredential = async ({ credential }: { credential: string }) => {
  if (!credential || isLoading.value) return

  isLoading.value = true
  try {
    const response = await fetch(googleAuthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.message || `Google login failed (${response.status})`)
    }

    const payload = await response.json()
    console.log('Google login successful, payload:', payload)
    persistGoogleUser(payload)
    router.push('/')
  } catch (error: any) {
    message.error(error?.message || t('login.loginFailed') || '登录失败')
  } finally {
    isLoading.value = false
  }
}

const handleGoogleError = ({ message: errorMessage }: { message: string }) => {
  if (errorMessage) {
    message.error(errorMessage)
  }
}

onMounted(() => {
  resetAutoPlay()
  themeStore.init()
})

watch(
  () => currentView.value,
  (view) => {
    if (view !== 'register') {
      isEmailCodeStep.value = false
      emailCode.value = ''
      pendingRegister.value = { email: '', password: '' }
    }
  }
)

onUnmounted(() => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
  }
})
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: #ffffff;
}

/* Left Side - Showcase */
.login-showcase {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 198, 255, 0.05), rgba(0, 114, 255, 0.05));
  position: relative;
  overflow: hidden;
}

.showcase-content {
  width: 100%;
  max-width: 500px;
  padding: 40px;
}

.showcase-carousel {
  position: relative;
  height: 300px;
  margin-bottom: 40px;
}

.carousel-slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  opacity: 0;
  transform: translateX(30px);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-slide.active {
  opacity: 1;
  transform: translateX(0);
}

.slide-info h2 {
  font-size: 56px;
  font-weight: 700;
  line-height: 1.2;
  color: #1a1a1a;
  white-space: pre-line;
}

.carousel-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  width: 24px;
  border-radius: 4px;
  background: #00c6ff;
}

/* Right Side - Auth */
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  background: #ffffff;
}

.auth-mode-switch-content{
  position: relative;
  width: 444px;
  height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 半角图片核心样式 */
.corner-img-wrapper {
  position: absolute;
  top:-40px;
  right: 0;
  padding: 5px;
  width: 60px;
  height: 60px;
  overflow: hidden;
  clip-path: polygon(0 0, 100% 0, 100% 100%); /* 只保留右上角三角形区域 */
  border-radius: 0 8px 0 0; /* 与登录框右上角圆角匹配 */
  background-color: #82a7fc;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.corner-img-wrapper:hover {
  background-color: #5d86f7;
}

.corner-img {
  margin-left: 10px;
  margin-bottom: 10px;
  font-size: 40px;
  object-fit: cover; /* 图片自适应填充裁剪后的区域 */
  transition: all 0.3s ease;
  color: #fff
}


.back-btn {
  position: absolute;
  top: 40px;
  left: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #e8e8e8;
}

.auth-wrapper {
  width: 100%;
  /* max-width: 360px; */
}

.auth-view {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Logo */
.login-logo {
  text-align: center;
  margin-bottom: 40px;
}

.login-logo-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin: 0 auto 20px;
  display: block;
}

.login-logo h1 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

/* Welcome View */
.welcome-view .auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

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

.btn-secondary {
  background: transparent;
  color: #1a1a1a;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.btn-full {
  margin-top: 8px;
}

.email-code-section {
  margin-top: 16px;
  padding: 8px 0 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.email-code-tip {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
}

.email-code-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.email-code-back {
  font-size: 12px;
  color: #1677ff;
  text-decoration: none;
  white-space: nowrap;
}

.email-code-back:hover {
  text-decoration: underline;
}

.email-code-validity {
  margin: 0 0 12px;
  font-size: 12px;
  color: #6b7280;
}

.email-code-section :deep(.email-code-input) {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #999;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.divider span {
  padding: 0 16px;
}

/* Terms */
.terms {
  text-align: center;
  font-size: 12px;
  color: #999;
  line-height: 1.6;
  margin-top: 24px;
}

.terms a {
  color: #00c6ff;
  text-decoration: none;
}

.terms a:hover {
  text-decoration: underline;
}

/* Form View */
.form-view {
  padding-top: 20px;
}

.form-title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 32px;
}

.form-fields {
  display: flex;
  flex-direction: column;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.password-group {
  position: relative;
}

.info-icon {
  position: absolute;
  top: -28px;
  left: 40px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  cursor: help;
}

.info-icon svg {
  width: 16px;
  height: 16px;
}

.info-icon:hover {
  color: #00c6ff;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

/* 适配 Ant Design Vue 输入框样式 */
:deep(.ant-input),
:deep(.ant-input-password) {
  width: 100%;
  padding: 12px 16px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  color: #1a1a1a;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

:deep(.email-autocomplete) {
  width: 100%;
}

:deep(.ant-input:focus),
:deep(.ant-input-affix-wrapper-focused) {
  background: #ffffff;
  border-color: #00c6ff;
  box-shadow: none;
}

:deep(.ant-input:hover),
:deep(.ant-input-affix-wrapper:hover) {
  border-color: #00c6ff;
}

:deep(.ant-input::placeholder),
:deep(.ant-input-password::placeholder) {
  color: #aaa;
}

/* 错误提示样式 */
:deep(.ant-form-item-explain-error) {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 4px;
}

.password-wrapper {
  position: relative;
}

.forgot-link {
  position: absolute;
  right: 0;
  top: -24px;
  font-size: 12px;
  color: #666;
  text-decoration: none;
}

.forgot-link:hover {
  color: #00c6ff;
}

.switch-text {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-top: 20px;
}

.switch-text a {
  color: #00c6ff;
  text-decoration: none;
  font-weight: 500;
}

.switch-text a:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 1024px) {
  .login-showcase {
    display: none;
  }
  
  .auth-container {
    width: 100%;
    min-height: 100vh;
  }
}

@media (max-width: 480px) {
  .auth-container {
    padding: 20px;
  }

  .back-btn {
    top: 20px;
    left: 20px;
  }
}
</style>