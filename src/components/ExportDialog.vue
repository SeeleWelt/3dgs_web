<template>
  <a-modal
    :open="open"
    title="导出模型"
    :mask-closable="!isExporting"
    :closable="!isExporting"
    @update:open="handleOpenChange"
    @cancel="handleCancel"
  >
    <div class="export-form">
      <div class="form-item">
        <label class="form-label">导出格式</label>
        <a-select
          v-model:value="selectedFormat"
          :options="formatOptions"
          placeholder="请选择导出格式"
        />
      </div>

      <div class="format-tip">
        <span class="tip-label">支持情况：</span>
        <span class="tip-ok">PLY、SOG 可导出</span>
        <span class="tip-split">|</span>
        <span class="tip-disabled">OBJ、FBX、GLTF 暂不支持</span>
      </div>

      <div v-if="statusText" class="status-text">{{ statusText }}</div>

      <a-progress
        v-if="isExporting"
        :percent="progress"
        :status="isExporting ? 'active' : 'normal'"
      />
    </div>

    <template #footer>
      <a-button @click="handleCancel" :disabled="isExporting">关闭</a-button>
      <a-button
        v-if="isExporting"
        danger
        @click="cancelExport"
      >
        取消导出
      </a-button>
      <a-button
        v-else
        type="primary"
        :loading="isExporting"
        @click="startExport"
      >
        开始导出
      </a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
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
  fileName: {
    type: String,
    default: 'model',
  },
});

const emit = defineEmits(['update:open']);

const formatOptions = [
  { label: 'PLY', value: 'ply' },
  { label: 'SOG', value: 'sog' },
  { label: 'OBJ（暂不支持）', value: 'obj', disabled: true },
  { label: 'FBX（暂不支持）', value: 'fbx', disabled: true },
  { label: 'GLTF（暂不支持）', value: 'gltf', disabled: true },
];

const selectedFormat = ref('sog');
const isExporting = ref(false);
const progress = ref(0);
const statusText = ref('');
const abortController = ref(null);
const isUserCanceled = ref(false);

const selectedOption = computed(() => {
  return formatOptions.find((item) => item.value === selectedFormat.value) || null;
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
    message.error('缺少任务 ID，无法导出');
    return;
  }

  if (selectedOption.value?.disabled) {
    message.warning('当前格式暂不支持导出');
    return;
  }

  isExporting.value = true;
  progress.value = 0;
  statusText.value = '正在准备导出...';
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
      throw new Error('下载令牌获取失败');
    }

    statusText.value = `正在导出 ${selectedFormat.value.toUpperCase()}...`;

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
    statusText.value = '导出完成';
    message.success('模型导出成功');
  } catch (error) {
    const canceled =
      isUserCanceled.value ||
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError';

    if (canceled) {
      statusText.value = '导出已取消';
      progress.value = 0;
      message.info('已取消导出');
    } else {
      const status = error?.response?.status;
      if (status === 401) {
        message.error('登录已过期，请重新登录后导出');
      } else {
        message.error(error?.response?.data?.message || error?.message || '导出失败，请重试');
      }
      statusText.value = '导出失败';
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
</style>
