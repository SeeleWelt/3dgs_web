<template>
  <div class="invite-view">
    <div class="section-header">
      <h2>{{ t('inviteLang.title') }}</h2>
    </div>

    <div class="cards-grid">
      <div class="custom-card info-card">
        <h3 class="card-title">{{ t('inviteLang.instructionTitle') }}</h3>
        <div class="info-lines">
          <p>{{ t('inviteLang.invitePerUser') }}</p>
          <p>{{ t('inviteLang.youEarn') }} <span class="pill">{{ inviteStats.trafficReward }}</span> {{ t('inviteLang.rewardPointsTitle') }}</p>
          <p>{{ t('inviteLang.theyEarn') }} <span class="pill">{{ inviteStats.registerBonus }}</span> {{ t('inviteLang.newUseBonus') }}</p>
        </div>
        <div class="earned-row">
          <span>{{ t('inviteLang.earnedPoints') }}</span>
          <span class="pill">{{ inviteTotal }}</span>
          <span>{{ t('inviteLang.pointsUnit') }}</span>
        </div>
      </div>

      <div class="custom-card link-card">
        <div class="card-header">
          <h3 class="card-title">{{ t('inviteLang.inviteLinkTitle') }}</h3>
        </div>
        <div class="meta-line">
          <span class="meta-label">{{ t('inviteLang.remainingInvites') }}</span>
          <span class="pill">{{ remaining }}</span>
        </div>
        <p class="card-desc">
          {{ t('inviteLang.inviteDesc') }}
        </p>
        <div class="link-row">
          <a-input :value="inviteLink" readonly />
          <a-button type="primary" class="copy-btn" @click="copyInviteLink">{{ t('inviteLang.copyBtn') }}</a-button>
        </div>
      </div>
    </div>

    <div class="section-header mt-8">
      <h3>{{ t('inviteLang.historyTitle') }}</h3>
    </div>
    <div class="custom-card table-container no-padding">
      <a-table
        :data-source="inviteRecords"
        :columns="inviteColumns"
        row-key="id"
        :pagination="{ pageSize: pageSize, showSizeChanger: false }"
        size="middle"
        :locale="{ emptyText: t('inviteLang.historyEmpty') }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import API from '@/utils/api'
import { ApiServer } from '@/utils/taskService'
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const pageSize = ref(10)

const inviteStats = ref({
  trafficReward: '100',
  registerBonus: 100
})

const inviteUrl = ref('')
const inviteTotal = ref(0)
const remaining = ref(0)

const inviteLink = computed(() => `${inviteUrl.value}`)

const inviteRecords = ref<Array<{ id: string; user: string; created_at: string; rewards_amount: string }>>([])

const inviteColumns = computed(() => [
  // { title: '受邀用户', dataIndex: 'user', key: 'user' },
  { 
    title: t('inviteLang.timeColumn'), 
    dataIndex: 'created_at', 
    key: 'created_at',
    customRender: ({ text }: { text: string | number }) => {
      if (!text) return '-';
      const timestamp = typeof text === 'string' ? parseInt(text, 10) : text;
      // 如果是 10 位数，说明是秒级时间戳，需要乘 1000 转为毫秒
      const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
      return date.toLocaleString();
    }
  },
  { title: t('inviteLang.bonusColumn'), dataIndex: 'rewards_amount', key: 'rewards_amount' }
])

const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    message.success(t('inviteLang.copySuccess'))
  } catch (error) {
    message.error(t('inviteLang.copyFailed'))
  }
}

const getInviteHref = async () => {
  try {
    const response = await ApiServer.request({
      url: API.GET_INVITE_HREF,
      method: 'get'
    })
    inviteUrl.value = response.data.inviteHref
  } catch (error) {
    message.error(t('inviteLang.getLinkFailed'))
  }
}
const getInviteRecords = async () => {
  const response = await ApiServer.request({
    url: API.GET_INVITE_RECORDS,
    method: 'get'
  })
  inviteRecords.value = response.data.records
  remaining.value = 5 - (response.data.records.length || 0)
  response.data.records.forEach((record: { rewards_amount: string }) => {
    inviteTotal.value += parseInt(record.rewards_amount, 10)
  })
}
getInviteHref()
getInviteRecords()
</script>

<style scoped>
.invite-view {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--text-primary);
  --border-color: var(--glass-border, #e5e7eb);
  --bg-card: var(--bg-secondary, #fafafa);
  --text-main: var(--text-primary, #111827);
  --text-muted: var(--text-secondary, #6b7280);
  animation: fadeInUp 0.4s ease-out;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--text-main);
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-main);
}

.mt-8 {
  margin-top: 40px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.custom-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 18px 20px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--text-main);
}

.info-lines p {
  margin: 8px 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #2563eb;
  font-weight: 600;
  margin: 0 6px;
}

.earned-row {
  margin-top: 24px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.link-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.card-desc {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 16px;
}

.link-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.copy-btn {
  min-width: 96px;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
}

.table-container.no-padding {
  padding: 0;
}

@media (max-width: 960px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .link-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
