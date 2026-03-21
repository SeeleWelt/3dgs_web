<template>
  <a-modal
    :open="open"
    title="剪裁图片"
    width="860px"
    :ok-text="'确定'"
    :cancel-text="'取消'"
    @ok="cropImage"
    @cancel="close"
  >
    <div class="cropper-wrap">
      <div class="cropper-box">
        <img ref="cropimg" :src="imgSrc" alt="cropper" />
      </div>

      <div class="cutter-tool">
        <a-button class="tool-btn" @click="flipHorizontal">水平翻转</a-button>
        <a-button class="tool-btn" @click="flipVertically">垂直翻转</a-button>
        <a-button class="tool-btn" @click="turnImg(90)">右旋90°</a-button>
        <a-button class="tool-btn" @click="turnImg(-90)">左旋90°</a-button>
      </div>

      <div class="rotation-row">
        <a-slider
          v-model:value="rotationAngle"
          :min="-180"
          :max="180"
          :marks="marks"
          @change="sliderInput"
        />
        <a-input-number
          v-model:value="rotationAngle"
          :min="-180"
          :max="180"
          @change="sliderInput"
        />
      </div>

      <div class="dialog-footer">
        <a-tag color="processing">原图 {{ quality }}</a-tag>
        <div class="quality-area">
          <span class="quality-label">品质</span>
          <a-slider
            v-model:value="imageQuality"
            :min="0"
            :max="10"
            :tooltip="{ formatter: formatTooltip }"
            class="quality-slider"
          />
          <a-button @click="reset">重置</a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

type CropResult = {
  name: string
  size: number
  raw: File
  url: string
  dataUrl: string
}

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'crop', payload: CropResult): void
  (e: 'cancel'): void
}>()

const props = defineProps<{
  open: boolean
  image: string
  fileName?: string
  aspectRatio?: string
  imgFormat?: 'jpeg' | 'png' | 'webp' | ''
  imageSize?: number
}>()

const cropimg = ref<HTMLImageElement | null>(null)
const cropper = ref<any>(null)
const imgSrc = ref('')
const rotationAngle = ref(0)
const imageQuality = ref(10)
const quality = ref('')
const scaleX = ref(1)
const scaleY = ref(1)

const marks = {
  '-180': '-180°',
  0: '0°',
  180: '180°'
}

const aspectRatioValue = ref<number>(NaN)
const mimeType = ref('image/jpeg')

const close = () => {
  emit('update:open', false)
  emit('cancel')
}

const parseAspectRatio = (val?: string) => {
  if (!val) return NaN
  const parts = val.split(':')
  if (parts.length !== 2) return NaN
  const w = Number(parts[0])
  const h = Number(parts[1])
  if (!w || !h) return NaN
  return w / h
}

const formatTooltip = (val?: number) => {
  return `${(Number(val || 0) / 10).toFixed(1)}`
}

const getQuality = (size?: number) => {
  if (!size || size <= 0) {
    quality.value = '-'
    return
  }
  const kb = size / 1024
  if (kb >= 1024) {
    quality.value = `${(kb / 1024).toFixed(2)}M`
  } else if (kb >= 1) {
    quality.value = `${kb.toFixed(2)}K`
  } else {
    quality.value = `${(kb * 1024).toFixed(2)}B`
  }
}

const initCropper = () => {
  if (!cropimg.value) return
  cropper.value?.destroy?.()
  cropper.value = new (Cropper as any)(cropimg.value, {
    dragMode: 'move',
    aspectRatio: aspectRatioValue.value,
    responsive: true,
    checkOrientation: true,
    modal: true,
    guides: true,
    center: true,
    highlight: true,
    background: true,
    autoCrop: true,
    autoCropArea: 1,
    movable: true,
    rotatable: true,
    scalable: true,
    zoomable: true,
    zoomOnTouch: true,
    zoomOnWheel: true,
    wheelZoomRatio: 0.1,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    viewMode: 1
  })
}

watch(
  () => props.imgFormat,
  (val) => {
    const map: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      '': 'image/jpeg'
    }
    mimeType.value = map[val || ''] || 'image/jpeg'
  },
  { immediate: true }
)

watch(
  () => props.aspectRatio,
  (val) => {
    aspectRatioValue.value = parseAspectRatio(val)
  },
  { immediate: true }
)

watch(
  () => props.open,
  async (val) => {
    if (!val) {
      cropper.value?.destroy?.()
      cropper.value = null
      rotationAngle.value = 0
      imageQuality.value = 10
      scaleX.value = 1
      scaleY.value = 1
      return
    }
    imgSrc.value = props.image || ''
    getQuality(props.imageSize)
    await nextTick()
    initCropper()
  },
  { immediate: true }
)

watch(
  () => props.image,
  (val) => {
    imgSrc.value = val || ''
    if (props.open && cropper.value && val) {
      cropper.value.replace?.(val)
    }
  }
)

const flipHorizontal = () => {
  scaleX.value = scaleX.value === 1 ? -1 : 1
  cropper.value?.scale?.(scaleX.value, scaleY.value)
}

const flipVertically = () => {
  scaleY.value = scaleY.value === 1 ? -1 : 1
  cropper.value?.scale?.(scaleX.value, scaleY.value)
}

const turnImg = (deg: number) => {
  cropper.value?.rotate?.(deg)
}

const sliderInput = (val?: number | null) => {
  cropper.value?.rotateTo?.(Number(val || 0))
}

const reset = () => {
  cropper.value?.reset?.()
  rotationAngle.value = 0
  imageQuality.value = 10
  scaleX.value = 1
  scaleY.value = 1
}

const cropImage = () => {
  const canvas = cropper.value?.getCroppedCanvas?.()
  if (!canvas) return

  const fileName = props.fileName || 'cropped-image.jpg'
  canvas.toBlob(
    (blob: Blob | null) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const file = new File([blob], fileName, {
        type: blob.type,
        lastModified: Date.now()
      })
      const dataUrl = canvas.toDataURL(mimeType.value, imageQuality.value / 10)
      emit('crop', {
        name: file.name,
        size: file.size,
        raw: file,
        url,
        dataUrl
      })
      emit('update:open', false)
    },
    mimeType.value,
    imageQuality.value / 10
  )
}
</script>

<style scoped>
.cropper-wrap {
  width: 100%;
}

.cropper-box {
  width: 100%;
  height: 42vh;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
}

.cropper-box img {
  max-height: 100%;
  width: 100%;
  object-fit: contain;
}

.cutter-tool {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.tool-btn {
  border-radius: 8px;
}

.rotation-row {
  width: min(520px, 100%);
  margin: 16px auto 0;
  display: grid;
  grid-template-columns: 1fr 110px;
  gap: 12px;
  align-items: center;
}

.dialog-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.quality-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quality-label {
  font-weight: 600;
  white-space: nowrap;
}

.quality-slider {
  width: 140px;
}

@media (max-width: 768px) {
  :deep(.ant-modal) {
    width: calc(100vw - 24px) !important;
    max-width: calc(100vw - 24px) !important;
  }

  .cropper-box {
    height: 32vh;
  }

  .rotation-row {
    grid-template-columns: 1fr;
  }

  .dialog-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .quality-area {
    width: 100%;
    flex-wrap: wrap;
  }

  .quality-slider {
    width: min(240px, 100%);
  }
}
</style>
