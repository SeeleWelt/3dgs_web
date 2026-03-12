<template>
  <div class="empty-state">
    <!-- 正常空状态 - 点击创建 -->
    <template v-if="!error">
      <button
        class="smart-icon-btn"
        :class="{ 'is-pressed': isPressed }"
        @click="handleClick"
        @mousedown="isPressed = true"
        @mouseup="isPressed = false"
        @mouseleave="isPressed = false"
        @touchstart="isPressed = true"
        @touchend="isPressed = false"
      >
        <div class="icon-wrapper">
          <svg
            class="box-icon"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M21 8v13H3V8"/>
            <path d="M1 3h22v5H1z"/>
            <path d="M10 12h4"/>
          </svg>
        </div>
        <span class="ripple" :class="{ 'active': showRipple }"></span>
      </button>
      <p class="empty-text">{{ t('home.emptyText') }}</p>
    </template>

    <!-- 网络错误 -->
    <template v-else-if="error === 'network'">
      <div class="error-state-wrapper">
        <div class="error-icon-wrapper network">
          <div class="error-decorations"></div>
          <svg t="1773283873283" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5664" width="48" height="48"><path d="M1011.13623 364c-12.6 16-36 16-50.4 3.6-478-419-882.2-17.8-900.2 0-7.2 7-16.2 10.6-25.2 10.6s-18-3.6-25.2-10.6c-12.6-12.4-14.4-35.4 0-49.8 3.6-5.4 469-467 999-3.6 14.6 12.4 16.4 35.6 2 49.8z" fill="#D81E06" p-id="5665"></path><path d="M867.33623 466.8c12.4 9.6 15.2 25.4 10 38.8-18-4.4-36.8-6.8-56-6.8-8.4 0-16.6 0.4-24.6 1.2-324.6-261-581.8 9.8-592.2 22-7.2 8.8-18 12.4-27 12.4-7.2 0-16.2-3.6-23.4-8.8-14.4-12.4-14.4-35.4-1.8-49.8 3.6-3.6 328.8-348 715-9z m-368.2 64c51.4-2.2 101.6 12 149.4 42-16.8 17.4-30.6 37.4-41.6 59.2-34.4-20.8-69-31.2-104.4-30.2-89.8 1.8-156.4 79.8-156.4 79.8-12.6 16-35.8 17.8-50.4 5.4-16.2-12.4-18-33.6-5.4-49.8 3.8-5.2 86.6-101 208.8-106.4z m10.6 190c18.8 0 37.6 7.6 50.8 20.8 13.4 13.2 21 31.6 21 50.2s-7.6 37-21 50.2c-13.4 13.2-32 20.8-50.8 20.8-18.8 0-37.6-7.6-50.8-20.8-13.4-13.2-21-31.6-21-50.2s7.6-37 21-50.2c13.4-13.2 32-20.8 50.8-20.8z m318-159.8c-98 0-177.6 79.4-177.6 177.4s79.6 177.6 177.6 177.6 177.6-79.4 177.6-177.4-79.4-177.6-177.6-177.6z m90.8 220.2c7.4 7.4 2.6 24-10.8 37.4-13.2 13.2-30 18-37.4 10.8l-42.8-42.8-42.8 42.8c-7.4 7.4-24 2.6-37.4-10.8-13.2-13.2-18-30-10.8-37.4l42.8-42.8-42.8-42.8c-7.4-7.4-2.6-24 10.8-37.4 13.2-13.2 30-18 37.4-10.8l42.8 42.8 42.8-42.8c7.4-7.4 24-2.6 37.4 10.8 13.2 13.2 18 30 10.8 37.4l-42.8 42.8 42.8 42.8z" fill="#D81E06" p-id="5666"></path></svg>
        </div>
        <div class="error-content">
          <p class="error-title">网络连接失败</p>
          <p class="error-desc">请检查网络后重试</p>
          <button class="retry-btn" @click="$emit('retry')">
            <ReloadOutlined />
            重新加载
          </button>
        </div>
      </div>
    </template>

    <!-- 服务器错误 -->
    <template v-else-if="error === 'server'">
      <div class="error-state-wrapper">
        <div class="error-icon-wrapper server">
          <div class="error-decorations"></div>
          <svg t="1773283900046" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7071" width="48" height="48"><path d="M616.58230342 877.23240853c7.68821241-63.65387801 63.65387801-34.71001828 63.65387654-34.71001975 19.33359349-36.63207212 48.27745174-34.71001828 48.27745322-34.71001829 40.47617831 0 52.12155795 54.04361178 52.12155795 54.04361178 46.35539938-34.71001828 69.42003657 15.48948731 69.42003657 15.4894873H616.58230342z m-19.22053245 17.41153966h273.94910406s-7.68821241-81.06541767-82.9874715-57.88771798c0 0-40.47617831-90.67568389-113.85338212-17.41153966 0 0-82.98747003-25.09975205-77.10825044 75.29925764z m0 0M107.57740731 191.62474795c7.68821241-63.65387801 63.65387801-34.71001828 63.653878-34.71001829 19.33359349-36.63207212 48.27745174-34.71001828 48.27745176-34.71001829 40.47617831 0 52.12155795 54.04361178 52.12155943 54.0436118 46.35539938-34.71001828 69.42003657 15.48948731 69.42003655 15.48948583H107.57740731z m-19.22053099 17.29847862h273.94910259s-7.68821241-81.06541767-82.98747004-57.88771945c0 0-40.47617831-90.67568389-113.85338359-17.41153966 0 0.11306252-82.98747003-24.98669102-77.10824896 75.29925911z m0 0" p-id="7072" fill="#d81e06"></path><path d="M224.25733892 607.35353569c-7.80127491 0-15.60254834-5.20084896-20.91645979-15.60254981-7.80127491-28.7177347-13.00212387-57.43547089-13.00212535-88.75363006 0-172.19334867 146.9805341-313.1815992 313.18160067-313.1815992 28.7177347 0 57.43547089 5.20084896 88.75363006 13.00212385 13.00212387 5.20084896 15.60254834 15.60254834 13.00212387 26.11731024-5.20084896 13.00212387-15.60254834 15.60254834-26.11731024 13.00212386-26.11731023-7.80127491-48.39051425-10.74088545-74.50782447-10.74088544-124.2550815 0-272.47929733 114.75787779-272.47929732 269.08743968 0 26.11731023 5.20084896 49.52113347 13.00212385 75.63844371 5.20084896 13.00212387-5.20084896 20.91646127-13.00212385 26.11731024-2.60042447 5.31391146-7.91433595 5.31391146-7.91433743 5.31391293M480.00346869 779.65994539h26.11731023c151.38994991 0 271.34867812-120.07179073 271.34867813-271.34867811v-26.11731024l13.00212386-78.23886817c7.80127491 0 15.60254834 7.80127491 15.60254981 15.60254835 7.80127491 28.7177347 13.00212387 57.43547089 13.00212385 88.75363006 0 172.19334867-140.87518948 313.1815992-313.1815992 313.18159918-28.7177347 0-57.43547089-5.20084896-88.75363153-13.00212386-7.80127491-5.20084896-13.00212387-7.80127491-15.60254833-15.60254835l78.46499318-13.22824886z m0 0" p-id="7073" fill="#d81e06"></path><path d="M263.60289803 864.00415965c-33.91858514 0-62.63631984-7.80127491-78.23886966-28.71773471-47.0337715-47.0337715-36.63207212-138.27476354 26.0042492-255.74612977 5.20084896-7.80127491 13.00212387-13.00212387 20.91645982-13.00212386 7.80127491 0 15.60254834 7.80127491 15.60254978 15.60254834 26.11731023 88.75363006 96.55490497 159.1912248 182.7081091 182.70811054 7.80127491 5.20084896 13.00212387 7.80127491 15.60254981 15.60254982 0 7.80127491-5.20084896 15.60254834-13.00212533 20.9164598-65.23674432 41.71985856-125.27263967 62.63631984-169.59292272 62.63631984m-40.81536438-223.86265953c-33.91858514 75.6384437-36.5190096 138.27476354-13.00212385 161.79164929 26.11731023 26.11731023 88.75363006 20.91646127 161.79164928-13.00212385-65.23674432-31.31816066-114.87094029-80.95235516-148.78952543-148.78952544m568.13629582-194.91879979c-13.00212387 0-15.60254834-7.80127491-20.91646127-15.6025498-26.11731023-88.75363006-102.20800249-163.60064062-188.36120809-187.11752636-7.80127491-5.20084896-7.34902633-3.3918591-9.94945081-11.19313253 0-7.80127491 5.20084896-15.60254834 13.00212386-20.9164598 112.1574533-62.63631984 208.71235827-70.43759474 255.74612978-26.11731023 46.92070898 46.92070898 34.48389474 138.38782604-28.15242509 255.85919082-7.68821241-0.11306252-13.45437242 5.08778791-21.36870838 5.0877879M640.32531271 222.71678359c67.83717027 28.7177347 120.07179073 83.55278112 151.3899499 151.3899499 33.91858514-75.6384437 36.5190096-138.27476354 13.00212388-161.79164927-31.31816066-26.11731023-88.75363006-23.51688575-164.39207378 10.40169937" p-id="7074" fill="#d81e06"></path><path d="M807.31781097 415.03515889v15.60254981c-36.5190096 70.43759474-96.55490497 140.87518948-161.7916493 208.71235828-67.83717027 67.83717027-138.27476354 120.07179073-208.71235828 161.79164929-5.20084896 0-7.80127491 5.20084896-7.80127342 5.20084895H423.81167953l5.20085044-41.71985855C491.6488498 728.10369705 559.48601859 675.8690766 622.12233843 613.23275675c62.63631984-62.63631984 112.1574533-130.4734901 151.3899499-193.10980993l33.80552264-5.08778793z m0 0" p-id="7075" fill="#d81e06"></path></svg>
        </div>
        <div class="error-content">
          <p class="error-title">服务器错误</p>
          <p class="error-desc">服务暂时不可用，请稍后重试</p>
          <button class="retry-btn" @click="$emit('retry')">
            <ReloadOutlined />
            重新加载
          </button>
        </div>
      </div>
    </template>

    <!-- 未知错误 -->
    <template v-else>
      <div class="error-state-wrapper">
        <div class="error-icon-wrapper unknown">
          <div class="error-decorations"></div>
          <svg t="1773283850361" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4413" width="48" height="48"><path d="M938.688 512a428.16 428.16 0 0 1-40.96 182.4 425.344 425.344 0 0 1-115.072 147.456 432.768 432.768 0 0 1-88.256 55.872 433.6 433.6 0 0 1-78.72 28.16 423.36 423.36 0 0 1-124.608 12.288 421.952 421.952 0 0 1-102.912-17.92 423.168 423.168 0 0 1-113.216-53.504 425.344 425.344 0 0 1-139.2-153.6 426.432 426.432 0 0 1 46.464-471.808 427.008 427.008 0 0 1 392.384-151.36A426.56 426.56 0 0 1 938.688 512z" fill="#CC0808" p-id="4414"></path><path d="M353.856 625.344a42.688 42.688 0 0 0 60.288 60.352l105.6-105.6 105.6 105.6a42.688 42.688 0 0 0 60.352-60.352l-105.6-105.6 105.6-105.6a42.688 42.688 0 1 0-60.352-60.288l-105.6 105.6-105.6-105.6a42.688 42.688 0 1 0-60.288 60.288l105.6 105.6-105.6 105.6z" fill="#FFFFFF" p-id="4415"></path></svg>
        </div>
        <div class="error-content">
          <p class="error-title">加载失败</p>
          <p class="error-desc">请稍后重试</p>
          <button class="retry-btn" @click="$emit('retry')">
            <ReloadOutlined />
            重新加载
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ReloadOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  type?: 'mesh-scan' | '3dgs-scan'
  error?: 'network' | 'server' | 'unknown' | null
}>()

