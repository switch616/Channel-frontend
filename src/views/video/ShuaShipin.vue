<template>
  <div class="shuashipin-container">
    <div class="video-swiper" ref="swiperRef">
      <div
        v-for="(video, idx) in videoList"
        :key="video.id"
        class="video-item"
        :class="{active: idx === currentIndex}"
        @wheel.passive="onWheel(idx, $event)"
        v-show="idx === currentIndex"
      >
        <div class="video-bg-blur" :style="{ backgroundImage: `url('${video.cover_image}')` }"></div>
        <div class="video-player-wrapper">
        <video
            ref="el => videoRefs[idx] = el"
          :src="video.videoUrl"
          :poster="video.cover_image"
          class="video-player"
          controls
          autoplay
          loop
          muted
          playsinline
          @canplay="onCanPlay(idx)"
          @waiting="handleWaiting"
          @playing="handlePlaying"
          @loadeddata="handleLoadedData"
        />
        </div>
        <!-- 左下角视频信息区 -->
        <div class="video-info-box">
          <div class="video-title" @click="goToDetail(video.id)">{{ video.title }}</div>
          <div class="video-desc">{{ video.description }}</div>
          <div class="video-user">@{{ video.user }}</div>
        </div>
        <!-- 移除右侧点赞、收藏、评论等侧边栏 -->
        <!-- <div class="video-actions" :class="{ collapsed: actionsCollapsed }"> ... </div> -->
      </div>
    </div>
    <!-- 移除swiper-indicator计数 -->
    <!-- <div class="swiper-indicator">{{ currentIndex+1 }}/{{ videoList.length }}</div> -->
    <!-- 评论弹窗 -->
    <el-dialog v-model="showCommentDialog" width="480px" :close-on-click-modal="true" class="comment-dialog" append-to-body>
      <template #header>
        <span>评论区</span>
      </template>
      <div class="comment-list">
        <template v-if="comments.length">
          <CommentItem
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            :level="0"
            :children="comment.children || []"
            :userId="currentUserId"
            :videoOwnerId="currentVideoOwnerId"
            @like="handleLikeComment"
            @dislike="handleDislikeComment"
            @reply="handleReplyComment"
            @delete="handleDeleteComment"
          />
        </template>
        <div v-else class="no-comment">暂无评论</div>
      </div>
      <div class="comment-input-section">
        <el-input
          v-model="commentText"
          placeholder="说点什么..."
          type="textarea"
          :rows="2"
          maxlength="200"
          show-word-limit
          class="comment-input"
        />
        <div class="comment-actions">
          <el-button type="primary" size="small" @click="submitComment">发送</el-button>
        </div>
      </div>
    </el-dialog>
    <div v-if="loading" class="video-loading-mask">
      <div class="video-loading-spinner"></div>
      <div class="video-loading-text">缓冲中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getHotVideos, getVideoCommentTree, addComment, likeComment as likeCommentAPI, dislikeComment as dislikeCommentAPI, deleteComment as deleteCommentAPI, favoriteVideo, likeVideo as likeVideoAPI } from '@/api/video'
import { ElMessage } from 'element-plus'
import CommentItem from '@/components/video/CommentItem.vue'

const videoList = ref([])
const currentIndex = ref(0)
const swiperRef = ref(null)
const videoRefs = ref([])
const showCommentDialog = ref(false)
const comments = ref([])
const commentText = ref('')
const currentUserId = ref(1) // TODO: 替换为实际用户ID
const currentVideoOwnerId = ref(1) // TODO: 替换为实际视频作者ID
const actionsCollapsed = ref(false)
const loading = ref(false)
const videoReady = ref(false)
let loadingTimeout = null

function handleWaiting() {
  // 只有在视频真正缓冲时才显示加载状态
  if (videoReady.value) {
    // 清除之前的定时器
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }
    // 延迟显示加载状态，避免快速切换
    loadingTimeout = setTimeout(() => {
      loading.value = true 
    }, 200)
  }
}

function handlePlaying() {
  // 清除定时器
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
  loading.value = false 
}

function handleLoadedData() {
  videoReady.value = true
  loading.value = false
}

const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')

const router = useRouter()
function goToDetail(id) {
  router.push(`/video/${id}`)
}

