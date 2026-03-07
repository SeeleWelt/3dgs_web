<template>
  <div class="sms-code-input" :style="{ '--code-length': length }">
    <!-- 验证码输入框容器 -->
    <div class="code-input-wrapper" @click="focusInput">
      <!-- 验证码显示位 -->
      <div 
        v-for="(item, index) in length" 
        :key="index" 
        class="code-item"
        :class="{ active: currentIndex === index, filled: codeValue[index] }"
      >
        {{ codeValue[index] || '' }}
      </div>
      <!-- 隐藏的真实输入框 -->
      <input
        ref="codeInput"
        v-model="inputValue"
        type="tel"
        class="real-input"
        :maxlength="length"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.delete="handleDelete"
        @keydown.enter.prevent="handleEnter"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, onMounted, nextTick } from 'vue'

// 定义组件属性
const props = defineProps({
  // 验证码长度，默认6位
  length: {
    type: Number,
    default: 6
  },
  // 是否禁用输入
  disabled: {
    type: Boolean,
    default: false
  },
  // 初始验证码值
  modelValue: {
    type: String,
    default: ''
  }
})

// 定义组件事件
const emit = defineEmits([
  'update:modelValue', // 双向绑定更新
  'complete', // 输入完成回调
  'input', // 实时输入回调
  'enter' // 回车提交
])

// 模板引用
const codeInput = ref<HTMLInputElement | null>(null)
// 显示的验证码数组
const codeValue = ref<string[]>(Array(props.length).fill(''))
// 真实输入框的值
const inputValue = ref(props.modelValue)
// 当前聚焦的位置
const currentIndex = ref(0)

// 初始化
onMounted(() => {
  // 初始化验证码数组
  if (props.modelValue) {
    updateCodeValue(props.modelValue)
  }

  if (!props.disabled) {
    nextTick(() => {
      codeInput.value?.focus()
      currentIndex.value = inputValue.value.length
    })
  }
})

// 监听外部传入的modelValue变化
watch(
  () => props.modelValue,
  (val) => {
    inputValue.value = val
    updateCodeValue(val)
  }
)

// 聚焦输入框
const focusInput = () => {
  if (props.disabled) return
  currentIndex.value = Math.min(inputValue.value.length, props.length - 1)
  codeInput.value?.focus()
}

const handleFocus = () => {
  currentIndex.value = Math.min(inputValue.value.length, props.length - 1)
}

// 处理输入内容
const handleInput = () => {
  // 过滤非数字字符
  inputValue.value = inputValue.value.replace(/\D/g, '')
  // 更新显示的验证码数组
  updateCodeValue(inputValue.value)
  // 触发输入事件
  emit('input', inputValue.value)
  // 更新双向绑定值
  emit('update:modelValue', inputValue.value)
  
  // 输入完成时触发回调
  if (inputValue.value.length === props.length) {
    emit('complete', inputValue.value)
    emit('enter', inputValue.value)
    codeInput.value?.blur()
  } else {
    // 更新当前聚焦位置
    currentIndex.value = inputValue.value.length
  }
}

// 处理删除键
const handleDelete = () => {
  if (inputValue.value.length === 0) return
  currentIndex.value = inputValue.value.length - 1
}

// 处理失焦
const handleBlur = () => {
  currentIndex.value = -1
}

const handleEnter = () => {
  emit('enter', inputValue.value)
}

// 更新验证码显示数组
const updateCodeValue = (val: string) => {
  codeValue.value = Array(props.length).fill('')
  for (let i = 0; i < val.length && i < props.length; i++) {
    codeValue.value[i] = val[i]
  }
}
</script>

<style scoped>
.sms-code-input {
  --code-length: 6; /* 验证码长度，由JS动态设置 */
  --item-width: 44px;
  --item-height: 48px;
  --item-gap: 8px;
  --border-color: #e5e7eb;
  --active-color: #409eff;
  --filled-color: #1d2129;
}

.code-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: calc(var(--code-length) * (var(--item-width) + var(--item-gap)) - var(--item-gap));
}

/* 验证码显示项 */
.code-item {
  width: var(--item-width);
  height: var(--item-height);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 20px;
  font-weight: 500;
  color: #999;
  transition: all 0.2s;
}

.code-item.active {
  border-color: var(--active-color);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.code-item.filled {
  color: var(--filled-color);
}

/* 隐藏的真实输入框 */
.real-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  z-index: -1;
  outline: none;
  border: none;
  background: transparent;
}

/* 禁用状态 */
:deep(.code-input-wrapper[disabled]) .code-item {
  background-color: #f5f7fa;
  cursor: not-allowed;
}
</style>