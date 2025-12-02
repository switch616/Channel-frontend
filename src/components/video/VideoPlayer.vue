<template>
  <!-- <vue-plyr :options="plyrOptions"> -->
    <video
      :poster="poster"
      playsinline
      :autoplay="autoplay"
      controls
      @play="onPlay"
    >
      <source v-for="(src, key) in sources" :key="key" :src="src.url" :size="key.replace(/[^0-9]/g, '')" />
    </video>
  <!-- </vue-plyr> -->
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue'
// import VuePlyr from 'vue-plyr'
// import 'vue-plyr/dist/vue-plyr.css'
import { logVideoView } from '@/api/video'

const hasReported = ref(false)

const props = defineProps({
  sources: {
    type: Object,
    required: true,
  },
  poster: {
    type: String,
    default: '',
  },
  autoplay: {
    type: Boolean,
    default: false,
  },
  videoId: {
    type: [String, Number],
    required: false,
  },
})

const plyrOptions = {
  controls: [
    'play-large', 'play', 'progress', 'current-time', 'duration',
    'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
  ],
  settings: ['quality', 'speed'],
  speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
  quality: { default: 720, options: [1080, 720] },
  i18n: { qualityLabel: { 1080: '1080P', 720: '720P' } },
}

const onPlay = async () => {
  if (!hasReported.value && props.videoId) {
    try {
      await logVideoView({ video_id: props.videoId })
      hasReported.value = true
    } catch (e) {}
  }
}
</script>

<style scoped>
.video-player-wrapper {
  width: 100%;
  background: #000;
  position: relative;
  outline: none;
}
.video-container {
  position: relative;
  width: 100%;
  background: #000;
}
.video-element {
  width: 100%;
  max-height: 480px;
  background: #000;
}
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0,0,0,0.7);
  padding: 8px;
  color: #fff;
}
.buffering {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  background: rgba(0,0,0,0.6);
  padding: 8px 16px;
  border-radius: 6px;
  z-index: 10;
}
</style> 