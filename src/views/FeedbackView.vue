<template>
  <div class="feedback-page">
    <div class="feedback-container">
      <!-- 反馈表单 -->
      <div class="feedback-form">
        <!-- 联系方式 -->
        <div class="form-card">
          <div class="form-label">
            <UserOutlined class="label-icon" />
            <span>{{ t('feedbackLang.contact') }}</span>
          </div>
          <a-input
            v-model:value="phone"
            :maxlength="40"
            :placeholder="t('feedbackLang.contactPlaceholder')"
            size="large"
            class="form-input"
          />
          <div class="form-hint">{{ t('feedbackLang.contactHint') }}</div>
        </div>

        <!-- 反馈内容 -->
        <div class="form-card">
          <div class="form-label">
            <FileTextOutlined class="label-icon" />
            <span>{{ t('feedbackLang.content') }}</span>
          </div>
          <a-textarea
            v-model:value="content"
            :placeholder="t('feedbackLang.contentPlaceholder')"
            :maxlength="500"
            show-count
            :rows="6"
            class="form-textarea"
          />
          <div class="form-hint">{{ t('feedbackLang.contentHint') }}</div>
        </div>

        <!-- 提交按钮 -->
        <a-button
          type="primary"
          size="large"
          :loading="loading"
          @click="submitFeedback"
          class="submit-btn"
        >
          <SendOutlined /> {{ t('feedbackLang.submit') }}
        </a-button>
      </div>

      <!-- <div class="faq-section">
        <div class="faq-header">
          <QuestionCircleOutlined class="faq-icon" />
          <div class="faq-title">
            <h2>常见问题</h2>
            <p>关于 MetaST 您需要知道的一切</p>
          </div>
        </div>

        <a-collapse v-model:activeKey="activeFaqKeys" :bordered="false" class="faq-collapse">
          <a-collapse-panel
            v-for="faq in faqList"
            :key="faq.id"
            :header="faq.question"
            class="faq-item"
          >
            <div class="faq-answer" v-html="faq.answer"></div>
          </a-collapse-panel>
        </a-collapse>
      </div> -->
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
        <h3>{{ t('feedbackLang.successTitle') }}</h3>
        <p>{{ t('feedbackLang.successDesc') }}</p>
        <a-button type="primary" size="large" @click="successModal = false" class="modal-btn">
          {{ t('feedbackLang.gotIt') }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import {
  MessageOutlined,
  UserOutlined,
  FileTextOutlined,
  SendOutlined,
  CheckCircleFilled,
  QuestionCircleOutlined
} from '@ant-design/icons-vue'
import { ApiServer } from '@/utils/taskService'
import API from '@/utils/api'

const phone = ref('')
const content = ref('')
const loading = ref(false)
const successModal = ref(false)

const { t } = useI18n()

// 常见问题
const activeFaqKeys = ref<string[]>([])

interface FaqItem {
  id: string
  question: string
  answer: string
}

const faqList = ref<FaqItem[]>([
  {
    id: '1',
    question: 'MetaST 支持哪些文件格式？',
    answer: 'MetaST 支持视频格式（mp4, mov）和图片格式（jpg, png, webp）。视频时长最长支持80秒，图片最多可上传150张。'
  },
  {
    id: '2',
    question: '如何获取算力点？',
    answer: '算力点可以通过充值获得，用于支付模型生成费用。新用户注册可获得一定数量的免费算力点。'
  },
  {
    id: '3',
    question: '模型生成需要多长时间？',
    answer: '模型生成时间取决于输入素材的复杂程度，一般视频素材需要5-15分钟，图片素材需要3-10分钟。'
  },
  {
    id: '4',
    question: '生成的模型可以商用吗？',
    answer: '您拥有生成模型的完整使用权，可以用于个人或商业用途，但我们保留对技术的最终解释权。'
  },
  {
    id: '5',
    question: '如何查看我的任务进度？',
    answer: '在"项目"页面可以查看所有任务的进度状态，包括等待中、处理中、已完成等状态。'
  }
])

function isQualityContent(text: string): boolean {
  if (/^\d+$/.test(text.trim())) return false
  const lowQualityList = ['测试', '111', '222', '333', '好', '不错', '无', '无反馈', '无意见', '无建议', 'ok', 'test', 'hello', 'hi']
  if (lowQualityList.some(w => text.trim().toLowerCase() === w.toLowerCase())) return false
  if (text.trim().length < 5) return false
  return true
}

async function submitFeedback() {
  if (!content.value || content.value.trim().length === 0) {
    message.error(t('feedbackLang.contentEmpty'))
    return
  }
  if (content.value.length > 500) {
    message.error(t('feedbackLang.contentTooLong'))
    return
  }
  if (!isQualityContent(content.value)) {
    message.error(t('feedbackLang.contentLowQuality'))
    return
  }
  if (phone.value) {
    const phoneRegex = /^1[3-9]\d{9}$/
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!phoneRegex.test(phone.value) && !emailRegex.test(phone.value)) {
      message.error(t('feedbackLang.invalidContact'))
      return
    }
  }

  loading.value = true
  try {
    const res = await ApiServer.request({
      url: API.BASE_URL + API.FEEDBACK,
      method: 'POST',
      data: { content: content.value, phone: phone.value },
      headers: { 'Content-Type': 'application/json' }
    })
    loading.value = false
    if (res && res.data && res.data.success !== false) {
      successModal.value = true
      content.value = ''
      phone.value = ''
    } else {
      message.error(res?.data?.msg || t('feedbackLang.submitFail'))
    }
  } catch (err: any) {
    loading.value = false
    message.error(err?.message || t('feedbackLang.networkError'))
  }
}
</script>

