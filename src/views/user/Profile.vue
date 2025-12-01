<template>
  <div class="profile-page">
    <UserHeader :user="userStore.user" />
    <UserTabs v-model="activeTab">
      <template #videos>
        <VideoGrid :videos="videoList" :loading="loading" :finished="finished" :showRefresh="true" @load-more="loadVideos" @refresh="refreshVideos" />
      </template>
      <template #likes>
        <VideoGrid :videos="videoList" :loading="loading" :finished="finished" :showRefresh="true" @load-more="loadVideos" tabType="likes" @refresh="refreshVideos" />
      </template>
      <template #favorites>
        <VideoGrid :videos="videoList" :loading="loading" :finished="finished" :showRefresh="true" @load-more="loadVideos" tabType="favorites" @refresh="refreshVideos" />
      </template>
      <template #history>
        <VideoGrid :videos="videoList" :loading="loading" :finished="finished" :showRefresh="true" @load-more="loadVideos" tabType="history" @refresh="refreshVideos" />
      </template>
    </UserTabs>
    
    <!-- 回到顶部按钮 -->
    <el-backtop 
      :right="40" 
      :bottom="40"
      :visibility-height="300"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getMyVideos, getMyLikeVideos, getMyFavoriteVideos, getWatchHistory } from '@/api/video'
import { useUserStore } from '@/stores/user'
import UserHeader from '@/components/user/UserHeader.vue'
import UserTabs from '@/components/user/UserTabs.vue'
import VideoGrid from '@/components/video/VideoGrid.vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const userStore = useUserStore()

const activeTab = ref('videos')
const videoList = ref([])
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
        uploadTime: new Date(item.created_at).toLocaleString(),
      }
    })
    videoList.value.push(...mappedVideos)
    total.value = data.total || (data.items ? data.items.length : mappedVideos.length)
    if (videoList.value.length >= total.value) {
      finished.value = true
    } else {
      page.value++
    }
  } catch (err) {
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
  try {
    await userStore.fetchUserProfile()
  } catch (error) {
    console.error('获取个人资料失败:', error)
  }
  await loadVideos()
})
</script>

<style scoped>
.profile-page {
  padding-bottom: 40px;
}
</style>