const fetchVideos = async () => {
  const res = await getHotVideos({ page: 1, size: 20 })
  if (!res?.success) {
    return
  }
  const data = res.data || {}
  videoList.value = (data.items || []).map(item => ({
    id: item.id,
    title: item.title,
    user: item.uploader_username,
    description: item.description || '',
    cover_image: /^https?:\/\//.test(item.cover_image)
      ? item.cover_image
      : `${baseUrl}/${item.cover_image?.replace(/^\/+/, '') || ''}`,
    videoUrl: /^https?:\/\//.test(item.file_path)
      ? item.file_path
      : `${baseUrl}/${item.file_path?.replace(/^\/+/, '') || ''}`,
  }))
  if (videoList.value.length) {
    await loadComments()
  }
}

const onWheel = (idx, e) => {
  if (e.deltaY > 0 && currentIndex.value < videoList.value.length - 1) {
    switchVideo(currentIndex.value + 1)
  } else if (e.deltaY < 0 && currentIndex.value > 0) {
    switchVideo(currentIndex.value - 1)
  }
}

const onCanPlay = (idx) => {
  videoRefs.value.forEach((v, i) => {
    if (v) {
      if (i === currentIndex.value) {
        // 设置视频准备状态
        videoReady.value = true
        loading.value = false
        v.play().catch(err => {
          console.log('视频播放失败:', err)
        })
      } else {
        v.pause()
      }
    }
  })
}

const switchVideo = async (idx) => {
  if (idx < 0 || idx >= videoList.value.length) return
  
  // 重置视频状态
  videoReady.value = false
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
  
  currentIndex.value = idx
  nextTick(() => {
    onCanPlay(idx)
  })
  await loadComments()
}

const handleKeydown = (e) => {
  // 阻止默认行为，防止页面刷新
  if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
    e.preventDefault()
  }
  
  if (e.code === 'ArrowUp') {
    switchVideo(currentIndex.value - 1)
  } else if (e.code === 'ArrowDown') {
    switchVideo(currentIndex.value + 1)
  } else if (e.code === 'Space') {
    const curVideo = videoRefs.value[currentIndex.value]
    if (!curVideo) return
    if (curVideo.paused) {
      curVideo.play()
    } else {
      curVideo.pause()
    }
  } else if (e.code === 'ArrowRight') {
    const curVideo = videoRefs.value[currentIndex.value]
    if (!curVideo || !videoReady.value) return
    // 防抖处理快进
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }
    curVideo.currentTime = Math.min(curVideo.duration, curVideo.currentTime + 5)
  } else if (e.code === 'ArrowLeft') {
    const curVideo = videoRefs.value[currentIndex.value]
    if (!curVideo || !videoReady.value) return
    // 防抖处理快退
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }
    curVideo.currentTime = Math.max(0, curVideo.currentTime - 5)
  }
}

const likeVideo = async () => {
  const video = videoList.value[currentIndex.value]
  if (!video) return
  try {
    await likeVideoAPI(video.id)
    ElMessage.success('点赞成功')
  } catch {
    ElMessage.error('点赞失败')
  }
}

const collectVideo = async () => {
  const video = videoList.value[currentIndex.value]
  if (!video) return
  try {
    await favoriteVideo(video.id)
    ElMessage.success('收藏成功')
  } catch {
    ElMessage.error('收藏失败')
  }
}

const shareVideo = () => {
  ElMessage.info('分享功能待实现')
}

const loadComments = async () => {
  const video = videoList.value[currentIndex.value]
  if (!video) return
  try {
    const res = await getVideoCommentTree(video.id)
    if (!res?.success) {
      comments.value = []
      return
    }
    comments.value = (res.data || []).map(mapComment)
  } catch {
    comments.value = []
  }
}

function mapComment(item) {
  return {
    ...item,
    username: item.user?.username || '',
    avatar: item.user?.profile_picture || '',
    user_id: item.user?.id || item.user_id,
    time: item.created_at,
    likes: item.like_count || 0,
    dislikes: item.dislike_count || 0,
    replyCount: item.reply_count || 0,
    children: (item.children || []).map(mapComment)
  }
}

