<template>
  <div class="comment-item" :style="{ marginLeft: getCommentIndent(level) + 'px' }" :class="{ 
    'deep-nested': level > 2,
    'max-level': isMaxLevel 
  }">
    <div class="comment-main">
      <div class="comment-avatar">
        <el-avatar :src="comment.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" size="small" />
      </div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-username">{{ comment.username }}</span>
          <span class="comment-time">{{ comment.time }}</span>
        </div>
        <div class="comment-text">{{ comment.content }}</div>
        <div class="comment-actions-inline">
          <el-button text size="small" @click="handleLike">点赞 {{ comment.likes || 0 }}</el-button>
          <el-button text size="small" @click="handleDislike">踩 {{ comment.dislikes || 0 }}</el-button>
          <el-button text size="small" @click="showReplyInput">回复</el-button>
          <el-button v-if="comment.replyCount > 0 || replies.length > 0" text size="small" @click="toggleReplies">
            {{ showReplies ? '收起回复' : `查看回复(${comment.replyCount || replies.length || 0})` }}
          </el-button>
          <el-button v-if="canDelete" text size="small" type="danger" @click="onDelete">删除</el-button>
        </div>
      </div>
    </div>
    <!-- 回复输入框 -->
    <div v-if="showReply" class="reply-input-section">
      <el-input
        v-model="replyText"
        :placeholder="`回复 @${comment.username}`"
        type="textarea"
        :rows="1"
        maxlength="200"
        show-word-limit
        class="reply-input"
      />
      <div class="reply-actions">
        <el-button size="small" @click="cancelReply">取消</el-button>
        <el-button type="primary" size="small" @click="submitReply">回复</el-button>
      </div>
    </div>
    <!-- 子评论递归渲染 -->
    <div v-if="showReplies && replies.length > 0" class="children-comments">
      <div class="replies-header">
        <span class="replies-count">{{ replies.length }} 条回复</span>
      </div>
      
      <!-- YouTube风格：超过2层显示折叠按钮 -->
      <template v-if="shouldCollapseDeepComments">
        <div class="deep-comments-collapsed">
          <el-button 
            text 
            size="small" 
            type="primary"
            @click="toggleDeepComments"
          >
            {{ showDeepComments ? '收起回复' : `查看 ${replies.length} 条回复` }}
          </el-button>
        </div>
        
        <!-- 展开后显示回复 -->
        <template v-if="showDeepComments">
          <CommentItem
            v-for="child in replies"
            :key="child.id"
            :comment="child"
            :level="level + 1"
            :children="[]"
            :userId="userId"
            :videoOwnerId="videoOwnerId"
            @reply="handleChildReply"
            @delete="handleChildDelete"
          />
        </template>
      </template>
      
      <!-- 正常显示前2层回复 -->
      <template v-else>
        <CommentItem
          v-for="child in replies"
          :key="child.id"
          :comment="child"
          :level="level + 1"
          :children="[]"
          :userId="userId"
          :videoOwnerId="videoOwnerId"
          @reply="handleChildReply"
          @delete="handleChildDelete"
        />
      </template>
    </div>
    <div v-if="showReplies && replies.length === 0 && !repliesLoading" class="no-replies">
      暂无回复
    </div>
    <div v-if="showReplies && repliesLoading" class="replies-loading">
      <el-skeleton :rows="2" animated />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommentItem from './CommentItem.vue'
import { getCommentReplies, likeComment, dislikeComment, addComment } from '@/api/video'
import { eventBus } from '@/utils/eventBus'

const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
function resolveUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  // 处理Windows路径中的反斜杠
  const normalizedPath = path.replace(/\\/g, '/')
  return `${baseUrl}/${normalizedPath.replace(/^\/+/, '')}`
}

const props = defineProps({
  comment: Object,
  level: {
    type: Number,
    default: 0
  },
  children: {
    type: Array,
    default: () => []
  },
  userId: Number,
  videoOwnerId: Number
})

const emit = defineEmits(['like', 'dislike', 'reply', 'delete'])
const showReplies = ref(false)
const showReply = ref(false)
const replyText = ref('')
const replies = ref([])
const repliesLoading = ref(false)
const showDeepComments = ref(false)

const canDelete = computed(() => {
  return Number(props.userId) > 0 &&
    (props.userId === props.comment.user_id || props.userId === props.videoOwnerId)
})

