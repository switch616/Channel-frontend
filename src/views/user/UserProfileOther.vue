<template>
  <div class="profile-page">
    <UserHeaderOther
      v-if="user"
      :user="user"
      :isFollowed="isFollowed"
      :isMutual="isMutual"
      :isFollower="isFollower"
      @follow="handleFollow"
      @unfollow="handleUnfollow"
      @refresh="handleRefresh"
    />

    <UserTabsOther v-model="activeTab">
      <template #videos>
        <VideoGrid
          :videos="videoList"
          :loading="loading"
          :finished="finished"
          :showRefresh="true"
          @load-more="loadVideos"
          @refresh="refreshVideos"
        />
      </template>

      <template #likes>
        <div class="empty-state">
          <el-empty description="暂不支持查看其他用户的点赞内容" />
        </div>
      </template>

      <template #favorites>
        <div class="empty-state">
          <el-empty description="暂不支持查看其他用户的收藏内容" />
        </div>
      </template>
    </UserTabsOther>

    <el-backtop :right="40" :bottom="40" :visibility-height="300" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserVideos, getUserProfile } from '@/api/video'
import { followUser } from '@/api/user'
import UserHeaderOther from '@/components/user/UserHeaderOther.vue'
import UserTabsOther from '@/components/user/UserTabsOther.vue'
import VideoGrid from '@/components/video/VideoGrid.vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const route = useRoute()

/** 路由中的 userId，统一转 number */
const userId = Number(
  Array.isArray(route.params.userId)
    ? route.params.userId[0]
    : route.params.userId
)

/** 用户资料类型（接口层 + UI 够用即可） */
interface UserProfile {
  id?: number
  username?: string
  profile_picture?: string
  is_followed?: boolean
  is_mutual?: boolean
  is_follower?: boolean
}

const user = ref<UserProfile | null>(null)

const isFollowed = ref(false)
const isMutual = ref(false)
const isFollower = ref(false)
const loadingProfile = ref(false)

/** Tab 类型 */
type TabName = 'videos' | 'likes' | 'favorites' | 'history'
const activeTab = ref<TabName>('videos')

/** 视频列表项 */
interface VideoItem {
  id: number
  cover_image: string
  title: string
  user: string
  duration: number
  like_count: number
  uploadTime: string
}

const videoList = ref<VideoItem[]>([])

const page = ref(1)
const pageSize = 8
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

/** 加载视频 */
const loadVideos = async () => {
  if (loading.value || finished.value) return
  loading.value = true

  try {
    const res = await getUserVideos(userId, { page: page.value, size: pageSize })
    if (!res?.success) return

    const data = res.data || {}
    const items = data.items || data || []

    const mappedVideos: VideoItem[] = items.map((item: any) => {
      const cover = (item.cover_image || '').replace(/\\/g, '/')
      return {
        id: item.id,
        cover_image: /^https?:\/\//.test(cover)
          ? cover
          : `${baseUrl}${cover.replace(/^\/+/, '')}`,
        title: item.title,
        user: item.uploader_username || item.user || '',
        duration: item.duration,
        like_count: item.like_count || 0,
        uploadTime: new Date(item.created_at ?? Date.now()).toLocaleString(),
      }
    })

    videoList.value.push(...mappedVideos)
    total.value = data.total || mappedVideos.length

    if (videoList.value.length >= total.value) {
      finished.value = true
    } else {
      page.value++
    }
  } catch (err: any) {
    console.error('加载视频失败:', err.message)
  } finally {
    loading.value = false
  }
}

/** 刷新视频 */
const refreshVideos = async () => {
  videoList.value = []
  page.value = 1
  finished.value = false
  await loadVideos()
}

/** 刷新用户资料 */
const handleRefresh = async () => {
  await fetchProfile()
}

/** 获取用户资料 */
const fetchProfile = async () => {
  loadingProfile.value = true
  try {
    const res = await getUserProfile(userId)
    if (!res?.success) {
      throw new Error(res?.msg || '获取用户资料失败')
    }

    user.value = res.data || null
    isFollowed.value = !!res.data?.is_followed
    isMutual.value = !!res.data?.is_mutual
    isFollower.value = !!res.data?.is_follower
  } catch (error) {
    console.error('获取用户资料失败:', error)
    user.value = null
    isFollowed.value = false
    isMutual.value = false
    isFollower.value = false
  } finally {
    loadingProfile.value = false
  }
}

/** 关注 */
const handleFollow = async () => {
  try {
    const res = await followUser(userId)
    if (!res?.success) throw new Error(res?.msg || '关注失败')

    if (res.data) {
      isFollowed.value = !!res.data.is_followed
      isMutual.value = !!res.data.is_mutual
      isFollower.value = !!res.data.is_follower

      if (isMutual.value) ElMessage.success('互相关注成功！')
      else if (isFollowed.value) ElMessage.success('关注成功！')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('关注失败')
  }
}

/** 取消关注 */
const handleUnfollow = async () => {
  if (!user.value) return

  try {
    await ElMessageBox.confirm(
      `确定要取消关注 ${user.value.username ?? ''} 吗？`,
      '取消关注',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '再想想',
        type: 'warning',
      }
    )

    const res = await followUser(userId)
    if (!res?.success) throw new Error(res?.msg || '取消关注失败')

    if (res.data) {
      isFollowed.value = !!res.data.is_followed
      isMutual.value = !!res.data.is_mutual
      isFollower.value = !!res.data.is_follower
      ElMessage.success('已取消关注')
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('取消关注失败')
    }
  }
}

/** Tab 切换 */
watch(activeTab, async (val) => {
  if (val === 'videos') {
    videoList.value = []
    page.value = 1
    finished.value = false
    await loadVideos()
  }
})

onMounted(async () => {
  await fetchProfile()
  await loadVideos()
})
</script>

<style scoped>
.profile-page {
  padding-bottom: 40px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>
