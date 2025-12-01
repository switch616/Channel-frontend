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
        class="refresh-btn"
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
        <VideoCard :video="video" @delete="handleDelete(video.id)" />
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
        class="load-more-btn"
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

<script setup>
import { ref } from 'vue'
import VideoCard from './VideoCard.vue'
import { deleteLike, deleteCollection, deleteHistory } from '@/api/video'
import { Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  videos: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  finished: {
    type: Boolean,
    default: false,
  },
  showLoadMore: {
    type: Boolean,
    default: true,
  },
  showRefresh: {
    type: Boolean,
    default: false,
  },
  tabType: {
    type: String,
    default: 'videos', // 新增tabType，父组件传递
  },
})

const emit = defineEmits(['load-more','refresh'])

const handleLoadMore = () => {
  if (!props.loading && !props.finished) {
    emit('load-more')
  }
}

const handleRefresh = () => {
  if (!props.loading) {
    emit('refresh')
  }
}

const handleDelete = async (id) => {
  let res
  if (props.tabType === 'likes') {
    res = await deleteLike(id)
  } else if (props.tabType === 'favorites') {
    res = await deleteCollection(id)
  } else if (props.tabType === 'history') {
    res = await deleteHistory(id)
  } else {
    return
  }
  // 统一响应结构：成功时 success=true
  if (res && res.success) {
    emit('refresh')
  }
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
