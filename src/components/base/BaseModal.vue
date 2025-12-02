<!--
基础组件 - 弹窗组件
按照设计文档的基础组件层设计
-->
<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :top="top"
    :modal="modal"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="handleBeforeClose"
    :destroy-on-close="destroyOnClose"
    :class="dialogClass"
    @open="handleOpen"
    @opened="handleOpened"
    @close="handleClose"
    @closed="handleClosed"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    
    <div class="base-modal__content">
      <slot />
    </div>
    
    <template v-if="$slots.footer || showFooter" #footer>
      <div class="base-modal__footer">
        <slot name="footer">
          <BaseButton
            v-if="showCancel"
            @click="handleCancel"
            :disabled="loading"
          >
            {{ cancelText }}
          </BaseButton>
          <BaseButton
            v-if="showConfirm"
            type="primary"
            :loading="loading"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </BaseButton>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: '50%'
  },
  top: {
    type: String,
    default: '15vh'
  },
  modal: {
    type: Boolean,
    default: true
  },
  closeOnClickModal: {
    type: Boolean,
    default: true
  },
  closeOnPressEscape: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  destroyOnClose: {
    type: Boolean,
    default: false
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  showConfirm: {
    type: Boolean,
    default: true
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  loading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: '',
    validator: (value) => ['', 'info', 'success', 'warning', 'error'].includes(value)
  }
})

const emit = defineEmits([
  'update:modelValue',
  'open',
  'opened',
  'close',
  'closed',
  'confirm',
  'cancel',
  'before-close'
])

const visible = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
})

// 监听内部值变化
watch(visible, (newValue) => {
  emit('update:modelValue', newValue)
})

const dialogClass = computed(() => {
  return {
    'base-modal': true,
    [`base-modal--${props.type}`]: props.type
  }
})

const handleOpen = () => {
  emit('open')
}

const handleOpened = () => {
  emit('opened')
}

const handleClose = () => {
  emit('close')
}

const handleClosed = () => {
  emit('closed')
}

const handleBeforeClose = (done) => {
  emit('before-close', done)
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}
</script>

<style scoped>
.base-modal__content {
  padding: 20px 0;
}

.base-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
}

.base-modal--info :deep(.el-dialog__header) {
  color: #409eff;
}

.base-modal--success :deep(.el-dialog__header) {
  color: #67c23a;
}

.base-modal--warning :deep(.el-dialog__header) {
  color: #e6a23c;
}

.base-modal--error :deep(.el-dialog__header) {
  color: #f56c6c;
}
</style>
