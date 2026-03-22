import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import API from '../utils/api'
import { ApiServer } from '@/utils/taskService'
import { message } from 'ant-design-vue'
import router from '@/router'
import i18n from '@/i18n'

type UserInfoState = {
  headimg: string | null
  logoutTime: string | null
  loginTime: string | null
  nickname: string | null
  phone: string | null
  point: number
  token?: string
  userStatus: number
  username: string
  email?: string
  name?: string
  loginType?: 'email' | 'phone'
  isPro: boolean
}

export const useUserStore = defineStore('user', () => {
  // 用户登录状态
  const isLoggedIn = ref(false)
  const userInfo = ref<UserInfoState | null>(null)
  const isLoading = ref(false)

  const generateRandomNickname = () => `User${Math.floor(1000 + Math.random() * 9000)}`

  const normalizeNickname = (nickname: any) => {
    const value = typeof nickname === 'string' ? nickname.trim() : ''
    return value.length > 0 ? value : generateRandomNickname()
  }

  // 从username提取email，例如: user_1910230934@qq.com -> 1910230934@qq.com
  const extractEmailFromUsername = (username: string | undefined): string | null => {
    if (!username) return null
    // 如果格式是 user_数字@域名，提取@后面的部分作为邮箱
    const match = username.match(/^user_(\d+@.+)$/i)
    if (match) {
      return match[1]
    }
    return null
  }

  const buildUserFromResponse = (data: any, account: string): UserInfoState => {
    // 尝试从username提取email
    const extractedEmail = extractEmailFromUsername(data?.username ?? data?.name)
    return {
      headimg: data?.headimg ?? '/default.svg',
      logoutTime: data?.logoutTime ?? null,
      loginTime: new Date().toISOString(),
      nickname: normalizeNickname(data?.nickname),
      phone: data?.phone ?? null,
      point: typeof data?.point === 'number' ? data.point : 0,
      token: data?.token,
      userStatus: typeof data?.userStatus === 'number' ? data.userStatus : (data?.status || 1),
      username: data?.username ?? data?.name ?? account,
      email: data?.email ?? extractedEmail ?? account,
      name: data?.name ?? data?.username ?? null,
      isPro: data?.isPro === true || data?.isPro === 1
    }
  }

  const saveLoginState = (user: any) => {
    const normalizedUser = {
      ...user,
      nickname: normalizeNickname(user?.nickname)
    }

    if (user?.token) {
      localStorage.setItem('token', user.token)
    }
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    isLoggedIn.value = true
    userInfo.value = normalizedUser
  }

  const resolveAuthErrorMessage = (err: any, action: 'email-login' | 'email-register' | 'phone-login') => {
    if (err?.message && String(err.message).length > 0) {
      return String(err.message)
    }

    const statusCode = Number(err?.statusCode ?? err?.status ?? -1)
    if (action === 'email-login') {
      switch (statusCode) {
        case 400:
          return String(i18n.global.t('authErrors.emailFormat'))
        case 401:
          return String(i18n.global.t('authErrors.invalidCredentials'))
        case 429:
          return String(i18n.global.t('authErrors.tooManyRequests'))
        case 430:
          return String(i18n.global.t('authErrors.accountBanned'))
        case 432:
          return String(i18n.global.t('authErrors.accountDeactivated'))
        default:
          return String(i18n.global.t('authErrors.loginFailedGeneric'))
      }
    }

    if (action === 'email-register') {
      switch (statusCode) {
        case 400:
          return String(i18n.global.t('authErrors.emailFormat'))
        case 401:
          return String(i18n.global.t('authErrors.codeInvalidOrExpired'))
        case 402:
          return String(i18n.global.t('authErrors.emailAlreadyRegistered'))
        case 429:
          return String(i18n.global.t('authErrors.tooManyRequests'))
        case 421:
          return String(i18n.global.t('authErrors.passwordComplexity'))
        default:
          return String(i18n.global.t('authErrors.registerFailedGeneric'))
      }
    }

    switch (statusCode) {
      case 400:
        return String(i18n.global.t('authErrors.codeInvalidOrExpired'))
      case 401:
        return String(i18n.global.t('errors.unauthorized'))
      case 402:
        return String(i18n.global.t('authErrors.codeInvalid'))
      case 429:
        return String(i18n.global.t('authErrors.tooManyRequests'))
      case 430:
        return String(i18n.global.t('authErrors.accountBanned'))
      case 432:
        return String(i18n.global.t('authErrors.accountDeactivated'))
      default:
        return String(i18n.global.t('authErrors.phoneLoginFailed'))
    }
  }

  // 检查登录状态
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      isLoggedIn.value = true
      userInfo.value = JSON.parse(savedUser)
    }
  }

  const emailLogin = async (email: string, password: string) => {
    isLoading.value = true
    try {
      const response = await ApiServer.request({
        method: 'post',
        url: API.EMAIL_LOGIN,
        data: {
          email: email,
          password
        }
      })
      const data = response.data || {}

      if (data && data.token) {
        const user = buildUserFromResponse(data, email)
        user.loginType = 'email'
        saveLoginState(user)
        message.success(String(i18n.global.t('login.loginSuccess')))
        isLoading.value = false
        return true
      }

      isLoading.value = false
      const statusCode = (response as any).status || 0
      message.error(resolveAuthErrorMessage({ statusCode, message: data?.message }, 'email-login'))
      return false
    } catch (err: any) {
      isLoading.value = false
      message.error(resolveAuthErrorMessage(err, 'email-login'))
      return false
    }
  }

  const emailRegister = async (email: string, password: string, code: string, inviteCode?: string) => {
    isLoading.value = true
    try {
      await ApiServer.request({
        method: 'post',
        url: API.EMAIL_REGISTER,
        data: {
          email: email,
          password,
          code,
          ...(inviteCode ? { inviteCode } : {})
        }
      })
      message.success(String(i18n.global.t('login.registerSuccess')))
      isLoading.value = false
      return true
    } catch (err: any) {
      isLoading.value = false
      message.error(resolveAuthErrorMessage(err, 'email-register'))
      return false
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    return emailLogin(email, password)
  }

  // 手机号登录/注册
  const phoneLogin = async (areaCode: string, phone: string, code: string, inviteCode?: string) => {
    isLoading.value = true
    try {
      const response = await ApiServer.request({
        method: 'post',
        url: API.PHONE_AUTH,
        data: {
          areaCode,
          phone,
          code,
          ...(inviteCode ? { inviteCode } : {})
        }
      })
      console.log('手机号登录响应:', response.data)
      const data = response.data || {}
      if (data) {
        const user = buildUserFromResponse({
          ...data,
          phone: data?.phone ?? phone,
          email: data?.email ?? phone
        }, phone)
        user.loginType = 'phone'
        saveLoginState(user)
        message.success(String(i18n.global.t('login.loginSuccess')))
        isLoading.value = false
        return true
      }

      isLoading.value = false
      const statusCode = (response as any).status || 0
      message.error(resolveAuthErrorMessage({ statusCode, message: data?.message }, 'phone-login'))
      return false
    } catch (err: any) {
      isLoading.value = false
      message.error(resolveAuthErrorMessage(err, 'phone-login'))
      return false
    }
  }
  
  const register = async (email: string, password: string, inviteCode?: string) => {
    return emailRegister(email, password, '', inviteCode)
  }

  // 登出
  const logout = async () => {
    const {success} = await signOut();
    if(success){
      message.success(String(i18n.global.t('auth.logoutSuccess')))
    }else{
      message.error(String(i18n.global.t('auth.logoutFailed')))
    }
  }

  // 初始化
  const init = () => {
    checkLoginStatus()
  }

  // 更新用户信息（局部更新并持久化）
  const updateProfile = (patch: Record<string, any>) => {
    if (!userInfo.value) {
      userInfo.value = {
        headimg: null,
        logoutTime: null,
        loginTime: null,
        nickname: null,
        phone: null,
        point: 0,
        token: undefined,
        userStatus: 0,
        username: '',
        isPro: false,
      }
    }
    // userInfo.value = Object.assign({}, userInfo.value, patch)
    userInfo.value = { ...userInfo.value, ...patch }
    try {
      localStorage.setItem('user', JSON.stringify(userInfo.value))
    } catch (e) {
      console.warn('Failed to persist user to localStorage', e)
    }
  }

  const signOut = async () => {
    try {
      await ApiServer.request({
        method: 'POST',
        url: API.USER_SIGNOUT
      })
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('has_seen_tutorial')
      
      // 重置状态
      isLoggedIn.value = false
      userInfo.value = null
        // 跳转到登录页
      router.push('/login')
      return { success: true }
    } catch (err: any) {
      return { success: false }
    }
  }


  const modifyNickname = async (newNickname: string) => {
    try {
      const token = userInfo.value?.token || localStorage.getItem('token')
      if (!token) {
        throw new Error(String(i18n.global.t('errors.missingAuth')))
      }
      await ApiServer.request({
        method: 'POST',
        url: API.BASE_URL + API.MODIFY_NICKNAME,
        data: { nickname: newNickname },
      })
      updateProfile({ nickname: newNickname })
    } catch (err: any) {
      if(err?.message.length > 0){
        message.error(err.message)
      }else{
        switch(err?.statusCode){
          case 400:
            message.error(String(i18n.global.t('errors.invalidParams')))
            break
          case 401:
            message.error(String(i18n.global.t('errors.sessionExpired')))
            logout()
            break
          case 403:
            message.error(String(i18n.global.t('errors.forbidden')))
            break
          default:
            message.error(String(i18n.global.t('errors.nicknameUpdateFailed')))
        }
      }
    }
  } 

  const modifyHeadImage = async (newHeadImage: string) => {
    try {
      const token = userInfo.value?.token || localStorage.getItem('token')
      if (!token) {
        throw new Error(String(i18n.global.t('errors.missingAuth')))
      }
      await ApiServer.request({
        method: 'POST',
        url: API.BASE_URL + API.MODIFY_AVATAR,
        data: { imgBase64: newHeadImage },

      })
      updateProfile({ headimg: newHeadImage })
    } catch (err: any) {
      if(err?.message.length > 0){
        message.error(err.message)
      }else{
        switch(err?.statusCode){
          case 400:
            message.error(String(i18n.global.t('errors.invalidParams')))
            break
          case 401:
            message.error(String(i18n.global.t('errors.unauthorized')))
            logout()
            break
          case 403:
            message.error(String(i18n.global.t('errors.forbidden')))
            break
          default:
            message.error(String(i18n.global.t('errors.avatarUpdateFailed')))
        }
      }
    }
  } 

  const modifyPassword = async (oldPassword: string, newPassword: string) => {
    try {
      const token = userInfo.value?.token || localStorage.getItem('token')
      if (!token) {
        throw new Error(String(i18n.global.t('errors.missingAuth')))
      }

      await ApiServer.request({
        method: 'POST',
        url: API.BASE_URL + API.RESET_PASSWORD,
        data: {
          oldPassword,
          newPassword
        }
      })

      message.success(String(i18n.global.t('profile.pwdChanged')))
      return true
    } catch (err: any) {
      if (err?.message && String(err.message).length > 0) {
        message.error(String(err.message))
      } else {
        switch (err?.statusCode) {
          case 400:
            message.error(String(i18n.global.t('errors.requestError')))
            break
          case 401:
            message.error(String(i18n.global.t('errors.oldPasswordIncorrect')))
            break
          case 404:
            message.error(String(i18n.global.t('errors.userNotFound')))
            break
          default:
            message.error(String(i18n.global.t('profile.pwdChangeFailed')))
        }
      }
      return false
    }
  }

  const sendPhoneCode = async (phone: string) => {
    try {
      await ApiServer.request({
        method: 'POST',
        url: API.SEND_CODE,
        data: { phone }
      })
      message.success(String(i18n.global.t('login.codeSentSuccess')))
      return true
    } catch (err: any) {
      if (err?.message && String(err.message).length > 0) {
        message.error(String(err.message))
      } else {
        switch (err?.statusCode) {
          case 400:
            message.error(String(i18n.global.t('errors.phoneInvalid')))
            break
          case 429:
            message.error(String(i18n.global.t('authErrors.tooManyRequests')))
            break
          default:
            message.error(String(i18n.global.t('errors.sendCodeFailed')))
        }
      }
      return false
    }
  }

  const sendEmailCode = async (email: string) => {
    try {
      await ApiServer.request({
        method: 'POST',
        url: API.SEND_EMAIL,
        data: { email }
      })
      message.success(String(i18n.global.t('auth.emailCodeSent')))
      return true
    } catch (err: any) {
      if (err?.message && String(err.message).length > 0) {
        message.error(String(err.message))
      } else {
        switch (err?.statusCode) {
          case 400:
            message.error(String(i18n.global.t('authErrors.emailFormat')))
            break
          case 429:
            message.error(String(i18n.global.t('errors.sendEmailTooOften')))
            break
          default:
            message.error(String(i18n.global.t('errors.sendEmailFailed')))
        }
      }
      return false
    }
  }

  const bindPhone = async (phone: string, code: string) => {
    try {
      const token = userInfo.value?.token || localStorage.getItem('token')
      if (!token) {
        throw new Error(String(i18n.global.t('errors.missingAuth')))
      }

      await ApiServer.request({
        method: 'POST',
        url: API.BASE_URL + API.BIND_PHONE,
        data: { phone, code }
      })

      updateProfile({ phone })
      message.success(String(i18n.global.t('auth.phoneBindSuccess')))
      return true
    } catch (err: any) {
      if (err?.message && String(err.message).length > 0) {
        message.error(String(err.message))
      } else {
        switch (err?.statusCode) {
          case 400:
            message.error(String(i18n.global.t('errors.phoneAlreadyRegistered')))
            break
          case 401:
            message.error(String(i18n.global.t('errors.unauthorized')))
            logout()
            break
          case 402:
            message.error(String(i18n.global.t('authErrors.codeInvalid')))
            break
          case 429:
            message.error(String(i18n.global.t('authErrors.tooManyRequests')))
            break
          default:
            message.error(String(i18n.global.t('errors.phoneBindFailed')))
        }
      }
      return false
    }
  }

  return {
    isLoggedIn: computed(() => isLoggedIn.value),
    userInfo: computed(() => userInfo.value),
    isLoading: computed(() => isLoading.value),
    login,
    emailLogin,
    phoneLogin,
    register,
    emailRegister,
    logout,
    init,
    updateProfile,
    modifyNickname,
    modifyHeadImage,
    modifyPassword,
    sendPhoneCode,
    sendEmailCode,
    bindPhone,
    buildUserFromResponse,
    saveLoginState,
    // 登录
  }  
})
