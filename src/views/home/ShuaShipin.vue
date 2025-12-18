<template>
  <div class="shuashipin-container">
    <div class="video-swiper" ref="swiperRef" @wheel.passive="onWheel">
      <div v-for="(slot, idx) in videoSlots" :key="slot.type" class="video-item" :data-type="slot.type"
        :class="{ active: slot.type === 'current' }">
        <!-- 背景模糊 -->
        <div v-if="slot.video" class="video-bg-blur" :style="{ backgroundImage: `url('${slot.video.cover_image}')` }">
        </div>

        <!-- 视频播放器 -->
        <div class="video-player-wrapper">
          <video v-if="slot.video" ref="el => videoRefs[idx] = el" :src="slot.video.videoUrl"
            :poster="slot.video.cover_image" class="video-player" autoplay muted playsinline @canplay="onCanPlay"
            @waiting="handleWaiting" @playing="handlePlaying" @loadeddata="handleLoadedData" />
        </div>

        <!-- 视频信息 -->
        <div v-if="slot.type === 'current' && slot.video" class="video-info-box">
          <div class="video-title" @click="goToDetail(slot.video.id)">
            {{ slot.video.title }}
          </div>
          <div class="video-desc">{{ slot.video.description }}</div>
          <div class="video-user">@{{ slot.video.user }}</div>
        </div>
      </div>
    </div>

    <!-- 可选：loading mask -->
    <div v-if="loading" class="video-loading-mask">
      <div class="video-loading-spinner"></div>
      <div class="video-loading-text">加载中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import type { VideoItem, RawVideoItem, VideoSlot } from '@/types/models/video'
import type { CommentItemType, RawComment } from '@/types/models/comment'
import { getHotVideos, getVideoCommentTree } from '@/api/video'

/* =========================================================
 * 状态定义
 * ========================================================= */
const videoList = ref<VideoItem[]>([])
const cursor = ref<number>(0)
const videoSlots = ref<VideoSlot[]>([
  { type: 'prev', video: null },
  { type: 'current', video: null },
  { type: 'next', video: null }
])
const videoRefs = ref<HTMLVideoElement[]>([])
const swiperRef = ref<HTMLDivElement | null>(null)

const comments = ref<CommentItemType[]>([])
const loading = ref<boolean>(false)
const videoReady = ref<boolean>(false)
let loadingTimeout: number | null = null
const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
const router = useRouter()

/* =========================================================
 * Slot 同步逻辑
 * ========================================================= */
function syncSlots(): void {
  videoSlots.value[0].video = videoList.value[cursor.value - 1] ?? null
  videoSlots.value[1].video = videoList.value[cursor.value] ?? null
  videoSlots.value[2].video = videoList.value[cursor.value + 1] ?? null
}

/* =========================================================
 * 视频缓冲 & Loading
 * ========================================================= */
function handleWaiting(): void {
  if (!videoReady.value) return
  if (loadingTimeout) clearTimeout(loadingTimeout)
  loadingTimeout = window.setTimeout(() => (loading.value = true), 200)
}

function handlePlaying(): void {
  if (loadingTimeout) clearTimeout(loadingTimeout)
  loadingTimeout = null
  loading.value = false
}

function handleLoadedData(): void {
  videoReady.value = true
  loading.value = false
}

/* =========================================================
 * 播放控制策略
 * ========================================================= */
function onCanPlay(): void {
  videoRefs.value.forEach((video, idx) => {
    if (!video) return
    if (videoSlots.value[idx].type === 'current') {
      video.play().catch(() => { })
    } else {
      video.pause()
      video.currentTime = 0
    }
  })
}

/* =========================================================
 * Feed 推进（上下刷）
 * ========================================================= */
function nextVideo(): void {
  if (cursor.value < videoList.value.length - 1) {
    cursor.value++
    videoReady.value = false
    syncSlots()
    loadComments()
  }
}

function prevVideo(): void {
  if (cursor.value > 0) {
    cursor.value--
    videoReady.value = false
    syncSlots()
    loadComments()
  }
}

