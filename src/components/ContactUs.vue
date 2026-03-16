<template>
  <a-modal
    v-model:open="isOpen"
    title="联系我们"
    :footer="null"
    :width="360"
    :centered="true"
    @cancel="handleClose"
  >
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
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import QRCode from 'qrcode'

const isOpen = ref(false)
const qrCodeUrl = ref('')

const contactInfo = ref('https://www.baidu.com')

const logoUrl = '/default.svg'

const generateQrCode = async () => {
  try {
    // 先创建 canvas 生成二维码
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, contactInfo.value, {
      width: 180,
      margin: 2,
      errorCorrectionLevel: 'H', // 高错误纠正级别
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    const ctx = canvas.getContext('2d')
    if (ctx) {
      const logoSize = 40
      const logoX = (canvas.width - logoSize) / 2
      const logoY = (canvas.height - logoSize) / 2

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = logoUrl

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      // 绘制 logo
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
    }

    // 转换为 data URL
    qrCodeUrl.value = canvas.toDataURL('image/png')
  } catch (err) {
    console.error('生成二维码失败:', err)
  }
}

const open = async () => {
  isOpen.value = true
  // 每次打开时重新生成二维码
  await generateQrCode()
}

const handleClose = () => {
  isOpen.value = false
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
</style>
