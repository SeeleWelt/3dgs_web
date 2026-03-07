<template>
  <div class="model-detail-page" :data-theme="themeStore.appliedTheme">
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

      <!-- Action Buttons -->
      <div class="action-bar">
        <button class="action-btn" @click="toggleFullscreen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
          </svg>
          {{ t('model.fullscreen') }}
        </button>
        <button class="action-btn" @click="resetView">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          {{ t('model.reset') }}
        </button>
        <button class="action-btn orange-gradient" @click="handleEmbed">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
          {{ t('model.embed') }}
        </button>
        <button class="action-btn purple-gradient" @click="handleShare">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          {{ t('model.share') }}
        </button>
        <button class="action-btn primary" @click="exportModel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {{ t('model.export') }}
        </button>
      </div>

      <!-- Grid Toggle -->
      <button class="grid-toggle" @click="toggleGrid">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '../stores/theme'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const themeStore = useThemeStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const modelTitle = ref('black gear mechanism')
const isAutoRotating = ref(true)
const showGrid = ref(true)

let animationId: number | null = null
let rotationAngle = 0

// Simulated 3D rendering with auto rotation
const render3D = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set canvas size
  canvas.width = canvas.offsetWidth * window.devicePixelRatio
  canvas.height = canvas.offsetHeight * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const width = canvas.offsetWidth
  const height = canvas.offsetHeight
  const centerX = width / 2
  const centerY = height / 2

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f5f5f7')
  gradient.addColorStop(1, '#e8e8ed')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Draw grid if enabled
  if (showGrid.value) {
    drawGrid(ctx, width, height)
  }

  // Auto rotation
  if (isAutoRotating.value) {
    rotationAngle += 0.005 // Slow rotation speed
  }

  // Draw 3D model (simulated with rotating gears)
  drawGearMechanism(ctx, centerX, centerY, rotationAngle)

  animationId = requestAnimationFrame(render3D)
}

const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'
  ctx.lineWidth = 1

  const gridSize = 40
  
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

const drawGearMechanism = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, angle: number) => {
  // Main large gear
  drawGear(ctx, centerX, centerY, 120, 16, angle, '#2c2c2e')
  
  // Medium gear (connected)
  const mediumX = centerX + 160
  const mediumY = centerY - 20
  drawGear(ctx, mediumX, mediumY, 80, 12, -angle * 1.5, '#3a3a3c')
  
  // Small gear
  const smallX = centerX - 100
  const smallY = centerY + 80
  drawGear(ctx, smallX, smallY, 50, 10, angle * 2, '#48484a')
  
  // Additional decorative gears
  const gear4X = centerX + 80
  const gear4Y = centerY - 120
  drawGear(ctx, gear4X, gear4Y, 40, 8, -angle * 2.5, '#5c5c5e')
}

const drawGear = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  radius: number, 
  teeth: number, 
  rotation: number,
  color: string
) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)

  // Draw gear body
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // Draw teeth
  for (let i = 0; i < teeth; i++) {
    const toothAngle = (Math.PI * 2 / teeth) * i
    ctx.save()
    ctx.rotate(toothAngle)
    
    ctx.beginPath()
    ctx.rect(-8, -radius, 16, radius * 0.4)
    ctx.fillStyle = color
    ctx.fill()
    
    ctx.restore()
  }

  // Draw center hole
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2)
  ctx.fillStyle = '#f5f5f7'
  ctx.fill()

  // Draw inner detail
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  ctx.restore()
}

const goBack = () => {
  router.back()
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const resetView = () => {
  rotationAngle = 0
}

const exportModel = () => {
  console.log('Exporting model...')
}

const handleEmbed = () => {
  console.log('Embedding model...')
  // 复制嵌入代码到剪贴板
  const embedCode = `<iframe src="${window.location.origin}/model/${route.params.id}" width="100%" height="500px" frameborder="0"></iframe>`
  navigator.clipboard.writeText(embedCode).then(() => {
    alert(t('model.embedCopied'))
  })
}

const handleShare = () => {
  console.log('Sharing model...')
  // 使用Web Share API
  if (navigator.share) {
    navigator.share({
      title: modelTitle.value,
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert(t('model.linkCopied'))
    })
  }
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

onMounted(() => {
  // Simulate loading
  setTimeout(() => {
    isLoading.value = false
    render3D()
  }, 1500)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
.model-detail-page {
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

.action-bar {
  position: absolute;
  bottom: 30px;
  right: 30px;
  display: flex;
  gap: 12px;
  z-index: 100;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--glass-surface);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: var(--glass-surface-hover);
  transform: translateY(-2px);
}

.action-btn.primary {
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: white;
  border: none;
}

.action-btn.primary:hover {
  box-shadow: 0 4px 12px rgba(0, 114, 255, 0.3);
}

.action-btn.orange-gradient {
  background: linear-gradient(135deg, #ffa726, #ff7043);
  color: white;
  border: none;
}

.action-btn.orange-gradient:hover {
  box-shadow: 0 4px 12px rgba(255, 112, 67, 0.4);
  transform: translateY(-2px);
}

.action-btn.purple-gradient {
  background: linear-gradient(135deg, #ab47bc, #7e57c2);
  color: white;
  border: none;
}

.action-btn.purple-gradient:hover {
  box-shadow: 0 4px 12px rgba(126, 87, 194, 0.4);
  transform: translateY(-2px);
}

.grid-toggle {
  position: absolute;
  bottom: 30px;
  left: 30px;
  z-index: 100;
  width: 44px;
  height: 44px;
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

.grid-toggle:hover {
  background: var(--glass-surface-hover);
}

/* Responsive */
@media (max-width: 768px) {
  .action-bar {
    bottom: 20px;
    right: 20px;
    flex-direction: column;
  }

  .action-btn {
    padding: 8px 14px;
    font-size: 13px;
  }

  .grid-toggle {
    bottom: 20px;
    left: 20px;
  }
}
</style>
