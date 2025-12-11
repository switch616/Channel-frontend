<template>
  <div class="video-play-page">
    <div v-if="loading" class="video-loading-mask">
      <div class="video-loading-spinner"></div>
      <div class="video-loading-text">缓冲中...</div>
    </div>
    <template v-else-if="videoDetail">
      <div class="video-header">
        <div class="video-info">
          <h2 class="video-title">{{ videoDetail.title }}</h2>
          <div class="video-desc">{{ videoDetail.description }}</div>
        </div>
        <div class="author-info">
          <el-avatar :src="author.profile_picture" size="large" @click="goToUserProfile" style="cursor:pointer;" />
          <div class="author-meta">
            <div class="author-name">{{ author.username }}</div>
            <div class="author-fans">粉丝 {{ author.fans_count || 0 }}</div>
          </div>
          <template v-if="!isSelf">
            <!-- 互相关注状态 -->
            <div v-if="isMutual" class="follow-status-container">
              <el-tag size="small" type="success" class="status-tag">互相关注</el-tag>
              <el-button size="small" type="danger" @click="handleFollow" class="unfollow-btn">
                取消关注
              </el-button>
            </div>
            <!-- 已关注状态 -->
            <div v-else-if="isFollowed" class="follow-status-container">
              <el-tag size="small" type="info" class="status-tag">已关注</el-tag>
              <el-button size="small" type="danger" @click="handleFollow" class="unfollow-btn">
                取消关注
              </el-button>
            </div>
            <!-- 回关状态（对方关注了我，但我没有关注对方） -->
            <div v-else-if="isFollower" class="follow-status-container">
              <el-tag size="small" type="warning" class="status-tag">粉丝</el-tag>
              <el-button size="small" type="primary" @click="handleFollow" class="follow-btn">
                回关
              </el-button>
            </div>
            <!-- 关注按钮（未关注状态） -->
            <el-button v-else type="primary" size="small" @click="handleFollow" class="follow-btn">
              关注
            </el-button>
          </template>
          <template v-else>
            <el-tag type="info" size="small">My</el-tag>
          </template>
        </div>
      </div>
      <div class="video-section-outer fixed-canvas">
        <div class="video-section-inner">
          <div class="video-blur-bg" :style="{ backgroundImage: `url('${previewImg}')` }"></div>
          <div v-if="!isPlaying" class="video-player-real">
            <div class="video-player-wrapper">
              <img :src="previewImg" class="preview-img" />
              <button class="play-btn" @click="startPlay">
                <svg viewBox="0 0 100 100" width="60" height="60">
                  <circle cx="50" cy="50" r="48" fill="rgba(0,0,0,0.5)" />
                  <polygon points="40,30 75,50 40,70" fill="#fff" />
                </svg>
              </button>
            </div>
          </div>
          <div v-else class="video-player-real">
            <div class="video-player-wrapper">
              <VideoPlayer :sources="videoSource" :poster="previewImg" :autoplay="true" :video-id="videoId" />
            </div>
          </div>
        </div>
      </div>
      <div class="video-stats">
        <div class="stat-item">
          <el-button type="primary" text @click="handleLike">
            <el-icon>
              <StarFilled />
            </el-icon> {{ isLiked ? '已点赞' : '点赞' }} {{ likeCount }}
          </el-button>
        </div>
        <div class="stat-item">
          <el-button type="warning" text @click="handleFavorite">
            <el-icon>
              <CollectionTag />
            </el-icon> {{ isFavorited ? '已收藏' : '收藏' }} {{ favoriteCount }}
          </el-button>
        </div>
        <div class="stat-item">
          <el-button type="info" text @click="commentFocus">
            <el-icon>
              <ChatDotRound />
            </el-icon> 评论 {{ commentCount }}
          </el-button>
        </div>
      </div>
      <div class="video-comments el-card">
        <h3>评论区 ({{ commentCount }})</h3>
        <!-- 主评论输入框 -->
        <div class="comment-input-section">
          <el-input v-model="commentText" placeholder="说点什么..." type="textarea" :rows="2" ref="commentInputRef"
            maxlength="200" show-word-limit class="comment-input" />
          <div class="comment-actions">
              <el-button type="primary" size="small" @click="handleSubmitComment">发送</el-button>
          </div>
        </div>
        <el-divider />

        <!-- 评论排序 -->
        <div class="comment-sort">
          <el-radio-group v-model="commentOrder" @change="changeCommentOrder">
            <el-radio-button value="latest">最新</el-radio-button>
            <el-radio-button value="hottest">最热</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 评论列表 -->
        <div class="comment-list">
          <div v-if="comments.length === 0 && !commentLoading" class="no-comment">暂无评论</div>
          <div v-if="commentLoading && comments.length === 0" class="comment-loading">
            <el-skeleton :rows="3" animated />
          </div>
          <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment" :level="0"
            :children="comment.children || []" :userId="currentUserId" :videoOwnerId="currentVideoOwnerId"
            @like="handleLikeComment" @dislike="handleDislikeComment" @reply="handleReplyComment"
            @delete="handleDeleteComment" />

          <!-- 加载更多 -->
          <div v-if="hasMoreComments" class="load-more-comments">
            <el-button :loading="commentLoading" @click="loadMoreComments" type="primary" plain>
              加载更多评论
            </el-button>
          </div>
          <div v-else-if="comments.length > 0" class="no-more-comments">
            没有更多评论了
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="video-error">视频不存在或已被删除</div>
    </template>

    <!-- 回到顶部按钮 -->
    <el-backtop :right="40" :bottom="40" :visibility-height="300" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { StarFilled, CollectionTag, ChatDotRound } from '@element-plus/icons-vue'
