<template>
  <div class="email-code-input" :style="{ '--code-length': length }">
    <div class="code-input-wrapper" @click="focusInput">
      <div
        v-for="(_, index) in length"
        :key="index"
        class="code-item"
        :class="{ active: currentIndex === index, filled: codeValue[index] }"
      >
        {{ codeValue[index] || '' }}
      </div>

      <input
        ref="codeInput"
        v-model="inputValue"
        type="tel"
        class="real-input"
        :maxlength="length"
        :disabled="disabled"
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
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  length: {
    type: Number,
    default: 6
  },
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  autoFocus: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:modelValue',
  'input',
  'complete',
  'enter'
])

const codeInput = ref<HTMLInputElement | null>(null)
const codeValue = ref<string[]>(Array(props.length).fill(''))
const inputValue = ref(props.modelValue)
const currentIndex = ref(-1)

const updateCodeValue = (val: string) => {
  codeValue.value = Array(props.length).fill('')
  for (let index = 0; index < val.length && index < props.length; index += 1) {
    codeValue.value[index] = val[index]
  }
}

watch(
  () => props.modelValue,
  (value) => {
    inputValue.value = value || ''
    updateCodeValue(inputValue.value)
  }
)

onMounted(() => {
  if (props.modelValue) {
    updateCodeValue(props.modelValue)
  }

  if (props.autoFocus && !props.disabled) {
    nextTick(() => {
      codeInput.value?.focus()
      currentIndex.value = Math.min(inputValue.value.length, props.length - 1)
    })
  }
})

const focusInput = () => {
  if (props.disabled) return
  currentIndex.value = Math.min(inputValue.value.length, props.length - 1)
  codeInput.value?.focus()
}

const handleFocus = () => {
  currentIndex.value = Math.min(inputValue.value.length, props.length - 1)
}

const handleInput = () => {
  inputValue.value = inputValue.value.replace(/\D/g, '').slice(0, props.length)
  updateCodeValue(inputValue.value)
  emit('input', inputValue.value)
  emit('update:modelValue', inputValue.value)

  if (inputValue.value.length === props.length) {
    emit('complete', inputValue.value)
    codeInput.value?.blur()
  } else {
    currentIndex.value = inputValue.value.length
  }
}

const handleDelete = () => {
  if (inputValue.value.length === 0) return
  currentIndex.value = inputValue.value.length - 1
}

const handleBlur = () => {
  currentIndex.value = -1
}

const handleEnter = () => {
  emit('enter', inputValue.value)
}
</script>

<style scoped>
.email-code-input {
  --code-length: 6;
  --item-width: 44px;
  --item-height: 48px;
  --item-gap: 8px;
  --border-color: #e5e7eb;
  --active-color: #409eff;
}

.code-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: calc(var(--code-length) * (var(--item-width) + var(--item-gap)) - var(--item-gap));
  max-width: 100%;
}

.code-item {
  width: var(--item-width);
  height: var(--item-height);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  transition: all 0.2s;
  background: #fff;
}

.code-item.active {
  border-color: var(--active-color);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.code-item.filled {
  color: #1d2129;
}

.real-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  z-index: -1;
  border: none;
  outline: none;
}

@media (max-width: 480px) {
  .email-code-input {
    --item-width: 38px;
    --item-height: 44px;
    --item-gap: 6px;
  }
}
</style>
