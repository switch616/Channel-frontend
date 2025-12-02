<template>
  <div class="jingxuan-container">
    <div class="jingxuan-main-content">
      <div class="brand-intro">
        <h1>{{ appTitle }}</h1>
        <p>一个集成了短视频、聊天、互动的多功能内容社区</p>
      </div>

      <BannerCarousel :banners="bannerList" />

      <el-tabs v-model="activeTab" class="video-tabs">
        <el-tab-pane label="推荐" name="recommend">
          <RecommendVideos />
        </el-tab-pane>
        <el-tab-pane label="热门" name="hot">
          <HotVideos />
        </el-tab-pane>
        <el-tab-pane label="最新" name="latest">
          <LatestVideos />
        </el-tab-pane>
        <el-tab-pane label="关注" name="follow">
          <!-- <FollowVideos /> -->
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 回到顶部按钮 -->
    <el-backtop :right="40" :bottom="40" :visibility-height="300" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BannerCarousel from '@/components/common/BannerCarousel.vue'
import RecommendVideos from '@/components/video/RecommendVideos.vue'
import HotVideos from '@/components/video/HotVideos.vue'
import LatestVideos from '@/components/video/LatestVideos.vue'
import { getHotVideos } from '@/api/video'

const appTitle = import.meta.env.VITE_APP_TITLE
const activeTab = ref('recommend')

interface BannerItem {
  id: number
  image: string
}

const bannerList = ref<BannerItem[]>([])

const fetchHotBanners = async () => {
  try {
    const res = await getHotVideos({ page: 1, size: 3 })
    if (!res?.success) {
      return
    }
    const data = res.data || {}
    bannerList.value = (data.items || []).slice(0, 3).map(item => ({
      id: item.id,
      image: /^https?:\/\//.test(item.cover_image)
        ? item.cover_image
        : `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/${item.cover_image?.replace(/^\/+/, '') || ''}`
    }))
  } catch (e) {
    bannerList.value = []
  }
}

onMounted(fetchHotBanners)

</script>

<style scoped>
.jingxuan-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.jingxuan-main-content {
  max-width: 1200px;
  margin: auto;
  padding: 20px;
}

.brand-intro {
  text-align: center;
  margin-bottom: 20px;
}

.brand-intro h1 {
  font-size: 32px;
  font-weight: bold;
}

.brand-intro p {
  color: #666;
}

.video-tabs {
  margin-top: 30px;
  margin-bottom: 20px;
}

.pagination-box {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>
