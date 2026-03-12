import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import API from './api'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'

export enum TasksType {
  normal = 'all',
  public = 'public',
  private = 'private',
  completed = 'completed',
  failed = 'failed',
  processing = 'in_progress',
  nsfw = 'nsfw_blocked'
}

export interface TaskModel {
  taskId: string
  taskName: string
  status?: string
  nsfwBlocked?: boolean
  createdAt?: string
  endAt?: string
  error?: string
  lightning?: boolean
  fps?: number
  videoCount?: number
  objectDescription?: string
  ownerUsername?: string
  authorAvatar?: string
  preview?: string
  headimg?: string
  nickname?: string
  isPublic: boolean
  viewCount: number
  likeCount: number
  isLiked: boolean
  downloadCount: number
  shareCount: number
}

export interface GetTaskListParams {
  page: number
  pageSize?: number
  mode?: string
  deleteStatus?: number
  type?: TasksType
  query?: string
}

interface TaskListResponse {
  tasks?: Array<Record<string, any>>
  pagination?: {
    total?: number
  }
}

export class ApiServer {
  private static readonly http: AxiosInstance = axios.create({
    baseURL: API.BASE_URL,
    timeout: 60_000
  })
  private static interceptorInited = false

  static totalTasks = 0

  private static resolveAuthToken(token?: string): string | undefined {
    if (token) return token

    try {
      const userStore = useUserStore()
      return userStore.userInfo?.token || localStorage.getItem('token') || undefined
    } catch {
      return localStorage.getItem('token') || undefined
    }
  }

  private static ensureHttpInterceptors() {
    if (this.interceptorInited) return

    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log("捕获的第一个错误", error)
        if (axios.isAxiosError(error)) {
          const wrappedError = new Error() as Error & {
            statusCode?: number
            isNetworkError?: boolean
            original?: unknown
            isCancelled?: boolean
          }

          wrappedError.original = error
          if(axios.isCancel(error)) {
            wrappedError.message = '请求已取消'
            wrappedError.isCancelled = true
            return Promise.reject(wrappedError)
          }
          else if (!error.response) {
            wrappedError.isNetworkError = true
            wrappedError.message =
              error.code === 'ECONNABORTED'
                ? '网络请求超时，请稍后重试'
                : '网络错误，请检查网络连接'
            return Promise.reject(wrappedError)
          }

          const status = error.response.status
          console.log("捕获的错误状态码", error.response)

          wrappedError.statusCode = status

          switch (status) {
            case 404:
              wrappedError.message = '请求资源不存在'
              break
            case 500:
              wrappedError.message = '服务器错误'
              break
            default:
              wrappedError.message = ""
              break
          }

          return Promise.reject(wrappedError)
        }

        return Promise.reject(error)
      }
    )

    this.interceptorInited = true
  }

  static getHttpClient(token?: string): AxiosInstance {
    this.ensureHttpInterceptors()
    const authToken = this.resolveAuthToken(token)
    if (authToken) {
      this.http.defaults.headers.common.Authorization = `Bearer ${authToken}`
    } else {
      delete this.http.defaults.headers.common.Authorization
    }
    return this.http
  }

  static async request<T = any>(config: AxiosRequestConfig, token?: string): Promise<AxiosResponse<T>> {
    this.ensureHttpInterceptors()
    const authToken = this.resolveAuthToken(token)
    const headers = {
      ...(config.headers || {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    }

    return this.http.request<T>({
      ...config,
      headers
    })
  }
  
  static async getTaskList(params: GetTaskListParams): Promise<TaskModel[]> {
    this.ensureHttpInterceptors()
    const token = this.resolveAuthToken()
    if (token) {
      this.http.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete this.http.defaults.headers.common.Authorization
    }
    const response = await this.http.get<TaskListResponse>(API.TASK_LIST, {
      params: params
    })  
    const tasks = response.data?.tasks ?? []
    this.totalTasks = response.data?.pagination?.total ?? 0

    return tasks.map((item) => ({
      taskId: String(item.task_id ?? ''),
      taskName: String(item.task_name ?? '未命名任务'),
      status: item.status,
      isPublic: Boolean(item.is_public ?? false),
      nsfwBlocked: Boolean(item.nsfw_blocked ?? false),
      viewCount: Number(item.views_count ?? 0),
      likeCount: Number(item.likes_count ?? 0),
      isLiked: Boolean(item.isLike ?? false),
      downloadCount: Number(item.downloads_count ?? 0),
      shareCount: Number(item.shares_count ?? 0),
      createdAt: item.created_at,
      endAt: item.end_at,
      error: item.error,
      lightning: Boolean(item.lightning ?? false),
      fps: item.fps,
      videoCount: item.video_count,
      objectDescription:
        !item.user_object_description || String(item.user_object_description).length === 0
          ? item.object_description
          : item.user_object_description,
      ownerUsername: item.owner_username,
      authorAvatar: item.author_avatar,
      preview: item.preview_image,
      headimg: !item.headimg || String(item.headimg).length === 0 ? 'assets/logo.png' : item.headimg,
      nickname: !item.nickname || String(item.nickname).length === 0 ? item.owner_username : item.nickname
    }))
  }

}
