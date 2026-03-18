// API endpoints constants
// Converted from Dart-style class to TypeScript object

const API = {
  // 基础请求地址
  BASE_URL: "https://3dgs-web.metast.xyz/backend",

  // 用户注册
  REGISTER: '/api/register',

  // 用户注销
  LOGOUT: '/api/logOut',

  // 用户取消注销
  CANCEL_LOGOUT: '/api/cancelLogOut',

  // 开发者反馈
  FEEDBACK: '/api/feedback',

  // 用户磁盘使用情况
  USER_QUOTA: '/api/task/checkUserQuota',

  // 删除任务
  TASK_DELETE: '/api/task/delete',
  TASK_CANCEL_DELETE: '/api/task/cancelDeleteTask',
  TASK_PAUSE: '/api/task/pause',
  TASK_RESUME: '/api/task/resume',

  // 绑定用户极光账号
  BIND_DEV: '/api/bindDevices',

  // 用户登录
  LOGIN: '/api/login',

  // 创建任务（上传视频）
  UPLOAD_TASK: '/api/upload',
  UPLOAD_IMAGES: "/api/upload-images",

  // 获取任务列表
  TASK_LIST: '/api/tasks',

  // 获取任务详情（需拼接 task_id，示例：`${API.TASK_DETAIL}/${taskId}`）
  TASK_DETAIL: '/api/task',

  // 下载3D模型（需拼接 task_id）
  DOWNLOAD_MODEL: '/api/model',

  // 发送验证码
  SEND_CODE: '/api/sendCode',
  SEND_EMAIL: '/api/sendEmail',

  // 邮箱注册/登录
  EMAIL_REGISTER: '/api/emailRegister',
  EMAIL_LOGIN: '/api/emailLogin',

  // 手机注册/手机号验证
  PHONE_AUTH: '/api/phoneRegister',

  // 切换作品公开/私有状态
  SHARE_MODE_CHANGE: '/api/model/changePublic',

  // 获取任务队列
  GET_TASK_QUEUE: '/api/task/getList',

  // 重置密码
  RESET_PASSWORD: '/api/changePassword',

  // 用户头像
  MODIFY_AVATAR: '/api/miniapp/modifyheadimg',

  // 用户名
  MODIFY_NICKNAME: '/api/miniapp/modifynickname',

  // 用户算力点
  GET_POINTS: '/api/rewards/getUserCredits',
  GET_POINTS_ALL_LOG: '/api/rewards/getUserCreditsLogs',
  GET_POINTS_DAILY_LOG: '/api/rewards/dailyLogin',
  GET_POINTS_RULES: '/api/task/getModelRules',

  // 渲染的评价
  TASK_SUBMIT_EVALUATE: '',
  TASK_EVALUATE_STATUS: '',

  // 版本更新
  UPDATE_VERSION: '/update/checkVersion',

  // 模型点赞
  TASK_LIKES: '/api/likes/like',

  // 模型转发
  TASK_SHARES: '/api/task/shares',

  // 相机参数
  GET_CAMERA_DATA: '/api/camera/getData',

  // 绑定手机号
  BIND_PHONE: '/api/bindPhone',

  // 分享链接
  SHARE_CREATE: '/api/share/create',

  // 标注
  CREATE_ANNOTATION: "/api/task/createAnnotation",
  GET_ANNOTATIONS: "/api/task/getAnnotation",
  // 官方模型列表
  GET_OFFICIAL_MODEL: '/api/officialModel',
  DOWNLOAD_OFFICIAL_MODEL: '/api/downOfficialModel',

  // API密钥管理
  GET_API_KEYS: '/api/apiKey/getKeys',
  CREATE_API_KEY: '/api/apiKey/createApiKey',
  DELETE_API_KEY: '/api/apiKey/deleteApiKey',
  RENAME_API_KEY: '/api/apiKey/renameApiKey',
  GET_OPEN_CREDITS: '/api/apiKey/getOpenCredits',
  GET_OPEN_CREDITS_LOGS: '/api/apiKey/getLogs',
  SET_WEBHOOKS: '/api/apiKey/setWebhooks',
  GET_WEBHOOKS: '/api/apiKey/getWebhooks',
  DELETE_WEBHOOKS: '/api/apiKey/deleteWebhooks',

  // 邀请链接
  GET_INVITE_HREF: '/api/invite/getInviteHref',
  GRANT_INVITE_REWARD: '/api/invite/grantReward',
  GET_INVITE_RECORDS: '/api/invite/getInviteRecords',
  // 保存模型设置
  SAVE_MODEL_SETTING: "/api/saveModelSetting",
  GET_MODEL_SETTING: "/api/getModelSetting",
} as const;

export default API;
export type APIType = typeof API;
