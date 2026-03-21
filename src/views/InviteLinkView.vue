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
        class="centered-table"
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
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--text-primary);
  --border-color: #e8e8e8;
  --bg-card: #ffffff;
  --text-main: #1a1a1a;
  --text-muted: #666666;
  --accent-color: #8B5CF6;
  --accent-purple: #A78BFA;
  --accent-blue: #3b82f6;
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
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.section-header h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.mt-8 {
  margin-top: 36px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.custom-card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 18px;
  color: #1a1a1a;
}

.info-lines p {
  margin: 10px 0;
  color: #666666;
  font-size: 14px;
  line-height: 1.6;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  padding: 4px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  color: #7c3aed;
  font-weight: 700;
  font-size: 14px;
  margin: 0 6px;
}

.earned-row {
  margin-top: 28px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.earned-row .pill {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #9333ea;
  font-size: 18px;
  padding: 6px 16px;
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
  color: #666666;
  font-size: 14px;
  margin-bottom: 12px;
}

.meta-line .pill {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  color: #7c3aed;
}

.card-desc {
  color: #666666;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.link-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.copy-btn {
  min-width: 100px;
  height: 40px;
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  -webkit-overflow-scrolling: touch;
}

.table-container.no-padding {
  padding: 0;
}

.centered-table :deep(.ant-table-thead > tr > th) {
  text-align: center;
}

.centered-table :deep(.ant-table-tbody > tr > td) {
  text-align: center;
}

@media (max-width: 960px) {
  .invite-view {
    padding: 16px;
    overflow-x: hidden;
    min-width: 0;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .custom-card {
    padding: 20px;
  }

  .link-row {
    flex-direction: column;
    align-items: stretch;
  }

  .link-row .ant-input {
    width: 100% !important;
  }

  .copy-btn {
    width: 100%;
  }

  .table-container {
    margin: 0 -20px;
    padding: 0 20px;
    width: calc(100% + 40px);
    border-radius: 0;
  }
}

@media (max-width: 480px) {
  .section-header h2 {
    font-size: 18px;
  }

  .section-header h3 {
    font-size: 15px;
  }

  .card-title {
    font-size: 16px;
  }

  .pill {
    font-size: 13px;
    padding: 3px 10px;
  }

  .earned-row .pill {
    font-size: 16px;
    padding: 5px 12px;
  }
}
</style>
