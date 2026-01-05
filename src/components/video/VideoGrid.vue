<template>
  <div class="video-grid-wrapper">
    <!-- 刷新按钮 -->
    <div v-if="showRefresh" class="refresh-wrapper">
      <el-button
        :loading="loading"
        type="primary"
        plain
        size="small"
        @click="handleRefresh"
      >
        <el-icon><Refresh /></el-icon>
        {{ loading ? '刷新中...' : '刷新' }}
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col
        v-for="video in videos"
        :key="video.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <VideoCard
          :video="video"
          :showDelete="showDelete"
          @deleted="emitRefresh"
        />
      </el-col>
    </el-row>

    <!-- 加载更多 -->
    <div v-if="showLoadMore" class="load-more-wrapper">
      <el-button
        v-if="!finished"
        :loading="loading"
        type="primary"
        plain
        size="large"
        @click="handleLoadMore"
      >
        {{ loading ? '加载中...' : '加载更多' }}
      </el-button>
      <div v-else class="no-more">
        <el-divider>没有更多了</el-divider>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="videos.length === 0 && !loading" class="empty-state">
      <el-empty description="暂无视频" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import VideoCard from './VideoCard.vue'
import { Refresh } from '@element-plus/icons-vue'

/** 与 VideoCard 严格对齐 */
export interface VideoItem {
  id: number
  cover_image: string
  title: string
  user: string
  duration: number
  like_count: number
  uploadTime: string
}

const props = defineProps({
  videos: {
    type: Array as PropType<VideoItem[]>,
    required: true,
  },
  loading: Boolean,
  finished: Boolean,
  showLoadMore: {
    type: Boolean,
    default: false,
  },
  showRefresh: Boolean,

  /** 是否是“我的主页” */
  showDelete: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'load-more'): void
  (e: 'refresh'): void
}>()

const handleLoadMore = () => {
  if (!props.loading && !props.finished) {
    emit('load-more')
  }
}

const handleRefresh = () => {
  emit('refresh')
}

const emitRefresh = () => {
  emit('refresh')
}
</script>


<style scoped>
.video-grid-wrapper {
  max-height: none;
  overflow-y: visible;
  padding-right: 0;
}

.refresh-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.refresh-btn {
  border-radius: 20px;
  font-size: 12px;
  padding: 8px 16px;
}

.load-more-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  padding: 20px 0;
}

.load-more-btn {
  min-width: 120px;
  height: 40px;
  border-radius: 20px;
  font-size: 14px;
}

.no-more {
  width: 100%;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>
