<template>
  <a-modal
    :open="open"
    title="嵌入代码"
    ok-text="复制代码"
    cancel-text="关闭"
    @update:open="handleOpenChange"
    @ok="copyEmbedCode"
    @cancel="handleCancel"
  >
    <div class="embed-form">
      <div class="form-item">
        <label class="form-label">可嵌入网页代码</label>
        <a-textarea
          :value="embedCode"
          :rows="7"
          readonly
        />
      </div>
      <div class="form-tip">将以上代码粘贴到你的网页 HTML 中即可。</div>
    </div>
  </a-modal>
</template>

<script setup>
import { computed } from 'vue';
import { message } from 'ant-design-vue';

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

const embedUrl = computed(() => {
  if (!props.taskId) return '';
  //把字符串中的特殊字符（如空格、&、=、?、/ 等）转换成 URL 安全的编码格式
  return `${window.location.origin}/model/${encodeURIComponent(props.taskId)}`;
});

const embedCode = computed(() => {
  if (!embedUrl.value) return '';
  return `<iframe src="${embedUrl.value}" width="100%" height="720" frameborder="0" allowfullscreen></iframe>`;
});

const handleOpenChange = (nextOpen) => {
  emit('update:open', nextOpen);
};

const handleCancel = () => {
  emit('update:open', false);
};

const copyEmbedCode = async () => {
  if (!embedCode.value) {
    message.warning('暂无可复制的嵌入代码');
    return;
  }

  try {
    await navigator.clipboard.writeText(embedCode.value);
    message.success('嵌入代码已复制');
  } catch (error) {
    message.error('复制失败，请手动复制');
    return;
  }

  emit('update:open', false);
};
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
</style>
