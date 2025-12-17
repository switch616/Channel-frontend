<template>
  <div class="shuashipin-container">
    <div class="video-swiper" ref="swiperRef" @wheel.passive="onWheel">
      <div v-for="(slot, _idx) in videoSlots" :key="slot.type" class="video-item"
        :class="{ active: slot.type === 'current' }">
        <div v-if="slot.video" class="video-bg-blur" :style="{ backgroundImage: `url('${slot.video.cover_image}')` }">
        </div>

        <div class="video-player-wrapper">
          <video v-if="slot.video" ref="el => videoRefs[idx] = el" :src="slot.video.videoUrl"
            :poster="slot.video.cover_image" class="video-player" autoplay muted playsinline @canplay="onCanPlay"
            @waiting="handleWaiting" @playing="handlePlaying" @loadeddata="handleLoadedData" />
        </div>

        <!-- 只在 current slot 显示信息 -->
        <div v-if="slot.type === 'current' && slot.video" class="video-info-box">
          <div class="video-title" @click="goToDetail(slot.video.id)">
            {{ slot.video.title }}
          </div>
          <div class="video-desc">{{ slot.video.description }}</div>
          <div class="video-user">@{{ slot.video.user }}</div>
        </div>
      </div>
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
 * 状态定义（Feed + Slot 架构）
 * ---------------------------------------------------------
 * videoList  : 后端返回的完整 Feed 数据
 * cursor     : 当前正在播放的视频在 Feed 中的位置
 * videoSlots : 页面中真实存在的 3 个 video 渲染窗口
 * ========================================================= */
const videoList = ref<VideoItem[]>([])
const cursor = ref<number>(0)

/**
 * videoSlots 永远只维护 3 个元素：
 * - prev    : 上一条视频（预加载）
 * - current : 当前播放视频
 * - next    : 下一条视频（预加载）
 *
 * DOM 不变，只替换内容，是性能的关键
 */
const videoSlots = ref<VideoSlot[]>([
  { type: 'prev', video: null },
  { type: 'current', video: null },
  { type: 'next', video: null }
])

/**
 * videoRefs 与 videoSlots 一一对应：
 * index 0 -> prev
 * index 1 -> current
 * index 2 -> next
 */
const videoRefs = ref<HTMLVideoElement[]>([])

const swiperRef = ref<HTMLDivElement | null>(null)

/* 评论数据（与播放架构解耦） */
const comments = ref<CommentItemType[]>([])

/* 播放状态控制 */
const loading = ref<boolean>(false)
const videoReady = ref<boolean>(false)

/* 延迟显示 loading 的定时器 */
let loadingTimeout: number | null = null

const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
const router = useRouter()

/* =========================================================
 * Slot 同步逻辑（核心方法）
 * ---------------------------------------------------------
 * 根据 cursor，将 Feed 数据映射到 3 个 Slot
 * 这是整个“抖音式刷视频”的中枢
 * ========================================================= */
function syncSlots(): void {
  videoSlots.value[0].video = videoList.value[cursor.value - 1] ?? null
  videoSlots.value[1].video = videoList.value[cursor.value] ?? null
  videoSlots.value[2].video = videoList.value[cursor.value + 1] ?? null
}

/* =========================================================
 * 视频缓冲 & Loading 状态处理
 * ---------------------------------------------------------
 * waiting  : 网络或解码阻塞（延迟显示 loading，避免闪烁）
 * playing  : 正常播放
 * loaded   : 数据加载完成
 * ========================================================= */
function handleWaiting(): void {
  if (!videoReady.value) return

  if (loadingTimeout) clearTimeout(loadingTimeout)

  loadingTimeout = window.setTimeout(() => {
    loading.value = true
  }, 200)
}

function handlePlaying(): void {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
  loading.value = false
}

function handleLoadedData(): void {
  videoReady.value = true
  loading.value = false
}

/* =========================================================
 * 播放控制策略
 * ---------------------------------------------------------
 * 规则：
 * - 只允许 current slot 播放
 * - prev / next 必须暂停并重置
 * ========================================================= */
function onCanPlay(): void {
  videoRefs.value.forEach((video, idx) => {
    if (!video) return

    if (videoSlots.value[idx].type === 'current') {
      video.play().catch(() => {})
    } else {
      video.pause()
      video.currentTime = 0
    }
  })
}

