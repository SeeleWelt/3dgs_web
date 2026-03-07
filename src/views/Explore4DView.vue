<template>
  <div class="explore-view">
    <!-- 4DGS Models Section -->
    <section class="explore-section">
      <div class="section-header">
        <h2 class="section-title">{{ t('explore.gs4dTitle') }}</h2>
        <p class="section-subtitle">{{ t('explore.weeklyUpdate') }}</p>
      </div>
      <div class="models-grid">
        <ModelCard
          v-for="model in gaussian4DModels"
          :key="model.id"
          :model="model"
          @click="openModelDetail(model)"
        />
      </div>
    </section>

    <!-- Community Cards -->
    <section class="community-section">
      <div class="community-cards">
        <!-- YouTube Card -->
        <div class="community-card youtube-card">
          <div class="card-header">
            <div class="platform-icon youtube-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </div>
            <div class="card-title">
              <h3>{{ t('explore.youtubeTitle') }}</h3>
              <p>{{ t('explore.youtubeDesc') }}</p>
            </div>
          </div>
          <div class="video-preview">
            <div class="video-thumb">
              <span class="play-icon">▶</span>
              <span class="video-title">Introducing 4D Gaussian Splatting for Dynamic Scenes...</span>
            </div>
            <div class="video-actions">
              <button class="action-btn">{{ t('explore.watchLater') }}</button>
              <button class="action-btn">{{ t('explore.share') }}</button>
            </div>
          </div>
        </div>

        <!-- Discord Card -->
        <div class="community-card discord-card">
          <div class="card-header">
            <div class="platform-icon discord-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div class="card-title">
              <h3>{{ t('explore.discordTitle') }}</h3>
              <p>{{ t('explore.discordDesc') }}</p>
            </div>
          </div>
          <div class="discord-preview">
            <div class="discord-banner">
              <span class="discord-logo">Discord</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ModelCard from '../components/ModelCard.vue'

const router = useRouter()
const { t } = useI18n()

interface Model {
  id: string
  title: string
  author: string
  image: string
  isNew: boolean
  type: 'gaussian4d'
}

const gaussian4DModels = ref<Model[]>([
  { id: '4d7', title: 'Moving Car', author: 'autoviz', image: '🚗', isNew: true, type: 'gaussian4d' },
  { id: '4d8', title: 'Walking Person', author: 'humanmotion', image: '🚶', isNew: true, type: 'gaussian4d' },
  { id: '4d9', title: 'Flying Bird', author: 'avianart', image: '🐦', isNew: false, type: 'gaussian4d' },
  { id: '4d10', title: 'Opening Flower', author: 'botanical', image: '🌸', isNew: false, type: 'gaussian4d' },
  { id: '4d11', title: 'Rolling Ball', author: 'physics3d', image: '⚽', isNew: false, type: 'gaussian4d' },
  { id: '4d12', title: 'Waving Flag', author: 'patriotart', image: '🚩', isNew: false, type: 'gaussian4d' }
])

const openModelDetail = (model: Model) => {
  router.push(`/model/${model.id}`)
}
</script>

<style scoped>
.explore-view {
  padding-bottom: 40px;
}

.explore-section {
  margin-bottom: 40px;
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.section-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

/* Community Section */
.community-section {
  margin-top: 40px;
}

.community-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.community-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.community-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.platform-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.youtube-icon {
  background: #ff0000;
  color: white;
}

.discord-icon {
  background: #5865f2;
  color: white;
}

.card-title h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-title p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Video Preview */
.video-preview {
  background: var(--glass-surface);
  border-radius: 12px;
  overflow: hidden;
}

.video-thumb {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  position: relative;
}

.play-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #ff0000;
  margin-bottom: 12px;
}

.video-title {
  font-size: 13px;
  color: white;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-actions {
  display: flex;
  padding: 10px;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px;
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--glass-surface);
  color: var(--text-primary);
}

/* Discord Preview */
.discord-preview {
  border-radius: 12px;
  overflow: hidden;
}

.discord-banner {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #5865f2, #7289da);
  display: flex;
  align-items: center;
  justify-content: center;
}

.discord-logo {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

/* Responsive */
@media (max-width: 1023px) {
  .models-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .community-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .models-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
