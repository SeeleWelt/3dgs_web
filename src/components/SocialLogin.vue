<template>
  <div class="social-login">
    <div
      ref="googleButtonRef"
      class="google-button"
      :class="{ disabled: props.disabled }"
      @click="handleGoogleLogin()"
    />
    <p v-if="initError" class="social-error">{{ initError }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

declare global {
  interface Window {
    google?: any
  }
}

const props = withDefaults(
  defineProps<{
    useOneTap?: boolean
    disabled?: boolean
    agree?: boolean
  }>(),
  {
    useOneTap: false,
    disabled: false,
    agree: false
  }
)

const isInitialized = ref(false)

const emit = defineEmits<{
  (event: 'show-agreeTerms'): void
  (event: 'google-success', payload: { credential: string }): void
  (event: 'google-error', payload: { message: string; error?: unknown }): void
}>()

const { t } = useI18n()
const googleButtonRef = ref<HTMLDivElement | null>(null)
const initError = ref('')
let resizeTimer: number | undefined

const resolveButtonWidth = () => {
  if (typeof window === 'undefined') return 480
  return Math.min(480, Math.max(240, window.innerWidth - 48))
}

const handleResize = () => {
  if (!googleButtonRef.value || !window.google?.accounts?.id) return
  if (resizeTimer) window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    window.google.accounts.id.renderButton(googleButtonRef.value, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: resolveButtonWidth()
    })
  }, 120)
}

const loadGoogleScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existing = document.querySelector('script[data-google-identity]') as
      | HTMLScriptElement
      | null

    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(script)
  })

const initGoogleLogin = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  console.log('Google client ID from env:', clientId)
  if (!clientId) {
    initError.value = t('login.googleClientMissing') || 'Missing Google client ID'
    emit('google-error', { message: initError.value })
    return
  }

  try {
    await loadGoogleScript()

    if (!googleButtonRef.value || !window.google?.accounts?.id) {
      throw new Error('Google Identity Services unavailable')
    }

    console.log('Initializing Google login with client ID:', clientId)
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        console.log('Google login response:', response)
        if (!response?.credential) {
          emit('google-error', { message: 'Empty credential response', error: response })
          return
        }
        emit('google-success', { credential: response.credential })
      },
      ux_mode: 'popup',
      auto_select: false,
      cancel_on_tap_outside: false
    })

    window.google.accounts.id.renderButton(googleButtonRef.value, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: resolveButtonWidth()
    })

    isInitialized.value = true
    window.addEventListener('resize', handleResize)
  } catch (error: any) {
    initError.value = error?.message || 'Failed to initialize Google login'
    emit('google-error', { message: initError.value, error })
  }
}

const handleGoogleLogin = async () => {

  if (props.disabled) return
  if (!isInitialized.value) {
    await initGoogleLogin()
  }

  if (!window.google?.accounts?.id) {
    initError.value = 'Google Identity Services unavailable'
    emit('google-error', { message: initError.value })
    return
  }

  if (props.useOneTap) {
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed?.()) {
        emit('google-error', {
          message: `Google One Tap not displayed: ${notification.getNotDisplayedReason?.() || 'unknown'}`,
          error: notification
        })
      }
      if (notification.isSkippedMoment?.()) {
        emit('google-error', {
          message: `Google One Tap skipped: ${notification.getSkippedReason?.() || 'unknown'}`,
          error: notification
        })
      }
      if (notification.isDismissedMoment?.()) {
        emit('google-error', {
          message: `Google One Tap dismissed: ${notification.getDismissedReason?.() || 'unknown'}`,
          error: notification
        })
      }
    })
  }
}

onMounted(() => {
  initGoogleLogin()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimer) window.clearTimeout(resizeTimer)
})
</script>

<style scoped>
.social-login {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.google-button {
  min-height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.google-button.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.google-button :deep(iframe) {
  width: 100% !important;
}

.social-error {
  font-size: 12px;
  color: #d14343;
  text-align: center;
}
</style>
