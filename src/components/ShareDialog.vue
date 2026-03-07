<template>
  <a-modal
    :open="open"
    title="分享设置"
    ok-text="生成链接"
    cancel-text="取消"
    :confirm-loading="isSubmitting"
    @update:open="handleOpenChange"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="share-form">
      <div class="form-item">
        <label class="form-label">链接时间</label>
        <a-select
          v-model:value="expireType"
          :options="expireOptions"
          placeholder="请选择链接有效期"
        />
      </div>

      <div class="form-item">
        <label class="form-label">水印</label>
        <a-input
          v-model:value="watermark"
          allow-clear
          placeholder="可选，不填则不添加水印"
        />
      </div>

      <div class="form-item">
        <label class="form-label">跳转链接</label>
        <a-input
          v-model:value="redirectUrl"
          allow-clear
          placeholder="可选，示例：https://example.com"
        />
      </div>

      <div v-if="shareLink" class="share-result">
        <label class="form-label">分享链接</label>
        <div class="share-result-row">
          <a-input :value="shareLink" readonly />
          <a-button type="primary" @click="copyShareLink">复制</a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import API from '@/utils/api';
import { ApiServer } from '@/utils/taskService';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  taskId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:open']);

const expireType = ref('7');
const watermark = ref('');
const redirectUrl = ref('');
const shareLink = ref('');
const isSubmitting = ref(false);

const expireOptions = [
  { label: '7天', value: '7' },
  { label: '30天', value: '30' },
  { label: '永久', value: 'permanent' },
];

const isValidHttpUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const buildShareLink = () => {
  const params = new URLSearchParams();
  params.set('taskId', props.taskId);

  if (expireType.value === 'permanent') {
    params.set('expireType', 'permanent');
  } else {
    params.set('expireDays', expireType.value);
  }

  if (watermark.value.trim()) {
    params.set('watermark', watermark.value.trim());
  }

  if (redirectUrl.value.trim()) {
    params.set('redirect', redirectUrl.value.trim());
  }

  return `${window.location.origin}/share?${params.toString()}`;
};

const handleOpenChange = (nextOpen) => {
  emit('update:open', nextOpen);
};

const handleCancel = () => {
  emit('update:open', false);
};

const handleConfirm = () => {
  if (isSubmitting.value) return;

  if (!props.taskId) {
    message.error('缺少 taskId，无法生成分享链接');
    return;
  }

  if (!isValidHttpUrl(redirectUrl.value.trim())) {
    message.warning('跳转链接格式不正确，请输入 http:// 或 https:// 链接');
    return;
  }

  createShareLink();
};

const createShareLink = async () => {
  isSubmitting.value = true;
  try {
    const token = localStorage.getItem('token');
    const data = {
      expireAt: expireType.value,
      taskId: props.taskId,
      ...(redirectUrl.value.trim() ? { buy_link: redirectUrl.value.trim() } : {}),
      ...(watermark.value.trim() ? { watermark: watermark.value.trim() } : {}),
    };

    const response = await ApiServer.request({
      url: API.SHARE_CREATE,
      method: 'post',
      data,
    }, token || undefined);

    if (response.status !== 200) {
      throw new Error(`创建分享链接失败，状态码: ${response.status}`);
    }

    const serverData = response.data || {};
    console.log('分享链接创建成功，服务器返回:', serverData);
    const serverLink = response.data?.href;

    shareLink.value = serverLink || buildShareLink();
    message.success('分享链接已生成');
  } catch (error) {
    const statusCode = error?.response?.status;
    const errorMsg = error?.response?.data?.message || error?.message || '未知错误';

    if (statusCode === 401) {
      message.error('验证任务归属不通过，请先绑定手机号后再创建分享链接');
    } else if (statusCode === 500) {
      message.error(`服务器错误: ${errorMsg}`);
    } else {
      message.error(`请求错误: ${errorMsg}`);
    }
  } finally {
    isSubmitting.value = false;
  }
};

const copyShareLink = async () => {
  if (!shareLink.value) return;
  try {
    await navigator.clipboard.writeText(shareLink.value);
    message.success('分享链接已复制');
  } catch (error) {
    message.error('复制失败，请手动复制');
  }
};
</script>

<style scoped>
.share-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  color: #1d1d1f;
  font-weight: 500;
}

.share-result {
  margin-top: 4px;
}

.share-result-row {
  display: flex;
  gap: 8px;
}

.share-result-row .ant-btn {
  flex-shrink: 0;
}
</style>
