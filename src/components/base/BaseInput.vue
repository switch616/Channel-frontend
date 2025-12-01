<!--
基础组件 - 输入框组件
按照设计文档的基础组件层设计
-->
<template>
  <div class="base-input" :class="inputClass">
    <label v-if="label" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </label>
    
    <div class="base-input__wrapper">
      <el-input
        v-model="inputValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :show-word-limit="showWordLimit"
        :clearable="clearable"
        :size="size"
        :prefix-icon="prefixIcon"
        :suffix-icon="suffixIcon"
        :class="inputWrapperClass"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @clear="handleClear"
      >
        <template v-if="$slots.prepend" #prepend>
          <slot name="prepend" />
        </template>
        <template v-if="$slots.append" #append>
          <slot name="append" />
        </template>
      </el-input>
    </div>
    
    <div v-if="errorMessage || helpText" class="base-input__message">
      <span v-if="errorMessage" class="base-input__error">{{ errorMessage }}</span>
      <span v-else-if="helpText" class="base-input__help">{{ helpText }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'password', 'email', 'number', 'tel', 'url'].includes(value)
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  maxlength: {
    type: Number,
    default: null
  },
  showWordLimit: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  prefixIcon: {
    type: [String, Object],
    default: null
  },
  suffixIcon: {
    type: [String, Object],
    default: null
  },
  errorMessage: {
    type: String,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: '',
    validator: (value) => ['', 'error', 'warning', 'success'].includes(value)
  }
})

const emit = defineEmits([
  'update:modelValue',
  'input',
  'change',
  'focus',
  'blur',
  'clear'
])

const inputValue = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue
})

// 监听内部值变化
watch(inputValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const inputClass = computed(() => {
  return {
    'base-input--error': props.status === 'error' || props.errorMessage,
    'base-input--warning': props.status === 'warning',
    'base-input--success': props.status === 'success',
    'base-input--disabled': props.disabled,
    'base-input--readonly': props.readonly
  }
})

const inputWrapperClass = computed(() => {
  return {
    'base-input__wrapper--error': props.status === 'error' || props.errorMessage,
    'base-input__wrapper--warning': props.status === 'warning',
    'base-input__wrapper--success': props.status === 'success'
  }
})

const handleInput = (value) => {
  emit('input', value)
}

const handleChange = (value) => {
  emit('change', value)
}

const handleFocus = (event) => {
  emit('focus', event)
}

const handleBlur = (event) => {
  emit('blur', event)
}

const handleClear = () => {
  emit('clear')
}
</script>

<style scoped>
.base-input {
  margin-bottom: 16px;
}

.base-input__label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.base-input__required {
  color: #f56c6c;
  margin-left: 2px;
}

.base-input__wrapper {
  position: relative;
}

.base-input__message {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
}

.base-input__error {
  color: #f56c6c;
}

.base-input__help {
  color: #909399;
}

.base-input--error .base-input__wrapper :deep(.el-input__wrapper) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

.base-input--warning .base-input__wrapper :deep(.el-input__wrapper) {
  border-color: #e6a23c;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2);
}

.base-input--success .base-input__wrapper :deep(.el-input__wrapper) {
  border-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.base-input--disabled {
  opacity: 0.6;
}

.base-input--readonly {
  opacity: 0.8;
}
</style>
