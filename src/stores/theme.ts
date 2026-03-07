import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeType = 'dark' | 'light' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeType>((localStorage.getItem('theme') as ThemeType) || 'light')

  const appliedTheme = computed(() => {
    if (currentTheme.value === 'auto') {
      const hour = new Date().getHours()
      return hour < 6 || hour >= 18 ? 'dark' : 'light'
    }
    return currentTheme.value
  })

  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
    applyTheme()
  }

  const applyTheme = () => {
    const theme = appliedTheme.value
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }

  const init = () => {
    applyTheme()
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentTheme.value === 'auto') {
        applyTheme()
      }
    })
  }

  return {
    currentTheme,
    appliedTheme,
    setTheme,
    applyTheme,
    init
  }
})