import CommentItem from '@/components/video/CommentItem.vue'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import { useVideoDetail } from '@/composables/useVideoDetail'
import { useComments } from '@/composables/useComments'

const route = useRoute()
const videoId = route.params.id as string

const {
  videoDetail,
  loading,
  interactionState,
  previewImg,
  videoSource,
  author,
  likeCount,
  favoriteCount,
  commentCount,
  isSelf,
  loadDetail,
  handleLike,
  handleFavorite,
  handleFollow,
  goToUserProfile,
  currentUserId
} = useVideoDetail(videoId)

const isLiked = computed(() => interactionState.value.isLiked)
const isFavorited = computed(() => interactionState.value.isFavorited)
const isFollowed = computed(() => interactionState.value.isFollowed)
const isMutual = computed(() => interactionState.value.isMutual)
const isFollower = computed(() => interactionState.value.isFollower)
const currentVideoOwnerId = computed(() => videoDetail.value?.uploader?.id)

const {
  comments,
  commentOrder,
  commentLoading,
  hasMoreComments,
  loadComments,
  loadMoreComments,
  changeCommentOrder,
  submitComment,
  handleLikeComment,
  handleDislikeComment,
  handleDeleteComment
} = useComments(videoId)

const isPlaying = ref(false)
const commentText = ref('')
const commentInputRef = ref()

const startPlay = () => {
  isPlaying.value = true
}

const handleKeydown = (event: KeyboardEvent) => {
  if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
    event.preventDefault()
  }
}

const commentFocus = () => {
  commentInputRef.value && commentInputRef.value.focus()
}

const handleSubmitComment = async () => {
  const ok = await submitComment(commentText.value, null)
  if (ok && videoDetail.value) {
    videoDetail.value.comment_count = (videoDetail.value.comment_count || 0) + 1
    commentText.value = ''
  }
}

const handleReplyComment = async ({ parent, content }: { parent: any; content: string }) => {
  const ok = await submitComment(content, parent.id)
  if (ok && videoDetail.value) {
    videoDetail.value.comment_count = (videoDetail.value.comment_count || 0) + 1
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadDetail()
    await loadComments(true)
    document.addEventListener('keydown', handleKeydown)
  } catch (error) {
    console.error('加载视频详情失败:', error)
    ElMessage.error('加载视频失败')
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.video-play-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 0 40px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.video-header {
  display: flex !important;

  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 16px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.08);
}

.video-info {
  flex: 1;
}

.video-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 8px;
}

