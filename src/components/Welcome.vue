<template>
  <div class="welcome">
    <h1>欢迎回来 👋</h1>
    <p>开始创建你的 3D 模型，让创意变为现实</p>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.welcome {
  margin-bottom: 40px;
}

.welcome h1 {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

.welcome p {
  font-size: 15px;
  color: var(--text-secondary);
}

/* Extra Large Desktop (1920px+) */
@media (min-width: 1920px) {
  .welcome h1 {
    font-size: 36px;
  }
}

/* Small Desktop (1024px - 1279px) */
@media (min-width: 1024px) and (max-width: 1279px) {
  .welcome h1 {
    font-size: 28px;
  }
}

/* Tablet & Mobile */
@media (max-width: 1023px) {
  .welcome h1 {
    font-size: 24px;
  }

  .welcome p {
    font-size: 14px;
  }
}

/* Mobile (<= 640px) */
@media (max-width: 640px) {
  .welcome h1 {
    font-size: 22px;
  }
}
</style>
