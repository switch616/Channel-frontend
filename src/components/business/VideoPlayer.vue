<!--
业务组件 - 视频播放器
按照设计文档的业务组件层设计
-->
<template>
  <div class="video-player" :class="playerClass">
    <div ref="playerContainer" class="video-player__container"></div>
    
    <!-- 自定义控制栏 -->
    <div v-if="showControls" class="video-player__controls">
      <div class="video-player__progress">
        <div class="video-player__progress-bar" @click="handleProgressClick">
          <div 
            class="video-player__progress-filled" 
            :style="{ width: progressPercent + '%' }"
          ></div>
          <div 
            class="video-player__progress-handle" 
            :style="{ left: progressPercent + '%' }"
          ></div>
        </div>
      </div>
      
      <div class="video-player__bottom">
        <div class="video-player__left">
          <button 
            class="video-player__play-btn" 
            @click="togglePlay"
            :class="{ 'is-playing': isPlaying }"
          >
            <el-icon>
              <component :is="isPlaying ? 'VideoPause' : 'VideoPlay'" />
            </el-icon>
          </button>
          
          <div class="video-player__time">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>
        </div>
        
        <div class="video-player__right">
          <div class="video-player__volume">
            <el-icon @click="toggleMute">
              <component :is="isMuted ? 'Mute' : 'Microphone'" />
            </el-icon>
            <input 
              type="range" 
              min="0" 
              max="100" 
              v-model="volume"
              @input="handleVolumeChange"
              class="video-player__volume-slider"
            />
          </div>
          
          <button class="video-player__fullscreen-btn" @click="toggleFullscreen">
            <el-icon>
              <component :is="isFullscreen ? 'Aim' : 'FullScreen'" />
            </el-icon>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <BaseLoading 
      v-if="loading" 
      :visible="loading" 
      text="视频加载中..."
      overlay
    />
    
    <!-- 错误状态 -->
    <div v-if="error" class="video-player__error">
      <el-icon class="video-player__error-icon">
        <Warning />
      </el-icon>
      <p class="video-player__error-text">{{ error }}</p>
      <BaseButton @click="retry" size="small">重试</BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { VideoPlay, VideoPause, Mute, Microphone, FullScreen, Aim, Warning } from '@element-plus/icons-vue'
import BaseLoading from '@/components/base/BaseLoading.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  },
  autoplay: {
    type: Boolean,
    default: false
  },
  muted: {
    type: Boolean,
    default: false
  },
  loop: {
    type: Boolean,
    default: false
  },
  controls: {
    type: Boolean,
    default: true
  },
  width: {
    type: [String, Number],
    default: '100%'
  },
  height: {
    type: [String, Number],
    default: 'auto'
  },
  aspectRatio: {
    type: String,
    default: '16:9'
  }
})

const emit = defineEmits([
  'play',
  'pause',
  'ended',
  'timeupdate',
  'volumechange',
  'error',
  'loadstart',
  'loadeddata',
  'canplay'
])

const playerContainer = ref(null)
const videoElement = ref(null)
const loading = ref(false)
const error = ref('')
const isPlaying = ref(false)
const isMuted = ref(props.muted)
const isFullscreen = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(100)

const showControls = computed(() => props.controls)

const playerClass = computed(() => {
  return {
    'video-player--fullscreen': isFullscreen.value,
    'video-player--loading': loading.value,
    'video-player--error': !!error.value
  }
})

const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  destroyPlayer()
})

watch(() => props.src, () => {
  if (videoElement.value) {
    videoElement.value.src = props.src
  }
})

const initPlayer = async () => {
  try {
    await nextTick()
    
    if (!playerContainer.value) return
    
    // 创建视频元素
    videoElement.value = document.createElement('video')
    videoElement.value.src = props.src
    videoElement.value.poster = props.poster
    videoElement.value.autoplay = props.autoplay
    videoElement.value.muted = props.muted
    videoElement.value.loop = props.loop
    videoElement.value.controls = false // 使用自定义控制栏
    videoElement.value.style.width = '100%'
    videoElement.value.style.height = '100%'
    videoElement.value.style.objectFit = 'cover'
    
    // 添加事件监听
    addEventListeners()
    
    // 添加到容器
    playerContainer.value.appendChild(videoElement.value)
    
  } catch (err) {
    console.error('视频播放器初始化失败:', err)
    error.value = '视频播放器初始化失败'
  }
}

const destroyPlayer = () => {
  if (videoElement.value) {
    removeEventListeners()
    videoElement.value.remove()
    videoElement.value = null
  }
}

