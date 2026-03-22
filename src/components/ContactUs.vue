<template>
  <a-modal
    v-model:open="isOpen"
    :title="t('contactUs.title')"
    :footer="null"
    :width="520"
    :centered="true"
    @cancel="handleClose"
  >
    <!-- 旧版二维码生成与布局，暂时注释保留 -->
    <!--
    <div class="contact-content">
      <div class="qr-wrapper">
        <div class="qr-main">
          <div class="qr-container">
            <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="联系我们二维码" class="qr-code" />
            <div v-else class="qr-loading">生成中...</div>
          </div>
        </div>
        <div class="corner-decor top-left"></div>
        <div class="corner-decor top-right"></div>
        <div class="corner-decor bottom-left"></div>
        <div class="corner-decor bottom-right"></div>
      </div>
      <p class="contact-tip">扫码添加官方微信</p>
    </div>
    -->

    <div class="contact-panel">
      <div class="contact-head">
        <h3 class="contact-title">{{ t('contactUs.wechat.title') }}</h3>
        <p class="contact-subtitle">{{ t('contactUs.wechat.subtitle') }}</p>
      </div>

      <div class="contact-body">
        <div class="qr-frame">
          <img
            v-if="qrImageUrl && !imageLoadFailed"
            :src="qrImageUrl"
            :alt="t('contactUs.wechat.qrAlt')"
            class="qr-image"
            @error="imageLoadFailed = true"
          />
          <div v-else class="qr-placeholder">
            <span>{{ t('contactUs.wechat.qrPlaceholder') }}</span>
          </div>
        </div>

        <div class="contact-info">
          <div class="wechat-id">
            <span class="wechat-label">{{ t('contactUs.wechat.wechatIdLabel') }}</span>
            <span class="wechat-value">{{ wechatId }}</span>
          </div>
          <button class="copy-btn" @click="copyWeChat">{{ t('contactUs.wechat.copyWechatId') }}</button>
          <div class="wechat-note">
            <span class="note-dot"></span>
            <span>{{ t('contactUs.wechat.note') }}</span>
          </div>
        </div>
      </div>

    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'

const { t } = useI18n({ useScope: 'global' })

const isOpen = ref(false)
// 旧版二维码生成逻辑暂时注释保留
// const qrCodeUrl = ref('')
// const contactInfo = ref('https://www.baidu.com')
// const logoUrl = '/default.svg'
// const generateQrCode = async () => {
//   try {
//     const canvas = document.createElement('canvas')
//     await QRCode.toCanvas(canvas, contactInfo.value, {
//       width: 180,
//       margin: 2,
//       errorCorrectionLevel: 'H',
//       color: {
//         dark: '#000000',
//         light: '#ffffff'
//       }
//     })
//
//     const ctx = canvas.getContext('2d')
//     if (ctx) {
//       const logoSize = 40
//       const logoX = (canvas.width - logoSize) / 2
//       const logoY = (canvas.height - logoSize) / 2
//
//       const img = new Image()
//       img.crossOrigin = 'anonymous'
//       img.src = logoUrl
//
//       await new Promise((resolve, reject) => {
//         img.onload = resolve
//         img.onerror = reject
//       })
//
//       ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
//     }
//
//     qrCodeUrl.value = canvas.toDataURL('image/png')
//   } catch (err) {
//     console.error('生成二维码失败:', err)
//   }
// }

const props = defineProps<{
  qrImageUrl?: string
  wechatId?: string
}>()

const qrImageUrl = computed(() => props.qrImageUrl ?? '/contact.png')
const wechatId = computed(() => props.wechatId || 'w757765103')
const imageLoadFailed = ref(false)

const open = async () => {
  isOpen.value = true
  imageLoadFailed.value = false
}

const handleClose = () => {
  isOpen.value = false
}

const copyWeChat = async () => {
  if (!wechatId.value) return
  try {
    await navigator.clipboard.writeText(wechatId.value)
    message.success(t('contactUs.wechat.copySuccess'))
  } catch (error) {
    message.warning(t('contactUs.wechat.copyFailed'))
  }
}

defineExpose({
  open
})
</script>

<style scoped>
.contact-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.qr-wrapper {
  position: relative;
  padding: 20px;
}

.qr-main {
  position: relative;
}

.qr-container {
  width: 160px;
  height: 160px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.qr-code {
  width: 100%;
  height: 100%;
}

.qr-loading {
  color: #999;
  font-size: 14px;
}

.corner-decor {
  position: absolute;
  width: 16px;
  height: 16px;
}

.corner-decor::before {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: #1677ff;
  border-style: solid;
}

.top-left {
  top: 4px;
  left: 4px;
}

.top-left::before {
  border-width: 2px 0 0 2px;
  border-radius: 4px 0 0 0;
}

.top-right {
  top: 4px;
  right: 4px;
}

.top-right::before {
  border-width: 2px 2px 0 0;
  border-radius: 0 4px 0 0;
}

.bottom-left {
  bottom: 4px;
  left: 4px;
}

.bottom-left::before {
  border-width: 0 0 2px 2px;
  border-radius: 0 0 0 4px;
}

.bottom-right {
  bottom: 4px;
  right: 4px;
}

.bottom-right::before {
  border-width: 0 2px 2px 0;
  border-radius: 0 0 4px 0;
}

.contact-tip {
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

@media (max-width: 640px) {
  :deep(.ant-modal) {
    width: calc(100vw - 24px) !important;
    max-width: calc(100vw - 24px) !important;
  }

  .qr-wrapper {
    padding: 16px;
  }

  .qr-container {
    width: 140px;
    height: 140px;
  }

  .contact-tip {
    font-size: 12px;
  }
}

.contact-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px 12px;
}

.contact-head {
  text-align: left;
}

.contact-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.contact-subtitle {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
}

.contact-body {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 22px;
  align-items: center;
}

.qr-frame {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qr-image {
  width: 88%;
  height: 88%;
  object-fit: contain;
}

.qr-placeholder {
  width: 88%;
  height: 88%;
  border-radius: 12px;
  border: 2px dashed rgba(14, 165, 233, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 12px;
  background: rgba(14, 165, 233, 0.06);
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 16px;
  border-left: 1px solid rgba(148, 163, 184, 0.35);
}

.wechat-id {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.wechat-label {
  font-size: 12px;
  color: #64748b;
}

.wechat-value {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.3px;
}

.copy-btn {
  border: none;
  background: linear-gradient(135deg, #0ea5e9, #14b8a6);
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(14, 165, 233, 0.28);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.copy-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(14, 165, 233, 0.32);
}

.wechat-note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #475569;
  background: rgba(249, 115, 22, 0.1);
  border: 1px dashed rgba(249, 115, 22, 0.35);
  padding: 6px 10px;
  border-radius: 999px;
}

.note-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f97316;
}

@media (max-width: 640px) {
  .contact-panel {
    padding: 8px 0 4px;
  }

  .contact-body {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .contact-info {
    align-items: center;
    border-left: none;
    padding-left: 0;
  }

  .copy-btn {
    width: 100%;
  }
}
</style>
.wechat-id {
  align-items: center;
}

.wechat-value {
  font-size: 17px;
}

.copy-btn {
  padding: 11px 16px;
  font-size: 14px;
}