.video-desc {
  color: #888;
  font-size: 15px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
}

.author-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-weight: bold;
  font-size: 16px;
}

.author-fans {
  color: #999;
  font-size: 13px;
}

.video-section-outer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background: transparent;
  max-width: 890px;
  margin: 0 auto;
}

.video-section-inner {
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 900px;
  height: 500px;
  max-height: 500px;
  aspect-ratio: 9 / 5;
}

.video-blur-bg {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(40px) brightness(0.88) saturate(1.15);
  transform: scale(1.1);
  transform-origin: center;
  background-color: #0f1115;
  z-index: 1;
  pointer-events: none;
  border-radius: 20px;
}

.video-player-real {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 不加圆角，overflow由外层控制 */
}

.video-player-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.video-element),
:deep(video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent;
  /* 不要加 border-radius */
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* 不要加 border-radius */
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.10);
  z-index: 2;
  position: relative;
}

.play-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  z-index: 2;
  transition: transform 0.2s;
}

.play-btn:hover {
  transform: translate(-50%, -50%) scale(1.08);
}

.video-stats {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 32px;
  padding: 12px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.08);
}

.stat-item {
  display: flex;
  align-items: center;
}

.video-comments {
  padding: 24px 24px 16px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.08);
}

.comment-input {
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.comment-sort {
  margin-bottom: 16px;
  padding: 0 4px;
}

.comment-list {
  margin-top: 8px;
}

.comment-loading {
  padding: 20px 0;
}

.no-comment {
  color: #bbb;
  text-align: center;
  padding: 16px 0;
}

.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-main {
  display: flex;
  gap: 12px;
  position: relative;
}

.comment-main[style*="margin-left: 32px"] {
  border-left: 2px solid #e1e5e9;
  padding-left: 12px;
}

.comment-main[style*="margin-left: 64px"] {
  border-left: 2px solid #e1e5e9;
  padding-left: 12px;
}

.comment-main[style*="margin-left: 96px"] {
  border-left: 2px solid #e1e5e9;
  padding-left: 12px;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-username {
  font-weight: bold;
  color: #409EFF;
  font-size: 14px;
}

.comment-time {
  color: #999;
  font-size: 12px;
}

.comment-text {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #333;
}

.comment-actions-inline {
  display: flex;
  gap: 16px;
}

.comment-actions-inline .el-button {
  padding: 0;
  height: auto;
  font-size: 12px;
  color: #666;
}

.comment-actions-inline .el-button:hover {
  color: #409EFF;
}

/* 关注按钮样式 */
.follow-status-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  font-size: 12px;
  padding: 4px 8px;
}

.follow-btn {
  min-width: 60px;
  font-size: 12px;
  padding: 6px 12px;
}

.unfollow-btn {
  min-width: 70px;
  font-size: 11px;
  padding: 4px 8px;
}

/* 回复输入框 */
.reply-input-section {
  margin: 12px 0 12px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.reply-input {
  margin-bottom: 8px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 加载更多评论 */
.load-more-comments {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px 0;
}

.no-more-comments {
  width: 100%;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.follow-btn {
  min-width: 64px;
  font-weight: bold;
  border-radius: 16px;
  transition: all 0.2s;
}

.follow-btn:not(.el-button--default) {
  background: #409eff;
  color: #fff;
  border: none;
}

.follow-btn.el-button--default {
  background: #fff;
  color: #888;
  border: 1.5px solid #dcdfe6;
}

.follow-btn.el-button--default:hover {
  color: #409eff;
  border-color: #409eff;
  background: #f4f8ff;
}

.follow-btn:not(.el-button--default):hover {
  background: #66b1ff;
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
}

/* 自定义回到顶部按钮样式 */
:deep(.el-backtop) {
  background-color: rgba(64, 158, 255, 0.9);
  color: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

:deep(.el-backtop:hover) {
  background-color: rgba(64, 158, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.video-loading-spinner {
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