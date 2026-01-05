<template>
  <div class="profile-page">
    <UserHeader :user="userStore.user" />
    <UserTabs v-model="activeTab">
      <template #videos>
        <VideoGrid :videos="videoList" :loading="loading" :finished="finished" :showRefresh="true" :showDelete="true"
          @load-more="loadVideos" @refresh="refreshVideos" />
      </template>
      <template #likes>
        <VideoGrid :videos="videoList" :loading="loading" :finished="finished" :showRefresh="true"
          @load-more="loadVideos" tabType="likes" @refresh="refreshVideos" />
      </template>
      <template #favorites>
        <VideoGrid :videos="videoList" :loading="loading" :finished="finished" :showRefresh="true"
          @load-more="loadVideos" tabType="favorites" @refresh="refreshVideos" />
      </template>
      <template #history>
        <VideoGrid :videos="videoList" :loading="loading" :finished="finished" :showRefresh="true"
          @load-more="loadVideos" tabType="history" @refresh="refreshVideos" />
      </template>
    </UserTabs>

    <!-- 回到顶部按钮 -->
    <el-backtop :right="40" :bottom="40" :visibility-height="300" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getMyVideos, getMyLikeVideos, getMyFavoriteVideos, getWatchHistory } from '@/api/video'
import { useUserStore } from '@/stores/user'
import UserHeader from '@/components/user/UserHeader.vue'
import UserTabs from '@/components/user/UserTabs.vue'
import VideoGrid from '@/components/video/VideoGrid.vue'
import { getToken } from '@/utils/auth'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const userStore = useUserStore()
const router = useRouter()

type TabName = 'videos' | 'likes' | 'favorites' | 'history'

const activeTab = ref<TabName>('videos')
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

const loadMap = {
  videos: getMyVideos,
  likes: getMyLikeVideos,
  favorites: getMyFavoriteVideos,
  history: getWatchHistory,
}

const loadVideos = async () => {
  if (loading.value || finished.value) return
  loading.value = true
  try {
    const api = loadMap[activeTab.value]
    const res = await api({ page: page.value, size: pageSize })

    if (!res?.success) {
      return
    }

    const data = res.data || {}
    const mappedVideos = (data.items || data || []).map(item => {
      let cover = (item.cover_image || '').replace(/\\/g, '/')
      return {
        id: item.id,
        cover_image: /^https?:\/\//.test(cover)
          ? cover
          : `${baseUrl}${cover.replace(/^\/+/, '')}`,
        title: item.title,
        user: item.uploader_username || item.user,
        duration: item.duration,
        like_count: item.like_count || 0,
        uploadTime: new Date(item.created_at ?? 0).toLocaleString(),
      }
    })
    videoList.value.push(...mappedVideos)
    total.value = data.total || (data.items ? data.items.length : mappedVideos.length)
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

const refreshVideos = async () => {
  videoList.value = []
  page.value = 1
  finished.value = false
  await loadVideos()
}

watch(activeTab, async () => {
  videoList.value = []
  page.value = 1
  finished.value = false
  await loadVideos()
})

onMounted(async () => {
  // 检查是否有 token，没有则重定向到登录页
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }

  try {
    await userStore.fetchUserProfile()
    // 如果获取用户资料后用户仍为 null，重定向到登录页
    if (!userStore.user) {
      router.push('/login')
      return
    }
  } catch (error) {
    console.error('获取个人资料失败:', error)
    // 获取失败时重定向到登录页
    router.push('/login')
    return
  }
  await loadVideos()
})
</script>

<style scoped>
.profile-page {
  padding-bottom: 40px;
}
</style>