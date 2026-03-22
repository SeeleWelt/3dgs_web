<template>
  <a-modal
    :open="open"
    :title="$t('embedCode.title')"
    :ok-text="$t('embedCode.copyCode')"
    :cancel-text="$t('embedCode.close')"
    @update:open="handleOpenChange"
    @ok="copyEmbedCode"
    @cancel="handleCancel"
  >
    <div class="embed-form">
      <div class="form-item">
        <label class="form-label">{{ $t('embedCode.embedCodeLabel') }}</label>
        <a-textarea
          :value="embedCode"
          :rows="7"
          readonly
        />
      </div>
      <div class="form-tip">{{ $t('embedCode.embedTip') }}</div>
    </div>
  </a-modal>
</template>

<script setup>
import { computed,ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { message } from 'ant-design-vue';
import API from '@/utils/api';
import { ApiServer } from '@/utils/taskService';

const { t } = useI18n()

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  taskId: {
    type: String,
    required: true,
  },
  official: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:open']);

const embedUrl = computed(() => {
  if (!props.taskId) return '';
  //把字符串中的特殊字符（如空格、&、=、?、/ 等）转换成 URL 安全的编码格式
  return shareLink.value;
});


// 构建分享链接
const shareId = ref('');
const shareLink = computed(() => {
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || import.meta.env.BASE_URL || '';
  const shareUrl=new URL(`${window.location.origin}${baseUrl}share/link/${props.taskId}`)
  shareUrl.searchParams.append('shareId', shareId.value);
  console.log()
  return shareUrl.toString();
});


const embedCode = computed(() => {
  if (!embedUrl.value) return '';
  return `<iframe src="${embedUrl.value}" width="800" height="500" frameborder="0" allowfullscreen></iframe>`;
});

const handleOpenChange = (nextOpen) => {
  emit('update:open', nextOpen);
};

const handleCancel = () => {
  emit('update:open', false);
};

const copyEmbedCode = async () => {
  if (!embedCode.value) {
    message.warning(t('embedCode.noCode'));
    return;
  }

  try {
    await navigator.clipboard.writeText(embedCode.value);
    message.success(t('embedCode.codeCopied'));
  } catch (error) {
    message.error(t('embedCode.copyFailed'));
    return;
  }

  emit('update:open', false);
};

onMounted(async () => {
  const response = await ApiServer.request(
    {
      url: API.BASE_URL+ API.SHARE_CREATE,
      method: 'POST',
      data: {
        taskId: props.taskId,
        expireAt: 0,
        official: props.official
      }
    }
    
  )
  console.log(response.data)
  const shareUrl = new URL(response.data.href);
  shareId.value = shareUrl.searchParams.get('shareId');
});




</script>

<style scoped>
.embed-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.form-tip {
  font-size: 12px;
  color: #8c8c8c;
}

@media (max-width: 640px) {
  :deep(.ant-modal) {
    width: calc(100vw - 24px) !important;
    max-width: calc(100vw - 24px) !important;
  }
}
</style>