<style scoped>
.feedback-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
}

/* 页面头部 */
.page-header {
  width: 100%;
  margin-bottom: 32px;
  padding: 40px 24px;
  background: linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%);
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
  max-width: 720px;
  margin: 0 auto;
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
  animation: slideUp 0.5s ease backwards;
}

.form-card:nth-child(1) { animation-delay: 0.1s; }
.form-card:nth-child(2) { animation-delay: 0.15s; }
.form-card:nth-child(3) { animation-delay: 0.2s; }

.form-card:hover {
  border-color: var(--glass-border-hover);
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
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.25s;
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
  .feedback-page {
    padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
  }

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

  .feedback-container {
    padding: 0;
  }

  .submit-btn {
    height: 48px;
    border-radius: 14px;
    font-size: 15px;
  }
}

/* 常见问题 */
.faq-section {
  margin-top: 48px;
  animation: slideUp 0.5s ease backwards;
  animation-delay: 0.2s;
}

.faq-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.faq-icon {
  font-size: 32px;
  color: var(--accent-blue);
}

.faq-title h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.faq-title p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.faq-collapse {
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-collapse :deep(.ant-collapse-header) {
  padding: 16px 20px !important;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary) !important;
  background: var(--glass-surface);
  border: none;
  border-radius: 12px !important;
  animation: slideUp 0.5s ease backwards;
}

.faq-collapse :deep(.ant-collapse-item:nth-child(1) .ant-collapse-header) { animation-delay: 0.25s; }
.faq-collapse :deep(.ant-collapse-item:nth-child(2) .ant-collapse-header) { animation-delay: 0.3s; }
.faq-collapse :deep(.ant-collapse-item:nth-child(3) .ant-collapse-header) { animation-delay: 0.35s; }
.faq-collapse :deep(.ant-collapse-item:nth-child(4) .ant-collapse-header) { animation-delay: 0.4s; }
.faq-collapse :deep(.ant-collapse-item:nth-child(5) .ant-collapse-header) { animation-delay: 0.45s; }

.faq-collapse :deep(.ant-collapse-item-active .ant-collapse-header) {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

:deep(.ant-collapse-item) {
  border: none;
}

.faq-collapse :deep(.ant-collapse-content-box) {
  padding: 16px 20px !important;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
  background: var(--glass-surface);
  border: none;
  border-radius: 0 0 12px 12px;
}

.faq-collapse :deep(.ant-collapse-expand-icon) {
  color: var(--accent-blue);
}

.faq-answer {
  color: var(--text-secondary);
  line-height: 1.7;
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
</style>
