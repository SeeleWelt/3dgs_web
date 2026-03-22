<template>
  <a-modal
    :open="open"
    :title="t('exportDialog.title')"
    :mask-closable="!isExporting"
    :closable="!isExporting"
    @update:open="handleOpenChange"
    @cancel="handleCancel"
  >
    <div class="export-form">
      <div class="form-item">
        <label class="form-label">{{ t('exportDialog.formatLabel') }}</label>
        <a-select
          v-model:value="selectedFormat"
          :options="formatOptions"
          :placeholder="t('exportDialog.formatPlaceholder')"
        />
      </div>

      <div class="format-tip">
        <span class="tip-label">{{ t('exportDialog.supportLabel') }}</span>
        <span class="tip-ok">{{ t('exportDialog.supportedTip') }}</span>
        <span class="tip-split">|</span>
        <span class="tip-disabled">{{ t('exportDialog.unsupportedTip') }}</span>
      </div>

      <div v-if="statusText" class="status-text">{{ statusText }}</div>

      <a-progress
        v-if="isExporting"
        :percent="progress"
        :status="isExporting ? 'active' : 'normal'"
      />
    </div>

    <template #footer>
      <a-button @click="handleCancel" :disabled="isExporting">{{ t('exportDialog.actions.close') }}</a-button>
      <a-button
        v-if="isExporting"
        danger
        @click="cancelExport"
      >
        {{ t('exportDialog.actions.cancelExport') }}
      </a-button>
      <a-button
        v-else
        type="primary"
        :loading="isExporting"
        @click="startExport"
      >
        {{ t('exportDialog.actions.startExport') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue';
import API from '@/utils/api';
import { ApiServer } from '@/utils/taskService';

const { t, locale } = useI18n()

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  taskId: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    default: 'model',
  },
});

const emit = defineEmits(['update:open']);

const formatOptions = computed(() => {
  locale.value
  return [
    { label: t('exportDialog.formats.ply'), value: 'ply' },
    { label: t('exportDialog.formats.sog'), value: 'sog' },
    { label: t('exportDialog.formats.objUnsupported'), value: 'obj', disabled: true },
    { label: t('exportDialog.formats.fbxUnsupported'), value: 'fbx', disabled: true },
    { label: t('exportDialog.formats.gltfUnsupported'), value: 'gltf', disabled: true },
  ]
})

const selectedFormat = ref('sog');
const isExporting = ref(false);
const progress = ref(0);
const statusText = ref('');
const abortController = ref(null);
const isUserCanceled = ref(false);

const selectedOption = computed(() => {
  return formatOptions.value.find((item) => item.value === selectedFormat.value) || null;
});

const sanitizeBaseName = (name) => {
  const raw = String(name || 'model').trim();
  const withoutExt = raw.replace(/\.[^/.]+$/, '');
  return withoutExt || 'model';
};

const toDownloadName = () => {
  const base = sanitizeBaseName(props.fileName);
  return `${base}.${selectedFormat.value}`;
};

const downloadBlob = (blob) => {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = toDownloadName();
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

const resetState = () => {
  progress.value = 0;
  statusText.value = '';
  abortController.value = null;
  isUserCanceled.value = false;
};

const handleOpenChange = (nextOpen) => {
  if (!nextOpen && isExporting.value) {
    cancelExport();
  }
  emit('update:open', nextOpen);
};

const handleCancel = () => {
  if (isExporting.value) return;
  emit('update:open', false);
};

const cancelExport = () => {
  if (!isExporting.value || !abortController.value) return;
  isUserCanceled.value = true;
  abortController.value.abort();
};

const startExport = async () => {
  if (isExporting.value) return;

  if (!props.taskId) {
    message.error(t('exportDialog.messages.missingTaskId'));
    return;
  }

  if (selectedOption.value?.disabled) {
    message.warning(t('exportDialog.messages.formatNotSupported'));
    return;
  }

  isExporting.value = true;
  progress.value = 0;
  statusText.value = t('exportDialog.status.preparing');
  abortController.value = new AbortController();
  isUserCanceled.value = false;

  const token = localStorage.getItem('token');

  try {
    const tokenResp = await ApiServer.request({
      url: `${API.TASK_DETAIL}/${props.taskId}/download-token`,
      method: 'post',
      data: null,
      signal: abortController.value.signal,
    }, token || undefined);

    const downloadToken = tokenResp?.data?.token;
    if (!downloadToken) {
      throw new Error(t('exportDialog.errors.tokenFailed'));
    }

    statusText.value = t('exportDialog.status.exporting', { format: selectedFormat.value.toUpperCase() });

    const response = await ApiServer.request({
      url: `${API.DOWNLOAD_MODEL}/${props.taskId}`,
      method: 'get',
      params: {
        format: selectedFormat.value,
        token: downloadToken,
      },
      responseType: 'blob',
      signal: abortController.value.signal,
      onDownloadProgress: (event) => {
        if (!event.total) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        progress.value = Math.max(0, Math.min(100, percent));
      },
    }, token || undefined);

    downloadBlob(response.data);
    progress.value = 100;
    statusText.value = t('exportDialog.status.completed');
    message.success(t('exportDialog.messages.exportSuccess'));
  } catch (error) {
    const canceled =
      isUserCanceled.value ||
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError';

    if (canceled) {
      statusText.value = t('exportDialog.status.cancelled');
      progress.value = 0;
      message.info(t('exportDialog.messages.exportCancelled'));
    } else {
      const status = error?.response?.status;
      if (status === 401) {
        message.error(t('exportDialog.messages.sessionExpired'));
      } else {
        message.error(error?.response?.data?.message || error?.message || t('exportDialog.messages.exportFailed'));
      }
      statusText.value = t('exportDialog.status.failed');
    }
  } finally {
    isExporting.value = false;
    abortController.value = null;
    isUserCanceled.value = false;
  }
};

watch(
  () => props.open,
  (nextOpen) => {
    if (nextOpen) {
      progress.value = 0;
      statusText.value = '';
      return;
    }
    if (!isExporting.value) {
      resetState();
    }
  }
);
</script>

<style scoped>
.export-form {
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

.format-tip {
  font-size: 12px;
  line-height: 1.5;
}

.tip-label {
  color: #595959;
}

.tip-ok {
  color: #1677ff;
}

.tip-split {
  margin: 0 6px;
  color: #bfbfbf;
}

.tip-disabled {
  color: #8c8c8c;
}

.status-text {
  font-size: 12px;
  color: #595959;
}

@media (max-width: 640px) {
  :deep(.ant-modal) {
    width: calc(100vw - 24px) !important;
    max-width: calc(100vw - 24px) !important;
  }
}
</style>
