<template>
  <div class="video-feed-container">
    <!-- 视频流（上下滑动） -->
    <div class="video-list" ref="scrollRef">
      <div
        class="video-item"
        v-for="(video, index) in videos"
        :key="index"
      >
        <!-- 视频组件 -->
        <video
          class="video-player"
          :src="video.src"
          autoplay
          muted
          loop
          playsinline
        ></video>

        <!-- 视频遮罩信息 -->
        <div class="video-overlay">
          <div class="video-info">
            <h3>@{{ video.username }}</h3>
            <p>{{ video.description }}</p>
          </div>

          <!-- 右侧交互栏 -->
          <div class="action-buttons">
            <el-icon><i class="el-icon-star-on" /></el-icon>
            <span>{{ video.likes }}</span>

            <el-icon><i class="el-icon-chat-line-round" /></el-icon>
            <span>{{ video.comments }}</span>

            <el-icon><i class="el-icon-share" /></el-icon>
            <span>分享</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <div class="bottom-nav">
      <el-icon><i class="el-icon-house" /></el-icon>
      <el-icon><i class="el-icon-search" /></el-icon>
      <el-icon><i class="el-icon-plus" /></el-icon>
      <el-icon><i class="el-icon-message" /></el-icon>
      <el-icon><i class="el-icon-user" /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 示例视频数据
const videos = ref([
  {
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    username: '张三',
    description: '分享我的旅行日常～',
    likes: 120,
    comments: 15,
  },
  {
    src: 'https://www.w3schools.com/html/movie.mp4',
    username: '李四',
    description: '今日穿搭分享 🎒',
    likes: 200,
    comments: 33,
  },
])
</script>

<style scoped>
.video-feed-container {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.video-list {
  height: 100%;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
}

.video-item {
  height: 100vh;
  scroll-snap-align: start;
  position: relative;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  color: #fff;
  padding: 20px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.video-info {
  max-width: 70%;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.action-buttons i {
  font-size: 28px;
  color: #fff;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 10;
}

.bottom-nav i {
  font-size: 24px;
  color: #fff;
}
</style>