const emit = defineEmits<{
  retry: []
}>()

const router = useRouter()
const { t } = useI18n()

const isPressed = ref(false)
const showRipple = ref(false)

const handleClick = () => {
  showRipple.value = true
  setTimeout(() => showRipple.value = false, 300)

  const targetPath = props.type === 'mesh-scan' ? '/create/mesh-scan' : '/create/3dgs-scan'
  router.push(targetPath)
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.smart-icon-btn {
  position: relative;
  width: 100px;
  height: 100px;
  background: var(--glass-surface);
  border: 2px solid var(--glass-border);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  margin-bottom: 20px;
  cursor: pointer;
  overflow: hidden;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.smart-icon-btn:hover {
  transform: scale(1.05);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: linear-gradient(135deg, rgba(0, 198, 255, 0.1), rgba(0, 114, 255, 0.1));
  box-shadow: 0 8px 24px rgba(0, 114, 255, 0.2);
}

.smart-icon-btn.is-pressed {
  transform: scale(0.95);
  transition: transform 150ms ease-out;
}

.box-icon {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(0, 114, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 300ms ease-out, height 300ms ease-out, opacity 300ms ease-out;
  opacity: 0;
  z-index: 1;
}

.ripple.active {
  width: 150%;
  height: 150%;
  opacity: 1;
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 错误状态样式 */
.error-state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInUp 0.5s ease forwards;
}

.error-icon-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  animation: iconPulse 2s ease-in-out infinite;
}

.error-icon-wrapper .icon {
  width: 48px;
  height: 48px;
  fill: currentColor;
}

.error-icon-wrapper.network {
  background: linear-gradient(135deg, rgba(245, 34, 45, 0.15), rgba(245, 34, 45, 0.05));
  box-shadow: 0 8px 32px rgba(245, 34, 45, 0.15);
}

.error-icon-wrapper.network .icon {
  animation: shake 0.5s ease-in-out;
}

.error-icon-wrapper.server {
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.15), rgba(250, 173, 20, 0.05));
  box-shadow: 0 8px 32px rgba(250, 173, 20, 0.15);
}

