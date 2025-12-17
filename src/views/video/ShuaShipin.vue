<template>
  <div class="shuashipin-container">
    <div class="video-swiper" ref="swiperRef">
      <div v-for="(video, idx) in videoList" :key="video.id" class="video-item"
        :class="{ active: idx === currentIndex }" @wheel.passive="onWheel(idx, $event)" v-show="idx === currentIndex">
        <div class="video-bg-blur" :style="{ backgroundImage: `url('${video.cover_image}')` }"></div>
        <div class="video-player-wrapper">
          <video ref="el => videoRefs[idx] = el" :src="video.videoUrl" :poster="video.cover_image" class="video-player"
            controls autoplay loop muted playsinline @canplay="onCanPlay(idx)" @waiting="handleWaiting"
            @playing="handlePlaying" @loadeddata="handleLoadedData" />
        </div>
        <!-- 左下角视频信息区 -->
        <div class="video-info-box">
          <div class="video-title" @click="goToDetail(video.id)">{{ video.title }}</div>
          <div class="video-desc">{{ video.description }}</div>
          <div class="video-user">@{{ video.user }}</div>
        </div>
        <!-- 右侧点赞、收藏、评论等侧边栏 -->
      </div>
    </div>
    <!-- swiper-indicator计数 -->

    <!-- 评论弹窗 -->

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type { VideoItem, RawVideoItem } from '@/types/models/video.ts'
import type { CommentItemType } from '@/types/models/comment.ts'

import {
  getHotVideos,
  getVideoCommentTree,
} from '@/api/video'

/* -------------------------------------------
   类型定义（企业级, 强类型）
------------------------------------------- */



/* -------------------------------------------
   响应式状态
------------------------------------------- */
const videoList = ref<VideoItem[]>([])
const currentIndex = ref<number>(0)
const swiperRef = ref<HTMLDivElement | null>(null)
const videoRefs = ref<HTMLVideoElement[]>([])

const comments = ref<CommentItemType[]>([])

const loading = ref<boolean>(false)
const videoReady = ref<boolean>(false)

let loadingTimeout: number | null = null

const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
const router = useRouter()

/* -------------------------------------------
   工具函数：处理延迟缓冲显示
------------------------------------------- */
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

/* -------------------------------------------
   页面行为
------------------------------------------- */
function goToDetail(id: number): void {
  router.push(`/video/${id}`)
}

/* -------------------------------------------
   视频数据获取
------------------------------------------- */
async function fetchVideos(): Promise<void> {
  const res = await getHotVideos({ page: 1, size: 20 })
  if (!res?.success) return

  const items = (res.data?.items ?? []) as any as RawVideoItem[]

  videoList.value = items.map((item) => ({
    id: item.id,
    title: item.title,
    user: item.uploader_username,
    description: item.description || '',
    cover_image: genUrl(item.cover_image),
    videoUrl: genUrl(item.file_path)
  }))

  if (videoList.value.length > 0) {
    await loadComments()
  }
}

function genUrl(path: string): string {
  if (!path) return ''
  return /^https?:\/\//.test(path)
    ? path
    : `${baseUrl}/${path.replace(/^\/+/, '')}`
}

/* -------------------------------------------
   滚轮切换视频
------------------------------------------- */
function onWheel(idx: number, e: WheelEvent): void {
  if (e.deltaY > 0 && currentIndex.value < videoList.value.length - 1) {
    switchVideo(currentIndex.value + 1)
  } else if (e.deltaY < 0 && currentIndex.value > 0) {
    switchVideo(currentIndex.value - 1)
  }
}

/* -------------------------------------------
   视频播放控制
------------------------------------------- */
function onCanPlay(idx: number): void {
  videoRefs.value.forEach((v, i) => {
    if (!v) return

    if (i === currentIndex.value) {
      videoReady.value = true
      loading.value = false
      v.play().catch(err => console.warn('视频播放失败:', err))
    } else {
      v.pause()
    }
  })
}

async function switchVideo(idx: number): Promise<void> {
  if (idx < 0 || idx >= videoList.value.length) return

  videoReady.value = false
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }

  currentIndex.value = idx

  nextTick(() => onCanPlay(idx))
  // await loadComments()
}

/* -------------------------------------------
   键盘事件
------------------------------------------- */
function handleKeydown(e: KeyboardEvent): void {
  const keys = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  if (keys.includes(e.code)) e.preventDefault()

  const curVideo = videoRefs.value[currentIndex.value]
  if (!curVideo) return

  switch (e.code) {
    case 'ArrowUp':
      switchVideo(currentIndex.value - 1)
      break
    case 'ArrowDown':
      switchVideo(currentIndex.value + 1)
      break
    case 'Space':
      curVideo.paused ? curVideo.play() : curVideo.pause()
      break
    case 'ArrowRight':
      if (videoReady.value) curVideo.currentTime = Math.min(curVideo.duration, curVideo.currentTime + 5)
      break
    case 'ArrowLeft':
      if (videoReady.value) curVideo.currentTime = Math.max(0, curVideo.currentTime - 5)
      break
  }
}

/* -------------------------------------------
   视频操作（点赞、收藏）
------------------------------------------- */

/* -------------------------------------------
   评论区
------------------------------------------- */
async function loadComments(): Promise<void> {
  const video = videoList.value[currentIndex.value]
  if (!video) return

  const res = await getVideoCommentTree(video.id)

  if (!res?.success) {
    comments.value = []
    return
  }

  const raw = (res.data ?? []) as RawComment[]
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

/* -------------------------------------------
   评论点赞 / 回复 / 删除
------------------------------------------- */

/* -------------------------------------------
   生命周期
------------------------------------------- */
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