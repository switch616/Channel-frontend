<!--
基础组件 - 加载组件
按照设计文档的基础组件层设计
-->
<template>
  <div v-if="visible" class="base-loading" :class="loadingClass">
    <div class="base-loading__overlay" v-if="overlay"></div>
    
    <div class="base-loading__content">
      <div class="base-loading__spinner" :class="spinnerClass">
        <div v-if="type === 'spinner'" class="spinner">
          <div class="spinner__circle"></div>
        </div>
        
        <div v-else-if="type === 'dots'" class="dots">
          <div class="dots__dot"></div>
          <div class="dots__dot"></div>
          <div class="dots__dot"></div>
        </div>
        
        <div v-else-if="type === 'pulse'" class="pulse">
          <div class="pulse__circle"></div>
        </div>
        
        <div v-else-if="type === 'wave'" class="wave">
          <div class="wave__bar"></div>
          <div class="wave__bar"></div>
          <div class="wave__bar"></div>
          <div class="wave__bar"></div>
          <div class="wave__bar"></div>
        </div>
      </div>
      
      <div v-if="text" class="base-loading__text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'spinner',
    validator: (value) => ['spinner', 'dots', 'pulse', 'wave'].includes(value as string)
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value as string)
  },
  color: {
    type: String,
    default: '#409eff'
  },
  text: {
    type: String,
    default: ''
  },
  overlay: {
    type: Boolean,
    default: false
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})

const loadingClass = computed(() => {
  return {
    'base-loading--fullscreen': props.fullscreen,
    'base-loading--overlay': props.overlay
  }
})

const spinnerClass = computed(() => {
  return {
    [`base-loading__spinner--${props.size}`]: true
  }
})
</script>

<style scoped>
.base-loading {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.base-loading--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.base-loading--overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.base-loading__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
}

.base-loading__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.base-loading__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.base-loading__spinner--small {
  transform: scale(0.8);
}

.base-loading__spinner--large {
  transform: scale(1.2);
}

.base-loading__text {
  font-size: 14px;
  color: #606266;
  text-align: center;
}

/* Spinner 动画 */
.spinner {
  width: 40px;
  height: 40px;
}

.spinner__circle {
  width: 100%;
  height: 100%;
  border: 3px solid #f3f3f3;
  border-top: 3px solid v-bind(color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dots 动画 */
.dots {
  display: flex;
  gap: 4px;
}

.dots__dot {
  width: 8px;
  height: 8px;
  background-color: v-bind(color);
  border-radius: 50%;
  animation: dots-bounce 1.4s ease-in-out infinite both;
}

.dots__dot:nth-child(1) { animation-delay: -0.32s; }
.dots__dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes dots-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Pulse 动画 */
.pulse {
  width: 40px;
  height: 40px;
}

.pulse__circle {
  width: 100%;
  height: 100%;
  background-color: v-bind(color);
  border-radius: 50%;
  animation: pulse-scale 1s ease-in-out infinite;
}

@keyframes pulse-scale {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* Wave 动画 */
.wave {
  display: flex;
  gap: 2px;
  align-items: center;
}

.wave__bar {
  width: 4px;
  height: 20px;
  background-color: v-bind(color);
  border-radius: 2px;
  animation: wave-stretch 1.2s ease-in-out infinite;
}

.wave__bar:nth-child(1) { animation-delay: -1.1s; }
.wave__bar:nth-child(2) { animation-delay: -1.0s; }
.wave__bar:nth-child(3) { animation-delay: -0.9s; }
.wave__bar:nth-child(4) { animation-delay: -0.8s; }
.wave__bar:nth-child(5) { animation-delay: -0.7s; }

@keyframes wave-stretch {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}
</style>