/* 鼠标滚轮 */
function onWheel(e: WheelEvent): void {
  if (e.deltaY > 0) nextVideo()
  else prevVideo()
}

/* 页面跳转 */
function goToDetail(id: number): void {
  router.push(`/video/${id}`)
}

/* =========================================================
 * 数据获取
 * ========================================================= */
async function fetchVideos(): Promise<void> {
  const res = await getHotVideos({ page: 1, size: 20 })
  if (!res?.success) return
  const items = res.data?.items as RawVideoItem[]
  videoList.value = items.map(item => ({
    id: item.id,
    title: item.title,
    user: item.uploader_username,
    description: item.description || '',
    cover_image: genUrl(item.cover_image),
    videoUrl: genUrl(item.file_path)
  }))
  cursor.value = 0
  syncSlots()
  loadComments()
}

function genUrl(path: string): string {
  if (!path) return ''
  return /^https?:\/\//.test(path) ? path : `${baseUrl}/${path.replace(/^\/+/, '')}`
}

/* =========================================================
 * 评论模块
 * ========================================================= */
async function loadComments(): Promise<void> {
  const video = videoList.value[cursor.value]
  if (!video) return
  const res = await getVideoCommentTree(video.id)
  if (!res?.success) {
    comments.value = []
    return
  }
  const raw = res.data as RawComment[]
  comments.value = raw.map(mapComment)
}

function mapComment(item: RawComment): CommentItemType {
  return {
    id: item.id,
    video_id: item.video_id,
    content: item.content,
    username: item.user?.username ?? '',
    avatar: item.user?.profile_picture ?? '',
    user_id: item.user?.id ?? item.user_id,
    time: item.created_at,
    likes: item.like_count ?? 0,
    dislikes: item.dislike_count ?? 0,
    replyCount: item.reply_count,
    children: (item.children ?? []).map(mapComment)
  }
}

/* =========================================================
 * 键盘交互（PC 端）
 * ========================================================= */
function handleKeydown(e: KeyboardEvent): void {
  if (['ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault()
  if (e.code === 'ArrowDown') nextVideo()
  if (e.code === 'ArrowUp') prevVideo()
}

/* =========================================================
 * 生命周期
 * ========================================================= */
onMounted(() => {
  fetchVideos()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (loadingTimeout) clearTimeout(loadingTimeout)
})
</script>

<style scoped>
/* ====== 原样式保留 ====== */
.shuashipin-container {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.video-swiper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-item {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.video-item.active {
  opacity: 1;
  pointer-events: auto;
  z-index: 2;
}

.video-bg-blur {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: blur(28.8px) brightness(0.7);
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.video-player-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
}

.video-info-box {
  position: absolute;
  left: 32px;
  bottom: 80px;
  z-index: 10;
  color: #fff;
  text-align: left;
  max-width: 40vw;
  pointer-events: auto;
}

.video-title {
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
  margin-bottom: 6px;
  transition: color 0.18s;
}

.video-title:hover {
  color: #409EFF;
}

.video-desc {
  font-size: 15px;
  color: #eee;
  margin-bottom: 4px;
  word-break: break-all;
}

.video-user {
  font-size: 15px;
  color: #ff2d55;
  font-weight: 600;
  text-shadow: 0 1.5px 6px #000;
}

.video-loading-mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.18);
  pointer-events: none;
}

.video-loading-spinner {
  width: 54px;
  height: 54px;
  border: 5px solid #e0e0e0;
  border-top: 5px solid #409EFF;
  border-right: 5px solid #36d399;
  border-bottom: 5px solid #fbbf24;
  border-left: 5px solid #f43f5e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 14px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.video-loading-text {
  color: #409EFF;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 0 2px 8px #fff;
  letter-spacing: 2px;
}

/* ====== 抖音位移动画 ====== */
.video-item {
  transform: translateY(100%);
  transition: transform 0.36s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s;
  will-change: transform;
}

.video-item.active {
  transform: translateY(0);
}

.video-item[data-type='prev'] {
  transform: translateY(-100%);
}

.video-item[data-type='next'] {
  transform: translateY(100%);
}
</style>
