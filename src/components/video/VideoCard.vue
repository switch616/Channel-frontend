<template>
  <el-card class="video-card" shadow="hover" @click="handleCardClick">
    <div class="video-cover-wrapper">
      <img :src="video.cover_image" class="video-cover" />
      <div class="video-duration">{{ formatDuration(video.duration) }}</div>
      <div class="video-likes">
        <el-icon><Star /></el-icon>
        {{ video.like_count }}
      </div>
    </div>
    <div class="video-meta-row">
      <div class="video-meta">
        <h3 class="video-title">{{ video.title }}</h3>
        <div class="video-info">
          <span class="video-user">{{ video.user }}</span>
          <span class="video-time">{{ video.uploadTime }}</span>
        </div>
      </div>
      <!-- 删除按钮和下拉菜单已移除 -->
    </div>
    <!-- 删除弹窗已移除 -->
  </el-card>
</template>

<script setup lang="ts">
import { Star } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import { useRouter } from 'vue-router'

// 删除相关逻辑已移除

const props = defineProps({
  video: {
    type: Object,
    required: true,
    default: () => ({
      cover_image: '',
      title: '',
      user: '',
      duration: 0,
      like_count: 0,
      uploadTime: '',
    })
  },
  tabType: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const handleCardClick = () => {
  const token = getToken()
  if (!token) {
    router.push({ name: 'Login' })
  } else {
    router.push({ name: 'VideoPlay', params: { id: props.video.id } })
  }
}

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.video-card {
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-cover-wrapper {
  position: relative;
  width: 100%;
  height: 180px;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-likes {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.video-meta-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 8px;
}

.video-meta {
  padding: 12px 0 0 0;
}

.video-title {
  font-size: 16px;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #333;
}

.video-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #999;
}

.video-user {
  color: #666;
}

.video-time {
  color: #999;
}

.more-btn-wrapper {
  margin-left: 8px;
}
.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.3);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s;
}
.more-btn:hover {
  background: rgba(0,0,0,0.6);
}
</style>