// 处理点赞
const handleLike = async () => {
  try {
    const res = await likeComment(props.comment.id)
    if (res?.success && res.data) {
      // 直接更新当前评论的点赞数
      Object.assign(props.comment, {
        likes: res.data.like_count,
        dislikes: res.data.dislike_count
      })
    }
    ElMessage.success('操作成功')
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 处理踩
const handleDislike = async () => {
  try {
    const res = await dislikeComment(props.comment.id)
    if (res?.success && res.data) {
      // 直接更新当前评论的踩数
      Object.assign(props.comment, {
        likes: res.data.like_count,
        dislikes: res.data.dislike_count
      })
    }
    ElMessage.success('操作成功')
  } catch (error) {
    console.error('踩失败:', error)
    ElMessage.error('操作失败')
  }
}

const onDelete = () => {
  emit('delete', props.comment)
}

const showReplyInput = () => {
  showReply.value = true
  replyText.value = ''
}
const cancelReply = () => {
  showReply.value = false
  replyText.value = ''
}
const submitReply = async () => {
  if (!replyText.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  try {
    // 直接在当前组件中处理回复
    const res = await addComment(props.comment.video_id, {
      video_id: parseInt(props.comment.video_id),
      content: replyText.value,
      parent_id: props.comment.id
    })
    
    if (res?.success && res.data) {
      const newReply = mapReply(res.data)
      // 直接添加到本地replies数组
      replies.value.unshift(newReply)
      // 更新回复数
      props.comment.replyCount = (props.comment.replyCount || 0) + 1
      // 自动显示回复
      showReplies.value = true
    }
    
    showReply.value = false
    replyText.value = ''
    ElMessage.success('回复成功！')
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  }
}
const loadReplies = async () => {
  if (repliesLoading.value) return
  
  try {
    repliesLoading.value = true
    
    const res = await getCommentReplies(props.comment.video_id, {
      parent_id: props.comment.id,
      page: 1,
      size: 50
    })
    
    const mappedReplies = (res?.data?.items || []).map(mapReply)
    replies.value = mappedReplies
  } catch (error) {
    console.error('加载回复失败:', error)
    ElMessage.error('加载回复失败')
  } finally {
    repliesLoading.value = false
  }
}

const mapReply = (item) => {
  return {
    ...item,
    id: parseInt(item.id), // 确保ID是数字类型
    username: item.user?.username || '',
    avatar: resolveUrl(item.user?.profile_picture),
    user_id: item.user?.id || item.user_id,
    video_id: item.video_id || props.comment.video_id, // 优先使用item中的video_id
    time: new Date(item.created_at).toLocaleString(),
    likes: item.like_count || 0,
    dislikes: item.dislike_count || 0,
    replyCount: item.reply_count || 0, // 使用实际的回复数
    replies: [], // 用于存储回复列表
    children: []
  }
}

const handleReply = async (replyData) => {
  // 处理多级回复
  try {
    const res = await addComment(props.comment.video_id, {
      video_id: parseInt(props.comment.video_id),
      content: replyData.content,
      parent_id: replyData.parent.id
    })
    
    if (res?.success && res.data) {
      const newReply = mapReply(res.data)
      // 直接添加到本地replies数组
      replies.value.unshift(newReply)
      // 更新回复数
      props.comment.replyCount = (props.comment.replyCount || 0) + 1
      // 自动显示回复
      showReplies.value = true
    }
    
    ElMessage.success('回复成功！')
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  }
}

const handleChildDelete = (childComment) => {
  // 从本地replies中移除
  const index = replies.value.findIndex(reply => reply.id === childComment.id)
  if (index > -1) {
    replies.value.splice(index, 1)
    // 更新回复数
    props.comment.replyCount = Math.max(0, (props.comment.replyCount || 0) - 1)
  }
  
  // 将事件向上传递
  emit('delete', childComment)
}

const handleChildReply = async (replyData) => {
  // 处理子评论的回复
  try {
    const res = await addComment(props.comment.video_id, {
      video_id: parseInt(props.comment.video_id),
      content: replyData.content,
      parent_id: replyData.parent.id
    })
    
    if (res?.success && res.data) {
      const newReply = mapReply(res.data)
      // 找到对应的子评论并添加回复
      const targetChild = replies.value.find(child => child.id === replyData.parent.id)
      if (targetChild) {
        if (!targetChild.replies) {
          targetChild.replies = []
        }
        targetChild.replies.unshift(newReply)
        targetChild.replyCount = (targetChild.replyCount || 0) + 1
      }
    }
    
    ElMessage.success('回复成功！')
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  }
}

const toggleReplies = async () => {
  showReplies.value = !showReplies.value
  
  // 无论什么层级，只要显示回复且没有数据，就加载回复
  if (showReplies.value && replies.value.length === 0) {
    await loadReplies()
  }
}

const toggleDeepComments = () => {
  showDeepComments.value = !showDeepComments.value
}

const getCommentIndent = (level) => {
  // 设置最大缩进级别为2层，超过后不再缩进
  const maxIndentLevel = 2
  const indentPerLevel = 20
  
  if (level <= maxIndentLevel) {
    return level * indentPerLevel
  } else {
    // 超过最大级别，不再缩进，保持最大缩进距离
    return maxIndentLevel * indentPerLevel
  }
}

// 检查是否达到最大级别（用于样式判断）
const isMaxLevel = computed(() => {
  return props.level >= 2 // 2层为最大级别
})

// 检查是否应该折叠深层评论（超过2层）
const shouldCollapseDeepComments = computed(() => {
  return props.level >= 2 // 超过2层就折叠
})


</script>

<style scoped>
.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

/* 深层评论更紧凑 */
.children-comments .comment-item {
  padding: 12px 0;
}

.children-comments .children-comments .comment-item {
  padding: 8px 0;
}

/* 深层嵌套评论样式 - YouTube风格 */
.deep-nested {
  position: relative;
  background: #fafafa;
  border-radius: 4px;
  padding: 8px;
  margin: 4px 0;
}

.deep-nested::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 16px;
  width: 2px;
  height: calc(100% - 16px);
  background: #e4e7ed;
}

/* 最大级别评论样式 - 对齐连接线 */
.max-level {
  position: relative;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
  margin: 4px 0;
  border-left: 3px solid #e4e7ed; /* 灰色连接线 */
}

/* 最大级别评论的左侧连接线 */
.max-level::before {
  content: '';
  position: absolute;
  left: -20px; /* 对齐到父级的连接线位置 */
  top: 0;
  width: 2px;
  height: 100%;
  background: #e4e7ed; /* 灰色连接线 */
}

/* 最大级别评论的回复区域 */
.max-level .children-comments {
  margin-left: 0;
  padding-left: 16px;
  border-left: 2px solid #e4e7ed; /* 灰色连接线 */
  background: #fafafa;
  border-radius: 4px;
  padding: 8px;
}

/* 深层评论的连接线样式 */
.deep-nested::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 16px;
  width: 2px;
  height: calc(100% - 16px);
  background: #e4e7ed; /* 统一使用灰色连接线 */
}

/* 限制最大宽度，防止溢出 */
.comment-item {
  max-width: calc(100% - 20px);
  overflow: hidden;
  min-width: 0; /* 允许flex子项收缩 */
}

/* 深层评论内容自适应 */
.deep-nested .comment-content {
  max-width: calc(100% - 40px);
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

/* 深层评论折叠样式 - 灰色连接线 */
.deep-comments-collapsed {
  padding: 8px 12px;
  text-align: left;
  background: transparent;
  border-radius: 4px;
  margin: 4px 0;
  border-left: 2px solid #e4e7ed; /* 灰色连接线 */
  padding-left: 16px;
}

/* 回复头部样式优化 */
.replies-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-item {
    margin-left: 0 !important;
    padding-left: 16px;
  }
  
  .deep-nested {
    margin-left: 0 !important;
    padding-left: 24px;
  }
  
  .children-comments {
    margin-left: 8px !important;
    padding-left: 8px !important;
  }
}

@media (max-width: 480px) {
  .comment-item {
    padding-left: 8px;
    margin-left: 0 !important;
  }
  
  .deep-nested {
    padding-left: 16px;
    margin-left: 0 !important;
  }
  
  .children-comments {
    margin-left: 4px !important;
    padding-left: 4px !important;
  }
  
  /* 移动端强制折叠深层评论 */
  .comment-item[style*="margin-left: 48px"],
  .comment-item[style*="margin-left: 64px"] {
    margin-left: 0 !important;
    padding-left: 16px !important;
  }
  
  /* 移动端最大级别评论样式 */
  .max-level {
    margin-left: 0 !important;
    padding-left: 16px !important;
    border-left: 2px solid #e4e7ed !important; /* 保持灰色连接线 */
  }
  
  .comment-actions-inline {
    gap: 6px;
  }
  
  .comment-actions-inline .el-button {
    font-size: 10px;
    padding: 1px 4px;
  }
}
.comment-main {
  display: flex;
  gap: 12px;
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
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

/* 深层评论操作按钮优化 - YouTube风格 */
.deep-nested .comment-actions-inline {
  gap: 8px;
}

.deep-nested .comment-actions-inline .el-button {
  font-size: 12px;
  padding: 2px 8px;
  color: #666;
}

.deep-nested .comment-actions-inline .el-button:hover {
  color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
}

/* 最大级别评论操作按钮优化 */
.max-level .comment-actions-inline {
  gap: 8px;
}

.max-level .comment-actions-inline .el-button {
  font-size: 12px;
  padding: 2px 8px;
  color: #666;
  background: rgba(228, 231, 237, 0.3); /* 灰色主题 */
}

.max-level .comment-actions-inline .el-button:hover {
  color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
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
.children-comments {
  margin-top: 8px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 2px solid #e4e7ed; /* 灰色连接线 */
  background-color: #fafafa;
  border-radius: 4px;
  padding: 8px;
  max-width: calc(100% - 24px);
  overflow: hidden;
}

/* 深层评论更紧凑，保持灰色连接线 */
.children-comments .children-comments {
  margin-left: 8px;
  padding-left: 8px;
  padding: 6px;
  max-width: calc(100% - 16px);
  background-color: #f8f9fa;
  border-left: 2px solid #e4e7ed; /* 灰色连接线 */
}

.replies-header {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.replies-count {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.no-replies {
  color: #999;
  text-align: center;
  padding: 16px 0;
  font-size: 12px;
}

.replies-loading {
  padding: 16px 0;
}
</style> 