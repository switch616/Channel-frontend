import { ref, nextTick } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getVideoComments,
  addComment,
  likeComment as likeCommentAPI,
  dislikeComment as dislikeCommentAPI,
  deleteComment
} from '@/api/video'
import type { Comment } from '@/types/models/comment'
import { resolveUrl } from '@/utils/url'

export function useComments(videoId: number | string) {
  const comments = ref<Comment[]>([])
  const commentPage = ref(1)
  const commentSize = ref(20)
  const commentTotal = ref(0)
  const commentOrder = ref<'latest' | 'hottest'>('latest')
  const commentLoading = ref(false)
  const hasMoreComments = ref(true)

  const mapComment = (item: any): Comment => {
    const user = item.user || {}
    return {
      ...item,
      id: Number(item.id),
      user_id: user.id || item.user_id,
      video_id: Number(videoId),
      user: {
        ...user,
        username: user.username || item.username || '',
        profile_picture: resolveUrl(user.profile_picture || item.avatar || '')
      },
      // 兼容旧组件字段
      username: user.username || item.username || '',
      avatar: resolveUrl(user.profile_picture || item.avatar || ''),
      created_at: item.created_at,
      like_count: item.like_count || 0,
      dislike_count: item.dislike_count || 0,
      reply_count: item.reply_count || 0,
      likes: item.like_count || 0,
      dislikes: item.dislike_count || 0,
      replyCount: item.reply_count || 0,
      replies: item.replies || [],
      children: item.children || [],
      time: dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss') || ''
    }
  }

  const loadComments = async (reset = false) => {
    if (commentLoading.value) return
    try {
      commentLoading.value = true
      if (reset) {
        commentPage.value = 1
        comments.value = []
      }
      const res = await getVideoComments(Number(videoId), {
        page: commentPage.value,
        size: commentSize.value,
        order: commentOrder.value
      })
      const newComments = (res.data?.items || []).map(mapComment)
      comments.value = reset ? newComments : comments.value.concat(newComments)
      commentTotal.value = res.data?.total || 0
      hasMoreComments.value = comments.value.length < commentTotal.value
      if (!reset) commentPage.value++
    } catch (error) {
      console.error('加载评论失败:', error)
      ElMessage.error('加载评论失败')
    } finally {
      commentLoading.value = false
    }
  }

  const loadMoreComments = async () => {
    if (hasMoreComments.value && !commentLoading.value) await loadComments()
  }

  const changeCommentOrder = async (order: 'latest' | 'hottest') => {
    commentOrder.value = order
    await loadComments(true)
  }

  const submitComment = async (content: string, parentId: number | null = null) => {
    if (!content.trim()) {
      ElMessage.warning('请输入评论内容')
      return false
    }
    try {
      const res = await addComment(Number(videoId), { content, parent_id: parentId })
      let success = false
      if (res.data) {
        const newComment = mapComment(res.data)
        if (parentId) {
          const parent = findCommentById(comments.value, parentId)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.unshift(newComment)
            parent.reply_count = (parent.reply_count || 0) + 1
          }
        } else {
          comments.value.unshift(newComment)
        }
        commentTotal.value++
        success = true
      }
      ElMessage.success(parentId ? '回复成功！' : '评论成功！')
      return success
    } catch (error) {
      console.error('发表评论失败:', error)
      ElMessage.error('评论失败')
      return false
    }
  }

  const findCommentById = (commentList: Comment[], commentId: number | string): Comment | null => {
    for (const comment of commentList) {
      if (comment.id == commentId) return comment
      if (comment.replies?.length) {
        const found = findCommentById(comment.replies as Comment[], commentId)
        if (found) return found
      }
      if (comment.children?.length) {
        const found = findCommentById(comment.children as Comment[], commentId)
        if (found) return found
      }
    }
    return null
  }

  const removeCommentById = (commentList: Comment[], commentId: number | string): boolean => {
    for (let i = 0; i < commentList.length; i++) {
      if (commentList[i].id == commentId) {
        commentList.splice(i, 1)
        return true
      }
      if (commentList[i].replies?.length && removeCommentById(commentList[i].replies as Comment[], commentId)) {
        return true
      }
    }
    return false
  }

  const handleLikeComment = async (comment: Comment) => {
    try {
      const res = await likeCommentAPI(comment.id)
      if (res.data && res.data.success) {
        const target = findCommentById(comments.value, comment.id)
        if (target) {
          Object.assign(target, {
            like_count: res.data.like_count,
            dislike_count: res.data.dislike_count
          })
          await nextTick()
        }
      }
      ElMessage.success('点赞成功！')
    } catch (error) {
      console.error('评论点赞失败:', error)
      ElMessage.error('操作失败')
    }
  }

  const handleDislikeComment = async (comment: Comment) => {
    try {
      const res = await dislikeCommentAPI(comment.id)
      if (res.data && res.data.success) {
        const target = findCommentById(comments.value, comment.id)
        if (target) {
          Object.assign(target, {
            like_count: res.data.like_count,
            dislike_count: res.data.dislike_count
          })
          await nextTick()
        }
      }
      ElMessage.success('踩成功！')
    } catch (error) {
      console.error('评论踩失败:', error)
      ElMessage.error('操作失败')
    }
  }

  const handleDeleteComment = async (comment: Comment) => {
    try {
      await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await deleteComment(comment.id)
      removeCommentById(comments.value, comment.id)
      commentTotal.value = Math.max(0, commentTotal.value - 1)
      ElMessage.success('删除成功！')
    } catch (error) {
      console.error('删除评论失败:', error)
      if (error !== 'cancel') ElMessage.error('删除失败')
    }
  }

  return {
    comments,
    commentOrder,
    commentLoading,
    hasMoreComments,
    commentTotal,
    loadComments,
    loadMoreComments,
    changeCommentOrder,
    submitComment,
    handleLikeComment,
    handleDislikeComment,
    handleDeleteComment
  }
}

