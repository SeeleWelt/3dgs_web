<template>
  <div class="feedback-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <MessageOutlined />
        </div>
        <div class="header-text">
          <h1>意见反馈</h1>
          <p>您的建议对我们很重要</p>
        </div>
      </div>
    </div>

    <div class="feedback-container">
      <!-- 反馈表单 -->
      <div class="feedback-form">
        <!-- 联系方式 -->
        <div class="form-card">
          <div class="form-label">
            <UserOutlined class="label-icon" />
            <span>联系方式</span>
          </div>
          <a-input
            v-model:value="phone"
            placeholder="请输入手机号或邮箱"
            size="large"
            class="form-input"
          />
          <div class="form-hint">便于我们回复您（选填）</div>
        </div>

        <!-- 反馈类型 -->
        <div class="form-card">
          <div class="form-label">
            <TagsOutlined class="label-icon" />
            <span>反馈类型</span>
          </div>
          <div class="type-tags">
            <span
              v-for="type in feedbackTypes"
              :key="type.value"
              class="type-tag"
              :class="{ active: selectedType === type.value }"
              @click="selectedType = type.value"
            >
              {{ type.label }}
            </span>
          </div>
        </div>

        <!-- 反馈内容 -->
        <div class="form-card">
          <div class="form-label">
            <FileTextOutlined class="label-icon" />
            <span>反馈内容</span>
          </div>
          <a-textarea
            v-model:value="content"
            placeholder="请详细描述您的建议或问题..."
            :maxlength="500"
            show-count
            :rows="6"
            class="form-textarea"
          />
          <div class="form-hint">{{ feedbackTip }}</div>
        </div>

        <!-- 提交按钮 -->
        <a-button
          type="primary"
          size="large"
          :loading="loading"
          @click="submitFeedback"
          class="submit-btn"
        >
          <SendOutlined /> 提交反馈
        </a-button>
      </div>
    </div>

    <!-- 成功提示弹窗 -->
    <a-modal
      v-model:open="successModal"
      :footer="null"
      :closable="false"
      :maskClosable="false"
      centered
      class="success-modal"
    >
      <div class="modal-content">
        <div class="success-icon">
          <CheckCircleFilled />
        </div>
        <h3>提交成功</h3>
        <p>感谢您的反馈，我们会认真处理！</p>
        <a-button type="primary" size="large" @click="successModal = false" class="modal-btn">
          我知道了
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  MessageOutlined,
  UserOutlined,
  TagsOutlined,
  FileTextOutlined,
  SendOutlined,
  CheckCircleFilled
} from '@ant-design/icons-vue'
import { ApiServer } from '@/utils/taskService'
import API from '@/utils/api'

const phone = ref('')
const content = ref('')
const selectedType = ref('suggest')
const loading = ref(false)
const successModal = ref(false)

const feedbackTypes = [
  { value: 'suggest', label: '功能建议' },
  { value: 'bug', label: '问题反馈' },
  { value: 'experience', label: '体验建议' },
  { value: 'other', label: '其他' }
]

const feedbackTip = '请详细描述您的建议或问题，避免纯数字、无意义内容。我们会认真处理每一条反馈！'

function isQualityContent(text: string): boolean {
  if (/^\d+$/.test(text.trim())) return false
  const lowQualityList = ['测试', '111', '222', '333', '好', '不错', '无', '无反馈', '无意见', '无建议', 'ok', 'test', 'hello', 'hi']
  if (lowQualityList.some(w => text.trim().toLowerCase() === w.toLowerCase())) return false
  if (text.trim().length < 5) return false
  return true
}

async function submitFeedback() {
  if (!content.value || content.value.trim().length === 0) {
    message.error('反馈内容不能为空')
    return
  }
  if (content.value.length > 500) {
    message.error('反馈内容不能超过500字')
    return
  }
  if (!isQualityContent(content.value)) {
    message.error('请填写有价值的反馈内容')
    return
  }
  if (phone.value) {
    const phoneRegex = /^1[3-9]\d{9}$/
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!phoneRegex.test(phone.value) && !emailRegex.test(phone.value)) {
      message.error('请输入正确的手机号或邮箱')
      return
    }
  }

  loading.value = true
  try {
    const res = await ApiServer.request({
      url: API.BASE_URL + API.FEEDBACK,
      method: 'POST',
      data: { content: content.value, phone: phone.value, type: selectedType.value },
      headers: { 'Content-Type': 'application/json' }
    })
    loading.value = false
    if (res && res.data && res.data.success !== false) {
      successModal.value = true
      content.value = ''
      phone.value = ''
      selectedType.value = 'suggest'
    } else {
      message.error(res?.data?.msg || '提交失败，请稍后再试')
    }
  } catch (err: any) {
    loading.value = false
    message.error(err?.message || '提交失败，请检查网络')
  }
}
</script>

<style scoped>
.feedback-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: var(--bg-primary);
}

/* 页面头部 */
.page-header {
  max-width: 720px;
  margin: 0 auto 32px;
  padding: 40px;
  background: linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  backdrop-filter: blur(10px);
}

.header-text h1 {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-text p {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

/* 反馈容器 */
.feedback-container {
  max-width: 720px;
  margin: 0 auto;
}

/* 表单卡片 */
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.form-card:hover {
  border-color: var(--glass-border-hover);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.form-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.label-icon {
  font-size: 18px;
  color: var(--accent-blue);
}

.form-input {
  border-radius: 12px;
  height: 48px;
}

.form-textarea {
  border-radius: 12px;
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 8px;
}

/* 反馈类型标签 */
.type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-tag {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  background: var(--glass-surface-hover);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.type-tag:hover {
  background: rgba(0, 114, 255, 0.1);
  color: var(--accent-blue);
}

.type-tag.active {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple)) !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(0, 114, 255, 0.3);
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 114, 255, 0.4);
}

/* 成功弹窗 */
.success-modal :deep(.ant-modal-content) {
  border-radius: 20px;
  overflow: hidden;
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #34c759, #30d158);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
  margin-bottom: 20px;
}

.modal-content h3 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.modal-content p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

.modal-btn {
  min-width: 140px;
  height: 44px;
  border-radius: 22px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    padding: 28px 20px;
  }

  .header-content {
    gap: 16px;
  }

  .header-icon {
    width: 52px;
    height: 52px;
    font-size: 24px;
  }

  .header-text h1 {
    font-size: 22px;
  }

  .form-card {
    padding: 16px;
  }

  .type-tags {
    gap: 8px;
  }

  .type-tag {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