const addEventListeners = () => {
  if (!videoElement.value) return
  
  videoElement.value.addEventListener('loadstart', handleLoadStart)
  videoElement.value.addEventListener('loadeddata', handleLoadedData)
  videoElement.value.addEventListener('canplay', handleCanPlay)
  videoElement.value.addEventListener('play', handlePlay)
  videoElement.value.addEventListener('pause', handlePause)
  videoElement.value.addEventListener('ended', handleEnded)
  videoElement.value.addEventListener('timeupdate', handleTimeUpdate)
  videoElement.value.addEventListener('volumechange', handleVolumeChange)
  videoElement.value.addEventListener('error', handleError)
}

const removeEventListeners = () => {
  if (!videoElement.value) return
  
  videoElement.value.removeEventListener('loadstart', handleLoadStart)
  videoElement.value.removeEventListener('loadeddata', handleLoadedData)
  videoElement.value.removeEventListener('canplay', handleCanPlay)
  videoElement.value.removeEventListener('play', handlePlay)
  videoElement.value.removeEventListener('pause', handlePause)
  videoElement.value.removeEventListener('ended', handleEnded)
  videoElement.value.removeEventListener('timeupdate', handleTimeUpdate)
  videoElement.value.removeEventListener('volumechange', handleVolumeChange)
  videoElement.value.removeEventListener('error', handleError)
}

const handleLoadStart = () => {
  loading.value = true
  error.value = ''
  emit('loadstart')
}

const handleLoadedData = () => {
  loading.value = false
  duration.value = videoElement.value.duration
  emit('loadeddata')
}

const handleCanPlay = () => {
  emit('canplay')
}

const handlePlay = () => {
  isPlaying.value = true
  emit('play')
}

const handlePause = () => {
  isPlaying.value = false
  emit('pause')
}

const handleEnded = () => {
  isPlaying.value = false
  emit('ended')
}

const handleTimeUpdate = () => {
  currentTime.value = videoElement.value.currentTime
  emit('timeupdate', currentTime.value)
}

const handleVolumeChange = () => {
  volume.value = Math.round(videoElement.value.volume * 100)
  isMuted.value = videoElement.value.muted
  emit('volumechange', volume.value)
}

const handleError = (event) => {
  loading.value = false
  error.value = '视频加载失败'
  console.error('视频播放错误:', event)
  emit('error', event)
}

const togglePlay = () => {
  if (!videoElement.value) return
  
  if (isPlaying.value) {
    videoElement.value.pause()
  } else {
    videoElement.value.play()
  }
}

const toggleMute = () => {
  if (!videoElement.value) return
  
  videoElement.value.muted = !videoElement.value.muted
}

const toggleFullscreen = () => {
  if (!videoElement.value) return
  
  if (!isFullscreen.value) {
    if (videoElement.value.requestFullscreen) {
      videoElement.value.requestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}

const handleProgressClick = (event) => {
  if (!videoElement.value || !duration.value) return
  
  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percent = clickX / rect.width
  const newTime = percent * duration.value
  
  videoElement.value.currentTime = newTime
}

const retry = () => {
  error.value = ''
  loading.value = true
  if (videoElement.value) {
    videoElement.value.load()
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 监听全屏状态变化
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
})
</script>

<style scoped>
.video-player {
  position: relative;
  width: v-bind(width);
  height: v-bind(height);
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player__container {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-player__controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px 16px 16px;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-player:hover .video-player__controls {
  opacity: 1;
}

.video-player__progress {
  margin-bottom: 12px;
}

.video-player__progress-bar {
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.video-player__progress-filled {
  height: 100%;
  background-color: #409eff;
  border-radius: 2px;
  transition: width 0.1s;
}

.video-player__progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background-color: #409eff;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-player__progress-bar:hover .video-player__progress-handle {
  opacity: 1;
}

.video-player__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.video-player__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.video-player__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.video-player__play-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.video-player__play-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.video-player__time {
  color: white;
  font-size: 14px;
  font-family: monospace;
}

.video-player__volume {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
}

.video-player__volume-slider {
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.video-player__volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: #409eff;
  border-radius: 50%;
  cursor: pointer;
}

.video-player__fullscreen-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.video-player__fullscreen-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.video-player__error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
}

.video-player__error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.video-player__error-text {
  margin-bottom: 16px;
  font-size: 16px;
}

.video-player--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  width: 100vw !important;
  height: 100vh !important;
}
</style>
