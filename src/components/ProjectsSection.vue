<template>
  <div class="projects-section">
    <div class="projects-header">
      <div class="tabs">
        <div
          v-for="tab in typeTabs"
          :key="tab"
          class="tab"
          :class="{ active: activeTypeTab === tab }"
          @click="activeTypeTab = tab"
        >
          {{ tab }}
        </div>
      </div>
      <div class="tabs" style="margin-bottom: 0;">
        <div
          v-for="tab in statusTabs"
          :key="tab"
          class="tab"
          :class="{ active: activeStatusTab === tab }"
          @click="activeStatusTab = tab"
        >
          {{ tab }}
        </div>
      </div>
    </div>

    <EmptyState v-if="!hasProjects" :type="activeTypeTab === '扫描' ? 'mesh-scan' : '3dgs-scan'" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EmptyState from './EmptyState.vue'

const activeTypeTab = ref('3DGS')
const activeStatusTab = ref('全部')
const hasProjects = ref(false)

const typeTabs = ['3DGS']
const statusTabs = ['全部', '已完成', '处理中']
</script>

<style scoped>
.projects-section {
  margin-bottom: 40px;
}

.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
  width: fit-content;
}

.tab {
  padding: 10px 20px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Tablet & Mobile */
@media (max-width: 1023px) {
  .projects-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .tabs {
    width: 100%;
  }

  .tab {
    flex: 1;
    text-align: center;
  }
}

/* Compact Vertical Layout */
@media (max-height: 720px) {
  .projects-section {
    margin-bottom: 24px;
  }
}
</style>
