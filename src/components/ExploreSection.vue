<template>
  <div class="explore-section">
    <div class="section-title">探索社区作品</div>
    <div class="scroll-container">
      <ModelCard
        v-for="model in models"
        :key="model.id"
        :title="model.title"
        :author="model.author"
        :emoji="model.emoji"
        :is-new="model.isNew"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ModelCard from './ModelCard.vue'

interface ModelData {
  id: string
  title: string
  author: string
  emoji: string
  isNew: boolean
}

const models = ref<ModelData[]>([
  {
    id: '1',
    title: '白虎雕塑',
    author: 'ric',
    emoji: '🐅',
    isNew: true
  },
  {
    id: '2',
    title: '老式火车',
    author: 'remi',
    emoji: '🚂',
    isNew: true
  },
  {
    id: '3',
    title: '古堡遗迹',
    author: 'Axseru',
    emoji: '🏰',
    isNew: true
  },
  {
    id: '4',
    title: '电吉他',
    author: 'emovere',
    emoji: '🎸',
    isNew: false
  },
  {
    id: '5',
    title: '岩石标本',
    author: 'kirpartilhado',
    emoji: '🪨',
    isNew: false
  },
  {
    id: '6',
    title: '复古相机',
    author: '854fwtmpn8',
    emoji: '📷',
    isNew: false
  }
])
</script>

<style scoped>
.explore-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.scroll-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

/* Custom scrollbar */
.scroll-container::-webkit-scrollbar {
  height: 8px;
}

.scroll-container::-webkit-scrollbar-track {
  background: var(--glass-surface);
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: var(--glass-border-hover);
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Extra Large Desktop (1920px+) */
@media (min-width: 1920px) {
  :deep(.model-card) {
    width: 240px;
  }
}

/* Large Desktop (1440px - 1919px) */
@media (min-width: 1440px) and (max-width: 1919px) {
  :deep(.model-card) {
    width: 230px;
  }
}

/* Desktop (1280px - 1439px) */
@media (min-width: 1280px) and (max-width: 1439px) {
  :deep(.model-card) {
    width: 220px;
  }
}

/* Small Desktop (1024px - 1279px) */
@media (min-width: 1024px) and (max-width: 1279px) {
  :deep(.model-card) {
    width: 200px;
  }
}

/* Tablet & Mobile */
@media (max-width: 1023px) {
  :deep(.model-card) {
    width: 180px;
  }
}

/* Compact Vertical Layout */
@media (max-height: 720px) {
  .explore-section {
    margin-bottom: 24px;
  }
}
</style>
