<template>
  <div class="social-login">
    <div ref="googleButtonRef" class="google-button" @click="handleGoogleLogin" />
    <p v-if="initError" class="social-error">{{ initError }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

declare global {
  interface Window {
    google?: any
  }
}

const props = withDefaults(
  defineProps<{
    useOneTap?: boolean
  }>(),
  {
    useOneTap: false
  }
)

const isInitialized = ref(false)

const emit = defineEmits<{
  (event: 'google-success', payload: { credential: string }): void
  (event: 'google-error', payload: { message: string; error?: unknown }): void
}>()

const { t } = useI18n()
const googleButtonRef = ref<HTMLDivElement | null>(null)
const initError = ref('')

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
      width: 320
    })

    isInitialized.value = true
  } catch (error: any) {
    initError.value = error?.message || 'Failed to initialize Google login'
    emit('google-error', { message: initError.value, error })
  }
}

const handleGoogleLogin = async () => {
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

.google-button :deep(iframe) {
  width: 100% !important;
}

.social-error {
  font-size: 12px;
  color: #d14343;
  text-align: center;
}
</style>
