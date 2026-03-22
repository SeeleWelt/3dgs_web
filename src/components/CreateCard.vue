<template>
  <div 
    class="create-card" 
    :class="[`color-${color}`]"
    @click="$emit('click')"
  >
    <div class="card-content">
      <div class="icon-wrapper">
        <component :is="icon" />
      </div>
      <div class="card-info">
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
    </div>
    <span v-if="pro" class="pro-badge">{{ t('common.pro') }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

defineProps<{
  title: string
  description: string
  icon: () => ReturnType<typeof import('vue').h>
  pro: boolean
  color: 'pink' | 'orange' | 'red'
  index?: number
}>()

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.create-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.create-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--glass-border-hover);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Blue gradient for all scan types */
.color-pink .icon-wrapper,
.color-orange .icon-wrapper,
.color-red .icon-wrapper {
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: white;
}

.card-info h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.card-info p {
  font-size: 13px;
  color: var(--text-secondary);
}

.pro-badge {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

/* Mobile */
@media (max-width: 640px) {
  .create-card {
    padding: 16px;
  }

  .icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .card-info h3 {
    font-size: 14px;
  }

  .card-info p {
    font-size: 12px;
  }
}
</style>
