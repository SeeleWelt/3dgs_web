<template>
  <div class="glb-viewer-page" :data-theme="themeStore.appliedTheme">
    <!-- 3D Viewer -->
    <div class="viewer-container">
      <!-- Back Button -->
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <!-- 3D Canvas -->
      <div class="canvas-wrapper">
        <canvas ref="canvasRef" class="model-canvas"></canvas>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <span>{{ t('model.loading') }}</span>
        </div>
      </div>

      <!-- Model Info Overlay -->
      <div class="model-overlay">
        <h1 class="model-title">{{ modelTitle }}</h1>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '../stores/theme'
import * as pc from 'playcanvas'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const themeStore = useThemeStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const modelTitle = ref('图片生成模型')

let app: pc.Application | null = null
let camera: pc.Entity | null = null
let isDragging = false
let lastMouseX = 0
let lastMouseY = 0
let yaw = 0
let pitch = 0
let distance = 2  // 初始距离，越小模型看起来越大

const setupCameraControls = () => {
  if (!app || !camera) return

  const mouse = app.mouse
  const canvas = canvasRef.value
  if (!canvas) return

  // Mouse down event
  mouse.on(pc.EVENT_MOUSEDOWN, (event: pc.MouseEvent) => {
    if (event.button === pc.MOUSEBUTTON_LEFT) {
      isDragging = true
      lastMouseX = event.x
      lastMouseY = event.y
    }
  })

  // Mouse move event
  mouse.on(pc.EVENT_MOUSEMOVE, (event: pc.MouseEvent) => {
    if (isDragging) {
      const deltaX = event.x - lastMouseX
      const deltaY = event.y - lastMouseY

      yaw -= deltaX * 0.01
      pitch -= deltaY * 0.01

      // Clamp pitch
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch))

      lastMouseX = event.x
      lastMouseY = event.y

      updateCameraPosition()
    }
  })

  // Mouse up event
  mouse.on(pc.EVENT_MOUSEUP, (event: pc.MouseEvent) => {
    if (event.button === pc.MOUSEBUTTON_LEFT) {
      isDragging = false
    }
  })

  // Mouse wheel event for zoom
  mouse.on(pc.EVENT_MOUSEWHEEL, (event: pc.MouseEvent) => {
    event.event.preventDefault() // Prevent browser zoom
    distance += event.wheelDelta * 0.1
    distance = Math.max(1, Math.min(100, distance))
    updateCameraPosition()
  })

  // Touch events for mobile
  const touch = app.touch
  if (touch) {
    touch.on(pc.EVENT_TOUCHSTART, (event: pc.TouchEvent) => {
      if (event.touches.length === 1) {
        isDragging = true
        lastMouseX = event.touches[0].x
        lastMouseY = event.touches[0].y
      }
    })

    touch.on(pc.EVENT_TOUCHMOVE, (event: pc.TouchEvent) => {
      if (isDragging && event.touches.length === 1) {
        const deltaX = event.touches[0].x - lastMouseX
        const deltaY = event.touches[0].y - lastMouseY

        yaw -= deltaX * 0.01
        pitch -= deltaY * 0.01

        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch))

        lastMouseX = event.touches[0].x
        lastMouseY = event.touches[0].y

        updateCameraPosition()
      }
    })

    touch.on(pc.EVENT_TOUCHEND, () => {
      isDragging = false
    })
  }
}

const updateCameraPosition = () => {
  if (!camera) return

  const x = distance * Math.sin(yaw) * Math.cos(pitch)
  const y = distance * Math.sin(pitch)
  const z = distance * Math.cos(yaw) * Math.cos(pitch)

  camera.setPosition(x, y, z)
  camera.lookAt(0, 0, 0)
}

const initPlayCanvas = async () => {
  if (!canvasRef.value) return

  // Create PlayCanvas application
  app = new pc.Application(canvasRef.value, {
    mouse: new pc.Mouse(canvasRef.value),
    touch: new pc.TouchDevice(canvasRef.value),
    keyboard: new pc.Keyboard(window)
  })

  // Set canvas fill mode
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)
  app.setCanvasResolution(pc.RESOLUTION_AUTO)

  // Create camera entity
  camera = new pc.Entity('camera')
  camera.addComponent('camera', {
    clearColor: new pc.Color(0.1, 0.1, 0.1),
    farClip: 1000
  })
  camera.setPosition(0, 0, distance)
  app.root.addChild(camera)

  // Add mouse event listeners for camera control
  setupCameraControls()

  // Create directional light
  const light = new pc.Entity('light')
  light.addComponent('light', {
    type: 'directional',
    color: new pc.Color(1, 1, 1),
    intensity: 1
  })
  light.setEulerAngles(45, 0, 0)
  app.root.addChild(light)

  // Add ambient light for better visibility from all angles
  app.scene.ambientLight = new pc.Color(0.8, 0.8, 0.8)

  // Load GLB model
  const modelUrl = "https://szgm.tenyunn.com:50585/aimodel/test.glb"
  try {
    const asset = new pc.Asset('model', 'container', { url: modelUrl })
    asset.on('load', () => {
      const modelEntity = asset.resource.instantiateRenderEntity()
      app!.root.addChild(modelEntity)
      
      // Center camera on model
      updateCameraPosition()
      
      isLoading.value = false
    })
    asset.on('error', (err) => {
      console.error('Failed to load GLB model:', err)
      isLoading.value = false
    })
    app.assets.add(asset)
    app.assets.load(asset)
  } catch (error) {
    console.error('Error loading GLB model:', error)
    isLoading.value = false
  }

  // Start the application
  app.start()
}

onMounted(() => {
  initPlayCanvas()
})

onUnmounted(() => {
  if (app) {
    app.destroy()
    app = null
  }
})
</script>

<style scoped>
.glb-viewer-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.viewer-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  width: 40px;
  height: 40px;
  background: var(--glass-surface);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: var(--glass-surface-hover);
  transform: scale(1.05);
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.model-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--glass-border);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.model-overlay {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.model-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 8px 16px;
  background: var(--glass-surface);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .back-btn {
    top: 10px;
    left: 10px;
  }

  .model-overlay {
    top: 10px;
  }
}
</style>