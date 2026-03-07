<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- 顶部信息卡片 -->
      <a-card class="profile-header-card" bordered="false">
        <div class="profile-header-content">
          <!-- 头像区域 -->
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <a-avatar 
                :src="avatarPreview || user?.headimg" 
                :size="120" 

              />
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
              
              <!-- 昵称显示，仅展示 -->
              <div class="nickname-wrapper">
                <span class="nickname-text">
                  {{ user?.nickname || t('profile.noNickname') }}
                </span>
                <button 
                  class="nickname-edit-btn" 
                  @click="toggleEditName" 
                  :title="t('profile.editNickname')"
                >
                  <EditOutlined />
                </button>
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
            <a-card class="stats-card" bordered="false">
              <h3 class="card-title">{{ t('profile.accountStats') }}</h3>
              <div class="stats-list">
                <div class="stat-item">
                  <div class="stat-label">{{ t('profile.lastLogin') }}</div>
                  <div class="stat-value">{{ user?.logoutTime || '-' }}</div>
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
            <a-card class="security-card" bordered="false">
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
            <a-card class="details-card" bordered="false">
              <h3 class="card-title">{{ t('profile.personalDetails') }}</h3>
              <a-list class="details-list">
                <a-list-item class="detail-item">
                  <span class="detail-label">{{ t('profile.nickname') }}:</span>
                  <span class="detail-value">{{ user?.nickname || '-' }}</span>
                </a-list-item>
                <a-list-item class="detail-item">
                  <span class="detail-label">{{ t('profile.phone') }}:</span>
                  <span class="detail-value">{{ user?.phone || '-' }}</span>
                </a-list-item>
                <a-list-item class="detail-item">
                  <span class="detail-label">{{ t('login.email') }}:</span>
                  <span class="detail-value">{{ user?.username || '-' }}</span>
                </a-list-item>
              </a-list> 
            </a-card>

            <!-- 账户设置卡片 -->
            <a-card class="settings-card" bordered="false">
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
      <a-form :model="pwdForm" layout="vertical" class="pwd-form">
        <a-form-item :label="t('profile.oldPassword')">
          <a-input-password 
            v-model:value="pwdForm.oldPwd" 
            :placeholder="t('profile.enterOldPwd')"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item :label="t('profile.newPassword')">
          <a-input-password 
            v-model:value="pwdForm.newPwd" 
            :placeholder="t('profile.enterNewPwd')"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item :label="t('profile.confirmPassword')">
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
      mask
    >
      <a-input
        v-model:value="nameValue"
        :placeholder="t('profile.enterNickname')"
        @press.enter="saveName"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { message } from 'ant-design-vue'
import { EditOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()
const userStore = useUserStore()
const user = computed(() => userStore.userInfo || null)

// 昵称编辑相关（用于控制弹窗）
const editingName = ref(false)
const nameValue = ref('')
const editingNameOriginal = ref('')

// 头像相关
const avatarPreview = ref<string | null>("/default.svg") // 默认头像路径
const fileInput = ref<HTMLInputElement | null>(null)

// 修改密码弹窗
const showChangePwdModal = ref(false)
const pwdForm = ref({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})

// 初始化数据
if (user.value) {
  nameValue.value = user.value.nickname || ''
  avatarPreview.value = user.value.headimg || "/default.svg"
}

// 切换昵称编辑状态（弹窗打开）
const toggleEditName = () => {
  editingNameOriginal.value = nameValue.value
  editingName.value = true
}

// 保存昵称
const saveName = () => {
  const newName = nameValue.value.trim()
  if (!newName) {
    message.warning(t('profile.nicknameRequired'))
    return
  }
  
  userStore.updateProfile({ nickname: newName })
  editingName.value = false
  message.success(t('profile.saveSuccess'))
}

// 取消昵称编辑
const cancelEdit = () => {
  nameValue.value = editingNameOriginal.value
  editingName.value = false
}

// 触发头像上传
const triggerFile = () => {
  fileInput.value?.click()
}

// 处理头像上传
const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  // 验证文件大小（5MB以内）
  if (file.size > 5 * 1024 * 1024) {
    message.error(t('profile.avatarSizeLimit'))
    return
  }
  
  const reader = new FileReader()
  reader.onload = () => {
    avatarPreview.value = String(reader.result || '')
    userStore.updateProfile({ headimg: avatarPreview.value })
    message.success(t('profile.avatarSaved'))
    
    // 清空input值，允许重复上传同一文件
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
  reader.readAsDataURL(file)
}

// 修改密码
const handleChangePwd = () => {
  const { oldPwd, newPwd, confirmPwd } = pwdForm.value
  
  // 验证
  if (!oldPwd) {
    message.warning(t('profile.oldPwdRequired'))
    return
  }
  if (!newPwd) {
    message.warning(t('profile.newPwdRequired'))
    return
  }
  if (newPwd.length < 6) {
    message.warning(t('profile.pwdLength'))
    return
  }
  if (newPwd !== confirmPwd) {
    message.warning(t('profile.pwdNotMatch'))
    return
  }
  
  // 调用修改密码接口（注释保留，实际使用时打开）
  // userStore.changePassword({
  //   oldPassword: oldPwd,
  //   newPassword: newPwd
  // }).then(() => {
  //   message.success(t('profile.pwdChanged'))
  //   showChangePwdModal.value = false
  //   // 重置表单
  //   pwdForm.value = { oldPwd: '', newPwd: '', confirmPwd: '' }
  // }).catch(() => {
  //   message.error(t('profile.pwdChangeFailed'))
  // })
  
  // 模拟成功
  message.success(t('profile.pwdChanged'))
  showChangePwdModal.value = false
  pwdForm.value = { oldPwd: '', newPwd: '', confirmPwd: '' }
}
</script>

<style scoped>
/* 全局容器 */
.profile-page {
  min-height: calc(100vh - 64px);
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.05);
  padding: 32px;
}

