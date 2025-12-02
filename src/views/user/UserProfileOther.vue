<template>
  <div class="profile-page">
    <UserHeaderOther
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
    
    <!-- 回到顶部按钮 -->
    <el-backtop 
      :right="40" 
      :bottom="40"
      :visibility-height="300"
    />
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
const userId = route.params.userId
const user = ref({})
const isFollowed = ref(false)
const isMutual = ref(false)
const isFollower = ref(false)
const loadingProfile = ref(false)
const activeTab = ref('videos')
const videoList = ref([])
const page = ref(1)
const pageSize = 8
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

const loadVideos = async () => {
  if (loading.value || finished.value) return
  loading.value = true
  try {
    const res = await getUserVideos(userId, { page: page.value, size: pageSize })
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

const handleRefresh = async () => {
  await fetchProfile()
}

const fetchProfile = async () => {
  loadingProfile.value = true
  try {
    const res = await getUserProfile(userId)
    if (!res?.success) {
      throw new Error(res?.msg || '获取用户资料失败')
    }

    user.value = res.data || {}
    // 从用户资料响应中获取关注状态
    isFollowed.value = !!res.data?.is_followed
    isMutual.value = !!res.data?.is_mutual
    isFollower.value = !!res.data?.is_follower
  } catch (error) {
    console.error('获取用户资料失败:', error)
    user.value = {}
    isFollowed.value = false
    isMutual.value = false
    isFollower.value = false
  } finally {
    loadingProfile.value = false
  }
}

const handleFollow = async () => {
  try {
    const res = await followUser(userId)
    if (!res?.success) {
      throw new Error(res?.msg || '关注失败')
    }

    if (res.data) {
      isFollowed.value = !!res.data.is_followed
      isMutual.value = !!res.data.is_mutual
      isFollower.value = !!res.data.is_follower

      if (isMutual.value) {
        ElMessage.success('互相关注成功！')
      } else if (isFollowed.value && isFollower.value) {
        ElMessage.success('回关成功！')
      } else if (isFollowed.value) {
        ElMessage.success('关注成功！')
      }
    }
  } catch (e) {
    console.error('关注失败:', e)
    ElMessage.error('关注失败')
  }
}

const handleUnfollow = async () => {
  try {
    // 添加确认弹窗
    await ElMessageBox.confirm(
      `确定要取消关注 ${user.value.username} 吗？`, 
      '取消关注', 
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '再想想',
        type: 'warning',
      }
    )
    
    const res = await followUser(userId) // 使用同一个API，后端会根据当前状态切换
    if (!res?.success) {
      throw new Error(res?.msg || '取消关注失败')
    }

    if (res.data) {
      isFollowed.value = !!res.data.is_followed
      isMutual.value = !!res.data.is_mutual
      isFollower.value = !!res.data.is_follower
      ElMessage.success('已取消关注')
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('取消关注失败:', e)
      ElMessage.error('取消关注失败')
    }
  }
}

// 监听标签页切换
watch(activeTab, async () => {
  if (activeTab.value === 'videos') {
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