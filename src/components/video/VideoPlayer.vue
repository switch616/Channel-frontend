<template>
<div class="plyr-host">
  <div
    v-if="poster && showPosterOverlay"
    class="poster-overlay"
    :style="{
      backgroundImage: `url(${poster})`,
    }"
  ></div>
  <vue-plyr :options="plyrOptions">
      <video
        :poster="poster"
        playsinline
        :autoplay="autoplay"
      preload="metadata"
        controls
      @play="onPlay"
      @canplay="onCanPlay"
      >
        <source v-for="(src, key) in sources" :key="key" :src="src.url" :size="key.replace(/[^0-9]/g, '')" />
      </video>
    </vue-plyr>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { logVideoView } from '@/api/video'

const hasReported = ref(false)
const showPosterOverlay = ref(true)

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

const onCanPlay = () => {
  showPosterOverlay.value = false
}
</script>

<style scoped>
.plyr-host {
  width: 100%;
  height: 100%;
  position: relative;
}

.poster-overlay {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(28px) brightness(0.9) saturate(1.1);
  transform: scale(1.05);
  transform-origin: center;
  z-index: 1;
}

::v-deep(.plyr) {
  width: 100%;
  height: 100%;
  background: transparent;
  position: relative;
  z-index: 2;
}

::v-deep(.plyr__video-wrapper) {
  height: 100%;
  background: transparent !important;
}

::v-deep(video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent !important;
  background-color: transparent !important;
}

::v-deep(.plyr--video) {
  background: transparent !important;
}
</style>