<template>
  <div class="video-play-page">
    <div v-if="loading" class="video-loading-mask">
      <div class="video-loading-spinner"></div>
      <div class="video-loading-text">缓冲中...</div>
    </div>
    <template v-else>
      <div class="video-header el-card">
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
              <el-button 
                size="small"
                type="danger" 
                @click="follow"
                class="unfollow-btn"
              >
                取消关注
              </el-button>
            </div>
            <!-- 已关注状态 -->
            <div v-else-if="isFollowed" class="follow-status-container">
              <el-tag size="small" type="info" class="status-tag">已关注</el-tag>
              <el-button 
                size="small"
                type="danger" 
                @click="follow"
                class="unfollow-btn"
              >
                取消关注
              </el-button>
            </div>
            <!-- 回关状态（对方关注了我，但我没有关注对方） -->
            <div v-else-if="isFollower" class="follow-status-container">
              <el-tag size="small" type="warning" class="status-tag">粉丝</el-tag>
              <el-button 
                size="small"
                type="primary" 
                @click="follow"
                class="follow-btn"
              >
                回关
              </el-button>
            </div>
            <!-- 关注按钮（未关注状态） -->
            <el-button 
              v-else
              type="primary" 
              size="small"
              @click="follow"
              class="follow-btn"
            >
              关注
            </el-button>
          </template>
          <template v-else>
            <el-tag type="info" size="small">My</el-tag>
          </template>
        </div>
      </div>
      <div class="video-section-outer">
        <div class="video-section-inner">
          <div
            class="video-blur-bg"
            :style="{ backgroundImage: `url('${previewImg}')` }"
          ></div>
          <div v-if="!isPlaying" class="video-player-real">
            <div class="video-player-wrapper">
              <img :src="previewImg" class="preview-img" />
              <button class="play-btn" @click="startPlay">
                <svg viewBox="0 0 100 100" width="60" height="60"><circle cx="50" cy="50" r="48" fill="rgba(0,0,0,0.5)"/><polygon points="40,30 75,50 40,70" fill="#fff"/></svg>
              </button>
            </div>
          </div>
          <div v-else class="video-player-real">
            <div class="video-player-wrapper">
              <video
                :src="videoSource['720p']?.url"
                :poster="previewImg"
                class="video-element"
                controls
                autoplay
                loop
                muted
                playsinline
                @waiting="handleWaiting"
                @playing="handlePlaying"
                @canplay="handleCanPlay"
                @loadeddata="handleLoadedData"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="video-stats el-card">
        <div class="stat-item">
          <el-button type="primary" text @click="handleLike">
            <el-icon><StarFilled /></el-icon> {{ isLiked ? '已点赞' : '点赞' }} {{ likeCount }}
          </el-button>
        </div>
        <div class="stat-item">
          <el-button type="warning" text @click="handleFavorite">
            <el-icon><CollectionTag /></el-icon> {{ isFavorited ? '已收藏' : '收藏' }} {{ favoriteCount }}
          </el-button>
        </div>
        <div class="stat-item">
          <el-button type="info" text @click="commentFocus">
            <el-icon><ChatDotRound /></el-icon> 评论 {{ commentCount }}
          </el-button>
        </div>
      </div>
      <div class="video-comments el-card">
        <h3>评论区 ({{ commentCount }})</h3>
        <!-- 主评论输入框 -->
        <div class="comment-input-section">
          <el-input
            v-model="commentText"
            placeholder="说点什么..."
            type="textarea"
            :rows="2"
            ref="commentInputRef"
            maxlength="200"
            show-word-limit
            class="comment-input"
          />
          <div class="comment-actions">
            <el-button type="primary" size="small" @click="submitComment">发送</el-button>
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
          
          <!-- 加载更多 -->
          <div v-if="hasMoreComments" class="load-more-comments">
            <el-button 
              :loading="commentLoading" 
              @click="loadMoreComments"
              type="primary" 
              plain
            >
              加载更多评论
            </el-button>
          </div>
          <div v-else-if="comments.length > 0" class="no-more-comments">
            没有更多评论了
          </div>
        </div>
      </div>
    </template>
    
    <!-- 回到顶部按钮 -->
    <el-backtop 
      :right="40" 
      :bottom="40"
      :visibility-height="300"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  getVideoDetail, 
  likeVideo, 
  favoriteVideo, 
  getVideoComments, 
  addComment, 
  likeComment as likeCommentAPI, 
  dislikeComment as dislikeCommentAPI,
  deleteComment
} from '@/api/video'
import CommentItem from '@/components/video/CommentItem.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StarFilled, CollectionTag, ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { followUser } from '@/api/user'
import { eventBus, EVENTS } from '@/utils/eventBus'

