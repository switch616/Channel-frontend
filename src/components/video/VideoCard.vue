<template>
  <el-card class="video-card" shadow="hover">
    <!-- 封面区域 -->
    <div class="video-cover-wrapper" @click="handleCardClick">
      <img :src="video.cover_image" class="video-cover" />

      <div class="video-duration">
        {{ formatDuration(video.duration) }}
      </div>

      <div class="video-likes">
        <el-icon><Star /></el-icon>
        {{ video.like_count }}
      </div>

      <el-dropdown
        v-if="showDelete"
        trigger="hover"
        placement="bottom-end"
        @command="handleCommand"
      >
        <span class="more-btn" @click.stop>
          <el-icon><MoreFilled /></el-icon>
        </span>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="delete" class="danger">
              删除视频
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 信息区域 -->
    <div class="video-meta">
      <h3 class="video-title">{{ video.title }}</h3>
      <div class="video-info">
        <span class="video-user">{{ video.user }}</span>
        <span class="video-time">{{ video.uploadTime }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Star, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { deleteVideo } from '@/api/video'
import { getToken } from '@/utils/auth'

const props = defineProps<{
  video: {
    id: number
    cover_image: string
    title: string
    user: string
    duration: number
    like_count: number
    uploadTime: string
  }
  /** 是否显示删除（仅个人主页传 true） */
  showDelete?: boolean
}>()

const emit = defineEmits<{
  (e: 'deleted'): void
}>()

const router = useRouter()

/** 点击卡片跳转 */
const handleCardClick = () => {
  const token = getToken()
  if (!token) {
    router.push({ name: 'Login' })
  } else {
    router.push({ name: 'VideoDetail', params: { id: props.video.id } })
  }
}

/** dropdown 操作 */
const handleCommand = async (command: string) => {
  if (command === 'delete') {
    await confirmDelete()
  }
}

/** 删除确认 */
const confirmDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该视频吗？删除后不可恢复',
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      }
    )

    const res = await deleteVideo(props.video.id)
    if (res?.success) {
      ElMessage.success('删除成功')
      emit('deleted')
    } else {
      throw new Error(res?.msg)
    }
  } catch (e) {
    // 用户取消不提示
  }
}

/** 时长格式化 */
const formatDuration = (seconds: number) => {
  if (!seconds) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.video-card {
  cursor: pointer;
  transition: transform 0.25s;
}
.video-card:hover {
  transform: translateY(-4px);
}

.video-cover-wrapper {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0,0,0,.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-likes {
  position: absolute;
  left: 8px;
  bottom: 8px;
  background: rgba(0,0,0,.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 🔥 核心：右下角 ... */
.more-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity .2s;
}

/* hover 才显示 */
.video-cover-wrapper:hover .more-btn {
  opacity: 1;
}

.video-meta {
  padding: 12px 0;
}

.video-title {
  font-size: 15px;
  margin-bottom: 6px;
  line-height: 1.4;
}

.video-info {
  font-size: 13px;
  color: #999;
  display: flex;
  gap: 8px;
}
</style>
