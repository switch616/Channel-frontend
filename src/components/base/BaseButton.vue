<!--
基础组件 - 按钮组件
按照设计文档的基础组件层设计
-->
<template>
  <button
    :class="buttonClass"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <el-icon v-if="loading" class="is-loading">
      <Loading />
    </el-icon>
    <el-icon v-if="icon && !loading">
      <component :is="icon" />
    </el-icon>
    <span v-if="$slots.default">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'success', 'warning', 'danger', 'info', 'text'].includes(value)
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  icon: {
    type: [String, Object],
    default: null
  },
  round: {
    type: Boolean,
    default: false
  },
  circle: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const buttonClass = computed(() => {
  return [
    'base-button',
    `base-button--${props.type}`,
    `base-button--${props.size}`,
    {
      'is-disabled': props.disabled,
      'is-loading': props.loading,
      'is-round': props.round,
      'is-circle': props.circle
    }
  ]
})

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
  outline: none;
}

.base-button:focus {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

.base-button--default {
  color: #606266;
  background-color: #ffffff;
  border-color: #dcdfe6;
}

.base-button--default:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.base-button--primary {
  color: #ffffff;
  background-color: #409eff;
  border-color: #409eff;
}

.base-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.base-button--success {
  color: #ffffff;
  background-color: #67c23a;
  border-color: #67c23a;
}

.base-button--success:hover {
  background-color: #85ce61;
  border-color: #85ce61;
}

.base-button--warning {
  color: #ffffff;
  background-color: #e6a23c;
  border-color: #e6a23c;
}

.base-button--warning:hover {
  background-color: #ebb563;
  border-color: #ebb563;
}

.base-button--danger {
  color: #ffffff;
  background-color: #f56c6c;
  border-color: #f56c6c;
}

.base-button--danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}

.base-button--large {
  padding: 12px 20px;
  font-size: 16px;
}

.base-button--small {
  padding: 6px 12px;
  font-size: 12px;
}

.base-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-button.is-loading {
  cursor: not-allowed;
}

.base-button.is-round {
  border-radius: 20px;
}

.base-button.is-circle {
  border-radius: 50%;
  padding: 8px;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
