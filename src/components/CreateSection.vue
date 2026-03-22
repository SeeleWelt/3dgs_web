<template>
  <div class="create-section">
    <div class="section-header">
      <h2 class="section-title">{{ t('home.startCreate') }}</h2>
    </div>
    <div class="create-container">
      <div class="create-grid">
        <CreateCard
          v-for="(card, index) in cards"
          :key="card.id"
          :title="card.title"
          :description="card.description"
          :icon="card.icon"
          :pro="card.pro"
          :color="card.color"
          :index="index"
          @click="handleClick(card.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import CreateCard from './CreateCard.vue'

const router = useRouter()
const { t } = useI18n()

interface CreateCardData {
  id: string
  title: string
  description: string
  icon: () => ReturnType<typeof h>
  pro: boolean
  color: 'pink' | 'orange' | 'red'
}

// AI Scan Icon
const AIScanIcon = () => h('svg', { width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
  h('circle', { cx: '8.5', cy: '8.5', r: '1.5' }),
  h('polyline', { points: '21 15 16 10 5 21' })
])

// 3DGS Scan Icon
const ThreeDGSScanIcon = () => h('svg', { width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' }),
  h('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
  h('line', { x1: '12', y1: '22.08', x2: '12', y2: '12' })
])

// 4DGS Scan Icon
const FourDGSScanIcon = () => h('svg', { width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('path', { d: 'M12 6v6l4 2' }),
  h('path', { d: 'M8 12h2' }),
  h('path', { d: 'M14 12h2' })
])

const cards = computed<CreateCardData[]>(() => [
  {
    id: 'ai-scan',
    title: t('home.aiScan'),
    description: t('home.aiScanDesc'),
    icon: AIScanIcon,
    pro: false,
    color: 'pink'
  },
  {
    id: '3dgs-scan',
    title: t('home.scan3dgs'),
    description: t('home.scan3dgsDesc'),
    icon: ThreeDGSScanIcon,
    pro: true,
    color: 'orange'
  },
  // {
  //   id: '4dgs-scan',
  //   title: t('home.scan4dgs'),
  //   description: t('home.scan4dgsDesc'),
  //   icon: FourDGSScanIcon,
  //   pro: true,
  //   color: 'red'
  // }
])

const handleClick = (id: string) => {
  if (id === '3dgs-scan') {
    router.push('/create/3dgs-scan')
  } else if (id === 'ai-scan') {
    message.info(String(t('common.comingSoon')))
    // router.push('/create/mesh-scan')
  } else if (id === '4dgs-scan') {
    message.info(String(t('common.comingSoon')))
  }
}
</script>

<style scoped>
.create-section {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.create-container {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(175, 82, 222, 0.08));
  border-radius: 16px;
  padding: 20px;
}

.create-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* Large Desktop */
@media (min-width: 1440px) {
  .create-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tablet */
@media (max-width: 1023px) {
  .create-grid {
    grid-template-columns: 1fr;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .create-container {
    padding: 16px;
  }
}
</style>
