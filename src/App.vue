<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
}

html {
  -webkit-text-size-adjust: 100%;
}

img {
  max-width: 100%;
  height: auto;
}

button,
input,
select,
textarea {
  font: inherit;
}

a,
button {
  -webkit-tap-highlight-color: transparent;
}

:root {
  /* Light Theme (Default) */
  --bg-primary: #f5f5f7;
  --bg-secondary: #ffffff;
  --bg-tertiary: #e8e8ed;
  --text-primary: #1d1d1f;
  --text-secondary: rgba(0, 0, 0, 0.6);
  --text-tertiary: rgba(0, 0, 0, 0.4);
  --glass-surface: rgba(255, 255, 255, 0.7);
  --glass-surface-hover: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(0, 0, 0, 0.08);
  --glass-border-hover: rgba(0, 0, 0, 0.12);
  --accent-blue: #0072ff;
  --accent-purple: #AF52DE;
  --accent-pink: #FF375F;
  --accent-green: #34C759;
  --accent-orange: #FF9500;
  --gradient-primary: linear-gradient(135deg, #00c6ff, #0072ff);
  --orb-opacity: 0.6;
  --global-font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;

}

/* Dark Theme */
[data-theme="dark"] {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #141414;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-tertiary: rgba(255, 255, 255, 0.4);
  --glass-surface: rgba(255, 255, 255, 0.08);
  --glass-surface-hover: rgba(255, 255, 255, 0.12);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-border-hover: rgba(255, 255, 255, 0.2);
  --accent-blue: #0072ff;
  --accent-purple: #BF5AF2;
  --accent-pink: #FF375F;
  --accent-green: #30D158;
  --accent-orange: #FF9F0A;
  --gradient-primary: linear-gradient(135deg, #00c6ff, #0072ff);
  --orb-opacity: 0.4;
}



body {
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: var(--global-font-family);
  transition: background-color 0.4s ease, color 0.4s ease;
}

.app {
  display: flex;
  min-height: 100vh;
  position: relative;
}

.main {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
  min-width: 0;
}

.content {
  padding: 32px;
}

/* Extra Large Desktop (1920px+) */
@media (min-width: 1920px) {
  .content {
    max-width: 1600px;
    margin: 0 auto;
  }
}

/* Large Desktop (1440px - 1919px) */
@media (min-width: 1440px) and (max-width: 1919px) {
  .content {
    max-width: 1400px;
    margin: 0 auto;
  }
}

/* Desktop (1280px - 1439px) */
@media (min-width: 1280px) and (max-width: 1439px) {
  .content {
    padding: 24px;
  }
}

/* Small Desktop (1024px - 1279px) */
@media (min-width: 1024px) and (max-width: 1279px) {
  .content {
    padding: 20px;
  }
}

/* Tablet & Mobile */
@media (max-width: 1023px) {
  .main {
    margin-left: 0;
  }

  .content {
    padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  }
}

/* Mobile (<= 640px) */
@media (max-width: 640px) {
  .content {
    padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
  }
}

/* Ultra Wide Display (2560px+) */
@media (min-width: 2560px) {
  :root {
    font-size: 18px;
  }

  .content {
    max-width: 2000px;
  }
}
</style>