const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
function resolveUrl(path:any) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${baseUrl}/${path.replace(/^\/+/, '')}`
}

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const route = useRoute()
const videoId = route.params.id as string
const videoDetail = ref<any | null>(null)
const loading = ref(true)
const videoReady = ref(false)
let loadingTimeout: number | null = null

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

function handleCanPlay() {
  videoReady.value = true
  loading.value = false
}

function handleLoadedData() {
  videoReady.value = true
  loading.value = false
}

const isPlaying = ref(false)

// 视频交互状态
const isLiked = ref(false)
const isFavorited = ref(false)
const isFollowed = ref(false)
const isMutual = ref(false)
const isFollower = ref(false)

const refreshVideoDetail = async () => {
  const res = await getVideoDetail(parseInt(videoId))

  // 统一响应：{ code, msg, data, success }
  if (!res?.success) {
    throw new Error(res?.msg || '获取视频详情失败')
  }

  videoDetail.value = res.data
  isFollowed.value = res.data?.uploader?.is_followed || false
  isMutual.value = res.data?.uploader?.is_mutual || false
  isFollower.value = res.data?.uploader?.is_follower || false
}

onMounted(async () => {
  loading.value = true
  try {
    await refreshVideoDetail()
    
    // 设置交互状态
    isLiked.value = videoDetail.value.is_liked || false
    isFavorited.value = videoDetail.value.is_collected || false
    // isFollowed 已在refreshVideoDetail中赋值
    // 加载评论
    await loadComments(true)
    
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeydown)
  } catch (error) {
    console.error('加载视频详情失败:', error)
    ElMessage.error('加载视频失败')
  } finally {
    loading.value = false
  }
})

// 组件卸载时移除事件监听和清理定时器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
})

const previewImg = computed(() => resolveUrl(videoDetail.value?.cover_image))
const videoSource = computed(() => videoDetail.value ? {
  '720p': { url: resolveUrl(videoDetail.value.file_path), label: '720P' }
} : {})
const author = computed(() => {
  const u = videoDetail.value?.uploader || {}
  return {
    ...u,
    profile_picture: resolveUrl(u.profile_picture)
  }
})
const likeCount = computed(() => videoDetail.value?.like_count || 0)
const favoriteCount = computed(() => videoDetail.value?.collect_count || 0)
const commentCount = computed(() => videoDetail.value?.comment_count || 0)

const isSelf = computed(() => {
  return user.value && videoDetail.value?.uploader && user.value.id === videoDetail.value.uploader.id
})

// 计算属性确保数据正确传递
const currentUserId = computed(() => {
  return user.value?.id
})

const currentVideoOwnerId = computed(() => {
  return videoDetail.value?.uploader?.id
})

// 视频交互功能
const handleLike = async () => {
  try {
    const res = await likeVideo(parseInt(videoId))
    if (!res?.success) {
      throw new Error(res?.msg || '点赞失败')
    }
    if (res.data) {
      videoDetail.value.like_count = res.data.like_count
      isLiked.value = res.data.is_liked
    }
    ElMessage.success(isLiked.value ? '点赞成功' : '取消点赞')
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleFavorite = async () => {
  try {
    const res = await favoriteVideo(parseInt(videoId))
    if (!res?.success) {
      throw new Error(res?.msg || '收藏失败')
    }
    if (res.data) {
      videoDetail.value.collect_count = res.data.collect_count
      isFavorited.value = res.data.is_collected
    }
    ElMessage.success(isFavorited.value ? '收藏成功' : '取消收藏')
  } catch (error) {
    console.error('收藏失败:', error)
    ElMessage.error('操作失败')
  }
}

const follow = async () => {
  console.log('[DEBUG] 当前关注状态:', {
    isFollowed: isFollowed.value,
    isMutual: isMutual.value,
    isFollower: isFollower.value
  })
  
  if (isFollowed.value || isMutual.value) {
    // 取消关注需弹窗
    try {
      await ElMessageBox.confirm('确定要取消关注该用户吗？', '提示', {
        confirmButtonText: '取消关注',
        cancelButtonText: '再想想',
        type: 'warning',
      })
      const res = await followUser(author.value.id)
      if (!res?.success) {
        throw new Error(res?.msg || '取消关注失败')
      }

      // 立即更新本地状态
      if (res.data) {
        isFollowed.value = res.data.is_followed
        isMutual.value = res.data.is_mutual
        isFollower.value = res.data.is_follower

        userStore.updateFollowStats(res.data.following_count, res.data.follower_count)
        // 触发关注事件，通知其他用户更新数据
        eventBus.emit(EVENTS.USER_FOLLOW_UPDATED, {
          action: 'unfollow',
          current_user_id: user.value!.id,
          target_user_id: author.value.id,
          current_following_count: res.data.following_count,
          current_follower_count: res.data.follower_count,
          target_follower_count: res.data.follower_count // 被关注用户的粉丝数
        })
      }
      ElMessage.success('已取消关注')
    } catch (error) {
      if (error !== 'cancel') ElMessage.error('操作失败')
    }
  } else {
    // 关注或回关
    try {
      const res = await followUser(author.value.id)
      if (!res?.success) {
        throw new Error(res?.msg || '关注失败')
      }

      // 立即更新本地状态
      if (res.data) {
        isFollowed.value = res.data.is_followed
        isMutual.value = res.data.is_mutual
        isFollower.value = res.data.is_follower

        userStore.updateFollowStats(res.data.following_count, res.data.follower_count)
        // 触发关注事件，通知其他用户更新数据
        eventBus.emit(EVENTS.USER_FOLLOW_UPDATED, {
          action: 'follow',
          current_user_id: user.value!.id,
          target_user_id: author.value.id,
          current_following_count: res.data.following_count,
          current_follower_count: res.data.follower_count,
          target_follower_count: res.data.follower_count // 被关注用户的粉丝数
        })
      }
      
      // 根据关注状态显示不同的提示
      if (res.data?.is_mutual) {
        ElMessage.success('互相关注成功！')
      } else if (res.data?.is_followed && res.data?.is_follower) {
        ElMessage.success('回关成功！')
      } else if (res.data?.is_followed) {
        ElMessage.success('关注成功！')
      }
    } catch (error) {
      ElMessage.error('关注失败')
    }
  }
}

const startPlay = () => {
  isPlaying.value = true
}

// 防止键盘事件导致页面刷新
const handleKeydown = (event: KeyboardEvent) => {
  // 阻止空格键、方向键等默认行为
  if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
    event.preventDefault()
  }
}

// 评论相关
const commentText = ref('')
const commentInputRef = ref()
const comments = ref<any[]>([])
const commentPage = ref(1)
const commentSize = ref(20)
const commentTotal = ref(0)
const commentOrder = ref<'latest' | 'hottest'>('latest') // 'latest' 或 'hottest'
const commentLoading = ref(false)
const hasMoreComments = ref(true)

const loadComments = async (reset = false) => {
  if (commentLoading.value) return
  
  try {
    commentLoading.value = true
    
    if (reset) {
      commentPage.value = 1
      comments.value = []
    }
    
    const res = await getVideoComments(parseInt(videoId), {
      page: commentPage.value,
      size: commentSize.value,
      order: commentOrder.value
    })
    
    const newComments = (res.data?.items || []).map(mapComment)
    
    if (reset) {
      comments.value = newComments
    } else {
      comments.value.push(...newComments)
    }
    
    commentTotal.value = res.data?.total || 0
    hasMoreComments.value = comments.value.length < commentTotal.value
    
    if (!reset) {
      commentPage.value++
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
  } finally {
    commentLoading.value = false
  }
}

const changeCommentOrder = async (order: 'latest' | 'hottest') => {
  commentOrder.value = order
  await loadComments(true)
}

const loadMoreComments = async () => {
  if (hasMoreComments.value && !commentLoading.value) {
    await loadComments()
  }
}

function mapComment(item: any) {
  // 映射后端结构到前端结构
  return {
    ...item,
    id: parseInt(item.id), // 确保ID是数字类型
    username: item.user?.username || '',
    avatar: resolveUrl(item.user?.profile_picture),
    user_id: item.user?.id || item.user_id,
    video_id: parseInt(videoId), // 确保video_id被传递
    time: dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss'),
    likes: item.like_count || 0,
    dislikes: item.dislike_count || 0,
    replyCount: item.reply_count || 0,
    replies: [], // 用于存储回复列表
    children: [] // 保持兼容性
  }
}

const commentFocus = () => {
  commentInputRef.value && commentInputRef.value.focus()
}

const submitComment = async () => {
  if (!commentText.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  try {
    const res = await addComment(parseInt(videoId), {
      content: commentText.value,
      parent_id: null
    })
    
    // 直接添加新评论到列表顶部，而不是重新加载
    if (res.data) {
      const newComment = mapComment(res.data)
      comments.value.unshift(newComment)
      commentTotal.value++
    }
    
    commentText.value = ''
    ElMessage.success('评论成功！')
  } catch (error) {
    console.error('发表评论失败:', error)
    ElMessage.error('评论失败')
  }
}

const handleLikeComment = async (comment: any) => {
  try {
    const res = await likeCommentAPI(comment.id)
    
    // 直接更新评论的点赞数
    if (res.data && res.data.success) {
      const targetComment = findCommentById(comments.value, comment.id)
      if (targetComment) {
        // 使用Vue的响应式更新
        Object.assign(targetComment, {
          likes: res.data.like_count,
          dislikes: res.data.dislike_count
        })
        // 强制触发响应式更新
        await nextTick()
      }
    }
    ElMessage.success('点赞成功！')
  } catch (error) {
    console.error('评论点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleDislikeComment = async (comment: any) => {
  try {
    const res = await dislikeCommentAPI(comment.id)
    
    // 直接更新评论的踩数
    if (res.data && res.data.success) {
      const targetComment = findCommentById(comments.value, comment.id)
      if (targetComment) {
        // 使用Vue的响应式更新
        Object.assign(targetComment, {
          likes: res.data.like_count,
          dislikes: res.data.dislike_count
        })
        // 强制触发响应式更新
        await nextTick()
      }
    }
    ElMessage.success('踩成功！')
  } catch (error) {
    console.error('评论踩失败:', error)
    ElMessage.error('操作失败')
  }
}

// 递归查找评论
const findCommentById = (commentList: any[], commentId: number | string): any | null => {
  for (const comment of commentList) {
    // 确保ID类型匹配
    if (comment.id == commentId) {
      return comment
    }
    // 递归查找回复中的评论
    if (comment.replies && comment.replies.length > 0) {
      const found = findCommentById(comment.replies, commentId)
      if (found) return found
    }
    // 也检查children数组（兼容性）
    if (comment.children && comment.children.length > 0) {
      const found = findCommentById(comment.children, commentId)
      if (found) return found
    }
  }
  return null
}



const handleReplyComment = async ({ parent, content }: { parent: any; content: string }) => {
  try {
    const res = await addComment(parseInt(videoId), {
      content,
      parent_id: parent.id
    })
    
    // 直接添加新回复到对应评论的回复列表
    if (res.data) {
      const newReply = mapComment(res.data)
      const targetComment = findCommentById(comments.value, parent.id)
      if (targetComment) {
        // 确保replies数组存在
        if (!targetComment.replies) {
          targetComment.replies = []
        }
        // 添加新回复到开头
        targetComment.replies.unshift(newReply)
        // 更新回复数
        targetComment.replyCount = (targetComment.replyCount || 0) + 1
      }
    }
    
    ElMessage.success('回复成功！')
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  }
}

const handleDeleteComment = async (comment: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    await deleteComment(comment.id)
    
    // 直接从列表中移除评论
    removeCommentById(comments.value, comment.id)
    commentTotal.value = Math.max(0, commentTotal.value - 1)
    
    ElMessage.success('删除成功！')
  } catch (error) {
    console.error('删除评论失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 递归移除评论
const removeCommentById = (commentList: any[], commentId: number | string): boolean => {
  for (let i = 0; i < commentList.length; i++) {
    if (commentList[i].id === commentId) {
      commentList.splice(i, 1)
      return true
    }
    // 递归查找回复中的评论
    if (commentList[i].replies && commentList[i].replies.length > 0) {
      if (removeCommentById(commentList[i].replies, commentId)) {
        return true
      }
    }
  }
  return false
}

const router = useRouter()
function goToUserProfile() {
  const myId = userStore.user?.id
  const authorId = videoDetail.value?.uploader?.id
  if (!authorId) return
  if (myId && authorId == myId) {
    router.push('/user/profile')
  } else {
    router.push(`/user/${authorId}`)
  }
}
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 16px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
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
}
.video-section-inner {
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.video-blur-bg {
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  width: 100%; height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(32px) brightness(0.7);
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
:deep(.video-element), :deep(video) {
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
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.10);
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
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
}
.stat-item {
  display: flex;
  align-items: center;
}
.video-comments {
  padding: 24px 24px 16px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
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