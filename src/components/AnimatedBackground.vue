<template>
  <div class="background">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.background {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.background::before {
  content: '';
  position: absolute;
  inset: -50%;
  background: radial-gradient(ellipse at 20% 20%, rgba(10, 132, 255, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(191, 90, 242, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(255, 55, 95, 0.05) 0%, transparent 50%);
  transition: opacity 0.4s ease;
}

[data-theme="light"] .background::before {
  background: radial-gradient(ellipse at 20% 20%, rgba(0, 122, 255, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(175, 82, 222, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(255, 55, 95, 0.08) 0%, transparent 50%);
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: var(--orb-opacity);
  animation: floatOrb 25s ease-in-out infinite;
  transition: opacity 0.4s ease;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--accent-blue), transparent);
  top: -200px;
  left: -150px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--accent-purple), transparent);
  bottom: -150px;
  right: -150px;
  animation-delay: -8s;
}

@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -30px) scale(1.1); }
}

/* Compact Vertical Layout */
@media (max-height: 720px) {
  .orb {
    opacity: 0.3;
  }
}
</style>
