import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import API from '../utils/api'
import axios from 'axios'

export const useUserStore = defineStore('user', () => {
  // 用户登录状态
  const isLoggedIn = ref(false)
  const userInfo = ref<{
    headimg: string | null
    logoutTime: string | null
    nickname: string | null
    phone: string | null
    point: number
    token?: string
    userStatus: number
    username: string
    email?: string
    name?: string
  } | null>(null)
  const isLoading = ref(false)

  const buildUserFromResponse = (data: any, account: string) => ({
    headimg: data?.headimg ?? '/default.svg',
    logoutTime: data?.logoutTime ?? null,
    nickname: data?.nickname ?? null,
    phone: data?.phone ?? null,
    point: typeof data?.point === 'number' ? data.point : 0,
    token: data?.token,
    userStatus: typeof data?.userStatus === 'number' ? data.userStatus : (data?.status || 0),
    username: data?.username ?? data?.name ?? account,
    email: data?.email ?? account,
    name: data?.name ?? data?.username ?? null
  })

  const saveLoginState = (user: any) => {
    if (user?.token) {
      localStorage.setItem('token', user.token)
    }
    localStorage.setItem('user', JSON.stringify(user))
    isLoggedIn.value = true
    userInfo.value = user
  }

  const normalizeAxiosError = (err: any) => {
    if (err && err.response) {
      const status = err.response.status
      const msg = err.response.data?.message || err.response.statusText || '请求失败'
      return { status, message: msg, isNetworkError: false, original: err }
    }

    if (err && err.request) {
      return { status: 0, message: 'Network Error', isNetworkError: true, original: err }
    }

    return { status: -1, message: err?.message || 'Unknown error', isNetworkError: false, original: err }
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
      const response = await axios.post(`${API.BASE_URL}${API.EMAIL_LOGIN}`, {
        username: email,
        password
      })
      const data = response.data || {}

      if (data && data.token) {
        const user = buildUserFromResponse(data, email)
        saveLoginState(user)
        isLoading.value = false
        return true
      }

      isLoading.value = false
      const status = (response as any).status || 0
      throw { status, message: data?.message || '登录失败', isNetworkError: false, original: response }
    } catch (err: any) {
      isLoading.value = false
      throw normalizeAxiosError(err)
    }
  }

  const emailRegister = async (email: string, password: string, code: string) => {
    isLoading.value = true
    try {
      await axios.post(`${API.BASE_URL}${API.EMAIL_REGISTER}`, {
        username: email,
        password,
        code
      })
      isLoading.value = false
      return true
    } catch (err: any) {
      isLoading.value = false
      throw normalizeAxiosError(err)
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    return emailLogin(email, password)
  }

  // 手机号登录/注册
  const phoneLogin = async (areaCode: string, phone: string, code: string) => {
    isLoading.value = true
    try {
      const response = await axios.post(`${API.BASE_URL}${API.PHONE_AUTH}`, {
        areaCode,
        phone,
        code
      })
      console.log('手机号登录响应:', response.data)
      const data = response.data || {}
      if (data) {
        const user = {
          headimg: data.headimg ?? "/default.svg",
          logoutTime: data.logoutTime ?? null,
          nickname: data.nickname ?? null,
          phone: data.phone ?? phone,
          point: data.point ? typeof data.point === 'number' ? data.user.point : 0 : 0,
          token: data.token,
          userStatus: typeof data.userStatus === 'number' ? data.userStatus : (data.status || 0),
          username: data.username ?? data.name ?? phone,
          email: data.email ?? phone,
          name: data.name ?? data.username ?? null
        }

        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(user))

        isLoggedIn.value = true
        userInfo.value = user
        isLoading.value = false
        return true
      }

      isLoading.value = false
      const status = (response as any).status || 0
      throw { status, message: data?.message || '手机号登录失败', isNetworkError: false, original: response }
    } catch (err: any) {
      isLoading.value = false
      if (err && err.response) {
        const status = err.response.status
        const msg = err.response.data?.message || err.response.statusText || '请求失败'
        throw { status, message: msg, isNetworkError: false, original: err }
      } else if (err && err.request) {
        throw { status: 0, message: 'Network Error', isNetworkError: true, original: err }
      } else {
        throw { status: -1, message: err?.message || 'Unknown error', isNetworkError: false, original: err }
      }
    }
  }
  
  const register = async (email: string, password: string) => {
    return emailRegister(email, password, '')
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
        nickname: null,
        phone: null,
        point: 0,
        token: undefined,
        userStatus: 0,
        username: '',
      }
    }
    userInfo.value = Object.assign({}, userInfo.value, patch)
    try {
      localStorage.setItem('user', JSON.stringify(userInfo.value))
    } catch (e) {
      console.warn('Failed to persist user to localStorage', e)
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
    updateProfile
    // 登录
  }  
})