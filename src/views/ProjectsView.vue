<template>
  <div class="projects-view">
    <h1 class="page-title">{{ t('sidebar.explore') }}</h1>
    <ProjectsSection />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ProjectsSection from '../components/ProjectsSection.vue'

const { t } = useI18n()
</script>

<style scoped>
.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  letter-spacing: -0.01em;
}
</style>