/* 顶部头部卡片 */
.profile-header-card {
  background: linear-gradient(135deg, #a3bffa 0%, #d6bcfa 100%);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  padding: 32px;
  color: white;
  margin-bottom: 24px;
  border: none;
}

.profile-header-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 32px;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}

.user-avatar {
  border: 5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.avatar-edit-btn {
  position: absolute;
  right: -8px;
  bottom: -8px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ff6b81;
  border: 3px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.avatar-edit-btn:hover {
  background: #ff4757;
  transform: scale(1.08);
}

.avatar-file-input {
  display: none;
}

/* 用户基础信息 - 优化昵称编辑样式 */
.user-basic-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 昵称编辑区域 - 重点优化 */
.nickname-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.nickname-text {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.95);
}

/* 昵称编辑容器 */
.nickname-edit-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.nickname-input {
  flex: 1;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #2d3748;
}

:deep(.nickname-input .ant-input) {
  color: #2d3748;
  background: transparent;
  border: none;
  box-shadow: none;
}

:deep(.nickname-input .ant-input::placeholder) {
  color: #718096;
}

/* 昵称编辑按钮组 */
.nickname-edit-actions {
  display: flex;
  gap: 8px;
}

.save-btn {
  background-color: #48bb78 !important;
  border-color: #48bb78 !important;
  color: white !important;
}

.cancel-btn {
  background-color: #f0f2f5 !important;
  border-color: #f0f2f5 !important;
  color: #4a5568 !important;
}

.nickname-edit-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nickname-edit-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

/* 主体内容网格 */
.profile-body {
  width: 100%;
}

.profile-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 28px;
}

/* 左侧侧边栏 */
.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* 卡片通用样式 */
:deep(.ant-card) {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: none;
}

:deep(.ant-card):hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
  position: relative;
}

.card-title::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

/* 统计卡片 */
.stats-card {
  padding: 24px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

.stat-value {
  font-size: 17px;
  color: #2d3748;
  font-weight: 600;
}

/* 侧边栏操作按钮（修改密码） */
.security-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.change-pwd-btn {
  background: linear-gradient(90deg, #667eea, #764ba2) !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
}

.change-pwd-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 账户安全卡片 */
.security-card {
  padding: 24px;
  background: #fdf2f8;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.security-actions {
  margin-top: 16px;
}

/* 右侧内容区域 */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* 详细信息卡片 */
.details-card {
  padding: 24px;
  background: #e8f4f8;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-item {
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
}

.detail-label {
  font-size: 15px;
  color: #4a5568;
  font-weight: 500;
}

.detail-value {
  font-size: 15px;
  color: #2d3748;
}

/* 账户设置卡片 */
.settings-card {
  padding: 24px;
  background: #f5fafe;
}

/* 修改密码弹窗样式 */
:deep(.pwd-form) {
  margin-top: 16px;
}

:deep(.pwd-form .ant-form-item) {
  margin-bottom: 20px;
}

/* 响应式适配 */
@media (max-width: 992px) {
  .profile-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .profile-header-card {
    padding: 24px;
  }
  
  .avatar-section {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .nickname-edit-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .detail-item {
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .profile-page {
    padding: 16px 8px;
  }
  
  .username {
    font-size: 24px;
  }
  
  .profile-header-card {
    padding: 20px 16px;
  }
  
  .nickname-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>