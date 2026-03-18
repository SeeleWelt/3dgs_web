import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import API from '../utils/api'
import { ApiServer } from '@/utils/taskService'
import { message } from 'ant-design-vue'

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

  const buildUserFromResponse = (data: any, account: string): UserInfoState => ({
    headimg: data?.headimg ?? '/default.svg',
    logoutTime: data?.logoutTime ?? null,
    loginTime: new Date().toISOString(),
    nickname: normalizeNickname(data?.nickname),
    phone: data?.phone ?? null,
    point: typeof data?.point === 'number' ? data.point : 0,
    token: data?.token,
    userStatus: typeof data?.userStatus === 'number' ? data.userStatus : (data?.status || 0),
    username: data?.username ?? data?.name ?? account,
    email: data?.email ?? account,
    name: data?.name ?? data?.username ?? null,
    isPro: data?.isPro === true || data?.isPro === 1
  })

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
          return '邮件格式错误'
        case 401:
          return '错误的邮箱或密码'
        case 430:
          return '账号已被封禁'
        case 432:
          return '账号已注销，无法登录'
        default:
          return '登录失败，请检查您的邮箱和密码'
      }
    }

    if (action === 'email-register') {
      switch (statusCode) {
        case 400:
          return '邮件格式错误'
        case 401:
          return '验证码错误或已过期'
        case 402:
          return '邮箱已注册'
        case 421:
          return '密码必须至少8个字符，包含大写字母、小写字母和数字'
        default:
          return '注册失败，请稍后再试'
      }
    }

    switch (statusCode) {
      case 400:
        return '请求错误，请检查输入'
      case 401:
        return '未授权，请重新登录'
      case 402:
        return '验证码错误'
      case 429:
        return '请求过于频繁，请稍后再试'
      case 430:
        return '账号已被封禁'
      case 432:
        return '账号已注销，无法登录'
      default:
        return '手机号登录失败'
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
        message.success('登录成功')
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
      message.success('注册成功，请登录')
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
        message.success('登录成功')
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
  const logout = () => {
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 重置状态
    isLoggedIn.value = false
    userInfo.value = null
    
    console.log('用户已登出')
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

  const modifyNickname = async (newNickname: string) => {
    try {
      const token = userInfo.value?.token || localStorage.getItem('token')
      if (!token) {
        throw new Error('缺少认证信息')
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
            message.error('请求错误，请检查输入')
            break
          case 401:
            message.error('原密码错误')
            logout()
            break
          case 403:
            message.error('没有权限执行此操作')
            break
          default:
            message.error('修改昵称失败')
        }
      }
    }
  } 

  const modifyHeadImage = async (newHeadImage: string) => {
    try {
      const token = userInfo.value?.token || localStorage.getItem('token')
      if (!token) {
        throw new Error('缺少认证信息')
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
            message.error('请求错误，请检查输入')
            break
          case 401:
            message.error('未授权，请重新登录')
            logout()
            break
          case 403:
            message.error('没有权限执行此操作')
            break
          default:
            message.error('修改头像失败')
        }
      }
    }
  } 

  const modifyPassword = async (oldPassword: string, newPassword: string) => {
    try {
      const token = userInfo.value?.token || localStorage.getItem('token')
      if (!token) {
        throw new Error('缺少认证信息')
      }

      await ApiServer.request({
        method: 'POST',
        url: API.BASE_URL + API.RESET_PASSWORD,
        data: {
          oldPassword,
          newPassword
        }
      })

      message.success('密码修改成功')
      return true
    } catch (err: any) {
      if (err?.message && String(err.message).length > 0) {
        message.error(String(err.message))
      } else {
        switch (err?.statusCode) {
          case 400:
            message.error('请求错误，请检查输入')
            break
          case 401:
            message.error('未授权，请重新登录')
            logout()
            break
          case 403:
            message.error('没有权限执行此操作')
            break
          case 421:
            message.error('密码必须至少8个字符，包含大写字母、小写字母和数字')
            break
          default:
            message.error('修改密码失败')
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
      message.success('验证码已发送')
      return true
    } catch (err: any) {
      if (err?.message && String(err.message).length > 0) {
        message.error(String(err.message))
      } else {
        switch (err?.statusCode) {
          case 400:
            message.error('手机号格式错误')
            break
          case 429:
            message.error('请求过于频繁，请稍后再试')
            break
          default:
            message.error('发送验证码失败')
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
      message.success('验证码已发送，请查收邮箱')
      return true
    } catch (err: any) {
      if (err?.message && String(err.message).length > 0) {
        message.error(String(err.message))
      } else {
        switch (err?.statusCode) {
          case 400:
            message.error('邮件格式错误')
            break
          case 429:
            message.error('发送邮件过于频繁')
            break
          default:
            message.error('验证码发送失败，请稍后重试')
        }
      }
      return false
    }
  }

  const bindPhone = async (phone: string, code: string) => {
    try {
      const token = userInfo.value?.token || localStorage.getItem('token')
      if (!token) {
        throw new Error('缺少认证信息')
      }

      await ApiServer.request({
        method: 'POST',
        url: API.BASE_URL + API.BIND_PHONE,
        data: { phone, code }
      })

      updateProfile({ phone })
      message.success('手机号绑定成功')
      return true
    } catch (err: any) {
      if (err?.message && String(err.message).length > 0) {
        message.error(String(err.message))
      } else {
        switch (err?.statusCode) {
          case 400:
            message.error('手机号已经注册了')
            break
          case 401:
            message.error('未授权，请重新登录')
            logout()
            break
          case 402:
            message.error('验证码错误')
            break
          case 429:
            message.error('请求过于频繁，请稍后再试')
            break
          default:
            message.error('绑定手机号失败')
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
    // 登录
  }  
})