/* =========================================================
 * Feed 推进（上下刷）
 * ---------------------------------------------------------
 * 不操作 DOM
 * 只推进 cursor，然后同步 Slot
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

/**
 * 鼠标滚轮控制刷视频
 * 移动端可直接替换为 touch 手势
 */
function onWheel(e: WheelEvent): void {
  if (e.deltaY > 0) nextVideo()
  else prevVideo()
}

/* =========================================================
 * 页面行为
 * ========================================================= */
function goToDetail(id: number): void {
  router.push(`/video/${id}`)
}

/* =========================================================
 * 数据获取
 * ---------------------------------------------------------
 * 首次进入页面加载 Feed
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

/**
 * 统一处理后端返回的相对路径
 */
function genUrl(path: string): string {
  if (!path) return ''
  return /^https?:\/\//.test(path)
    ? path
    : `${baseUrl}/${path.replace(/^\/+/, '')}`
}

/* =========================================================
 * 评论模块（与视频播放解耦）
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
 * 键盘交互（PC 端辅助）
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
.shuashipin-container {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18), 0 2px 8px 0 rgba(255, 255, 255, 0.08);
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* 移除悬浮变大效果 */
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

.video-bg-blur::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40%;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.38), rgba(0, 0, 0, 0.08) 80%, transparent);
  pointer-events: none;
}

.video-player-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  background: transparent;
  position: relative;
  z-index: 1;
  padding: 0;
  border: none;
  box-shadow: none;
}

/* 移除视频悬浮变大效果 */
.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
  background: transparent;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.10);
}

.video-info {
  position: absolute;
  left: 28.8px;
  bottom: 72px;
  color: #fff;
  z-index: 10;
  text-shadow: 0 2.5px 8px #000, 0 1.5px 6px #000;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.56), rgba(0, 0, 0, 0.18) 80%, transparent);
  border-radius: 14px;
  padding: 16px 28px 12px 22px;
  min-width: 162px;
  max-width: 54vw;
  box-shadow: 0 2.5px 12px 0 rgba(0, 0, 0, 0.22);
  font-weight: bold;
  font-size: 18px;
}

.video-info h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 7px;
  line-height: 1.2;
  letter-spacing: 0.5px;
}

.video-user {
  font-size: 15px;
  color: #ff2d55;
  font-weight: 600;
  text-shadow: 0 1.5px 6px #000;
}

.video-actions {
  position: absolute;
  right: 28.8px;
  bottom: 108px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28.8px;
  z-index: 20;
  background: rgba(0, 0, 0, 0.10);
  border-radius: 16px;
  padding: 10px 0;
  transition: right 0.3s, box-shadow 0.2s;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.10);
}

.video-actions.collapsed {
  right: 0;
  background: rgba(0, 0, 0, 0.02);
  padding: 7.2px 1.8px;
  min-width: 36px;
}

.collapse-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 16.2px;
  margin-bottom: 7.2px;
  cursor: pointer;
  outline: none;
  transition: color 0.2s;
}

.action-btn {
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-size: 15px;
  gap: 4px;
  transition: transform 0.18s, box-shadow 0.18s, filter 0.18s;
  margin-bottom: 7.2px;
  filter: drop-shadow(0 1.5px 4px rgba(0, 0, 0, 0.18));
}

.action-btn:hover {
  transform: scale(1.13);
  filter: drop-shadow(0 4px 12px #409eff) brightness(1.1);
}

.action-btn.mini span {
  display: none;
}

.swiper-indicator {
  position: absolute;
  right: 21.6px;
  bottom: 28.8px;
  color: #fff;
  font-size: 14.4px;
  background: rgba(0, 0, 0, 0.3);
  padding: 3.6px 10.8px;
  border-radius: 10.8px;
  z-index: 20;
}

.comment-dialog>>>.el-dialog__body {
  padding: 0 24px 24px 24px;
  background: #181818;
  color: #fff;
  max-height: 60vh;
  overflow-y: auto;
}

.comment-list {
  max-height: 40vh;
  overflow-y: auto;
  margin-bottom: 12px;
}

.no-comment {
  color: #bbb;
  text-align: center;
  padding: 16px 0;
}

.comment-input-section {
  margin-top: 8px;
  background: #222;
  border-radius: 8px;
  padding: 12px 8px 8px 8px;
}

.comment-input {
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

body,
html {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
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

.video-loading-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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
  background: transparent;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.10);
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
</style>