const submitComment = async () => {
  const video = videoList.value[currentIndex.value]
  if (!video || !commentText.value.trim()) return
  try {
    await addComment(video.id, {
      video_id: video.id,
      content: commentText.value,
      parent_id: null
    })
    await loadComments()
    commentText.value = ''
    ElMessage.success('评论成功！')
  } catch {
    ElMessage.error('评论失败')
  }
}

const handleLikeComment = async (comment) => {
  try {
    await likeCommentAPI(comment.id)
    await loadComments()
    ElMessage.success('点赞成功！')
  } catch {
    ElMessage.error('操作失败')
  }
}
const handleDislikeComment = async (comment) => {
  try {
    await dislikeCommentAPI(comment.id)
    await loadComments()
    ElMessage.success('踩成功！')
  } catch {
    ElMessage.error('操作失败')
  }
}
const handleReplyComment = async ({ parent, content }) => {
  const video = videoList.value[currentIndex.value]
  if (!video) return
  try {
    await addComment(video.id, {
      video_id: video.id,
      content,
      parent_id: parent.id
    })
    await loadComments()
    ElMessage.success('回复成功！')
  } catch {
    ElMessage.error('回复失败')
  }
}
const handleDeleteComment = async (comment) => {
  try {
    await deleteCommentAPI(comment.id)
    await loadComments()
    ElMessage.success('删除成功！')
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchVideos()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  // 清理定时器
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
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
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18), 0 2px 8px 0 rgba(255,255,255,0.08);
  border: 1.5px solid rgba(255,255,255,0.18);
  margin: 0;
  padding: 0;
  overflow: hidden;
}
/* 移除悬浮变大效果 */
/* .shuashipin-container:hover {
  box-shadow: 0 16px 48px 0 rgba(0,0,0,0.28), 0 4px 16px 0 rgba(255,255,255,0.12);
  transform: translateY(-6px) scale(1.015);
} */
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
  left: 0; right: 0; bottom: 0; height: 40%;
  background: linear-gradient(0deg,rgba(0,0,0,0.38),rgba(0,0,0,0.08) 80%,transparent);
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
/* .video-player-wrapper:hover {
  box-shadow: 0 16px 48px 0 rgba(0,0,0,0.28), 0 4px 16px 0 rgba(255,255,255,0.12);
  transform: translateY(-6px) scale(1.015);
} */
.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
  background: transparent;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.10);
}
.video-info {
  position: absolute;
  left: 28.8px;
  bottom: 72px;
  color: #fff;
  z-index: 10;
  text-shadow: 0 2.5px 8px #000, 0 1.5px 6px #000;
  background: linear-gradient(90deg,rgba(0,0,0,0.56),rgba(0,0,0,0.18) 80%,transparent);
  border-radius: 14px;
  padding: 16px 28px 12px 22px;
  min-width: 162px;
  max-width: 54vw;
  box-shadow: 0 2.5px 12px 0 rgba(0,0,0,0.22);
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
  background: rgba(0,0,0,0.10);
  border-radius: 16px;
  padding: 10px 0;
  transition: right 0.3s, box-shadow 0.2s;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.10);
}
.video-actions.collapsed {
  right: 0;
  background: rgba(0,0,0,0.02);
  padding: 7.2px 1.8px; /* 8,2*0.9 */
  min-width: 36px; /* 40*0.9 */
}
.collapse-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 16.2px; /* 18*0.9 */
  margin-bottom: 7.2px; /* 8*0.9 */
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
  filter: drop-shadow(0 1.5px 4px rgba(0,0,0,0.18));
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
  right: 21.6px; /* 24*0.9 */
  bottom: 28.8px; /* 32*0.9 */
  color: #fff;
  font-size: 14.4px; /* 16*0.9 */
  background: rgba(0,0,0,0.3);
  padding: 3.6px 10.8px; /* 4,12*0.9 */
  border-radius: 10.8px; /* 12*0.9 */
  z-index: 20;
}
.comment-dialog >>> .el-dialog__body {
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
body, html {
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
  left: 0; top: 0; right: 0; bottom: 0;
  width: 100%; height: 100%;
  background: rgba(255,255,255,0.18);
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
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.10);
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.video-loading-text {
  color: #409EFF;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 0 2px 8px #fff;
  letter-spacing: 2px;
}
</style> 