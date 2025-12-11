import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getVideoDetail, likeVideo, favoriteVideo } from '@/api/video'
import { followUser } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { eventBus, EVENTS } from '@/utils/eventBus'
import { resolveUrl } from '@/utils/url'
import type { VideoDetail, InteractionState } from '@/types'
import type { Author } from '@/types'

export function useVideoDetail(videoId: string | number) {
  const videoDetail = ref<VideoDetail | null>(null)
  const loading = ref(false)
  const router = useRouter()

  const interactionState = ref<InteractionState>({
    isLiked: false,
    isFavorited: false,
    isFollowed: false,
    isMutual: false,
    isFollower: false
  })

  const userStore = useUserStore()
  const currentUserId = computed(() => userStore.user?.id)

  const previewImg = computed(() => resolveUrl(videoDetail.value?.cover_image || videoDetail.value?.cover_url || ''))
  const videoSource = computed(() =>
    videoDetail.value
      ? {
          '720p': { url: resolveUrl(videoDetail.value.file_path || videoDetail.value.video_url || ''), label: '720P' }
        }
      : {}
  )
  const author = computed<Author>(() => {
    const u = videoDetail.value?.uploader || ({} as Author)
    return {
      ...u,
      profile_picture: resolveUrl(u?.profile_picture)
    }
  })
  const likeCount = computed(() => videoDetail.value?.like_count || 0)
  const favoriteCount = computed(() => videoDetail.value?.collect_count || 0)
  const commentCount = computed(() => videoDetail.value?.comment_count || 0)
  const isSelf = computed(() => currentUserId.value && videoDetail.value?.uploader && currentUserId.value === videoDetail.value.uploader.id)

  async function loadDetail() {
    loading.value = true
    try {
      const res = await getVideoDetail(Number(videoId))
      if (!res?.success) throw new Error(res?.msg || '获取视频详情失败')
      videoDetail.value = res.data
      interactionState.value = {
        isLiked: !!res.data.is_liked,
        isFavorited: !!res.data.is_collected,
        isFollowed: !!res.data?.uploader?.is_followed,
        isMutual: !!res.data?.uploader?.is_mutual,
        isFollower: !!res.data?.uploader?.is_follower
      }
    } finally {
      loading.value = false
    }
  }

  async function handleLike() {
    try {
      const res = await likeVideo(Number(videoId))
      if (!res?.success) throw new Error(res?.msg || '点赞失败')
      if (videoDetail.value && res.data) {
        videoDetail.value.like_count = res.data.like_count
        interactionState.value.isLiked = res.data.is_liked
      }
      ElMessage.success(interactionState.value.isLiked ? '点赞成功' : '取消点赞')
    } catch (error) {
      console.error('点赞失败:', error)
      ElMessage.error('操作失败')
    }
  }

  async function handleFavorite() {
    try {
      const res = await favoriteVideo(Number(videoId))
      if (!res?.success) throw new Error(res?.msg || '收藏失败')
      if (videoDetail.value && res.data) {
        videoDetail.value.collect_count = res.data.collect_count
        interactionState.value.isFavorited = res.data.is_collected
      }
      ElMessage.success(interactionState.value.isFavorited ? '收藏成功' : '取消收藏')
    } catch (error) {
      console.error('收藏失败:', error)
      ElMessage.error('操作失败')
    }
  }

  async function handleFollow() {
    if (!author.value?.id) return
    const isUnfollow = interactionState.value.isFollowed || interactionState.value.isMutual
    try {
      if (isUnfollow) {
        await ElMessageBox.confirm('确定要取消关注该用户吗？', '提示', {
          confirmButtonText: '取消关注',
          cancelButtonText: '再想想',
          type: 'warning'
        })
      }
      const res = await followUser(author.value.id)
      if (!res?.success) throw new Error(res?.msg || '关注操作失败')
      if (res.data) {
        interactionState.value.isFollowed = res.data.is_followed
        interactionState.value.isMutual = res.data.is_mutual
        interactionState.value.isFollower = res.data.is_follower
        userStore.updateFollowStats(res.data.following_count, res.data.follower_count)
        eventBus.emit(EVENTS.USER_FOLLOW_UPDATED, {
          action: res.data.is_followed ? 'follow' : 'unfollow',
          current_user_id: currentUserId.value,
          target_user_id: author.value.id,
          current_following_count: res.data.following_count,
          current_follower_count: res.data.follower_count,
          target_follower_count: res.data.follower_count
        })
      }
      if (res.data?.is_mutual) {
        ElMessage.success('互相关注成功！')
      } else if (res.data?.is_followed && res.data?.is_follower) {
        ElMessage.success('回关成功！')
      } else if (res.data?.is_followed) {
        ElMessage.success(isUnfollow ? '已取消关注' : '关注成功！')
      }
    } catch (error) {
      if (error !== 'cancel') ElMessage.error('操作失败')
    }
  }

  function goToUserProfile() {
    const myId = userStore.user?.id
    const authorId = videoDetail.value?.uploader?.id
    if (!authorId) return
    if (myId && authorId === myId) {
      router.push('/user/profile')
    } else {
      router.push(`/user/${authorId}`)
    }
  }

  return {
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
  }
}