.error-icon-wrapper.server .icon {
  animation: spin 3s linear infinite;
}

.error-icon-wrapper.unknown {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05));
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
}

.error-icon-wrapper.unknown .icon {
  animation: bounce 1s ease-in-out infinite;
}

/* 背景装饰 */
.error-decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.error-decorations::before,
.error-decorations::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}

.error-decorations::before {
  width: 8px;
  height: 8px;
  background: rgba(245, 34, 45, 0.4);
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.error-decorations::after {
  width: 12px;
  height: 12px;
  background: rgba(245, 34, 45, 0.3);
  bottom: 30%;
  right: 15%;
  animation-delay: 1s;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-10px); opacity: 0.8; }
}

.error-content {
  text-align: center;
}

.error-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  animation: fadeInUp 0.5s ease 0.1s forwards;
  opacity: 0;
}

.error-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  animation: fadeInUp 0.5s ease 0.2s forwards;
  opacity: 0;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease 0.3s forwards;
  opacity: 0;
}

.retry-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0, 114, 255, 0.35);
}

.retry-btn:active {
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .empty-state {
    padding: 60px 16px;
  }

  .smart-icon-btn {
    width: 88px;
    height: 88px;
    border-radius: 20px;
  }

  .box-icon {
    width: 40px;
    height: 40px;
  }
}

@media (hover: none) {
  .smart-icon-btn:hover {
    transform: none;
    box-shadow: none;
  }

  .smart-icon-btn:active {
    transform: scale(0.95);
    background: linear-gradient(135deg, rgba(0, 198, 255, 0.15), rgba(0, 114, 255, 0.15));
  }
}
</style>
