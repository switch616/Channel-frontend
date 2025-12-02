<template>
  <div class="user-header">
    <el-row align="middle">
      <el-col :xs="24" :sm="6" class="avatar-col">
        <el-avatar :size="80" :src="avatarUrl" />
      </el-col>
      <el-col :xs="24" :sm="18">
        <div class="user-info">
          <div class="name-container">
            <h2 class="username">{{ user!.username }}</h2>
            <!-- 性别显示 -->
            <span v-if="user!.gender" class="gender-icon" :class="user!.gender">
              {{ user!.gender === 'male' ? '♂' : user!.gender === 'female' ? '♀' : '⚪' }}
            </span>
          </div>
          <div class="unique-id-container">
            <span class="unique-id-label">ID:</span>
            <span class="unique-id-value copyable" @click="copyUniqueId">{{ user!.unique_id }}</span>
            <el-tooltip content="这是用户唯一标识ID" placement="top">
              <el-icon class="info-icon">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <p class="bio" v-if="user!.bio">{{ user!.bio }}</p>
          <div class="stats">
            <span>作品 {{ user!.video_count || 0 }}</span>
            <span>关注 {{ user!.following_count || 0 }}</span>
            <span class="fans-stat">
              粉丝 {{ user!.follower_count || 0 }}
              <el-button 
                type="text" 
                size="small" 
                class="refresh-stats-btn"
                @click="$emit('refresh')"
              >
                <el-icon><Refresh /></el-icon>
              </el-button>
            </span>
          </div>
          <div class="actions">
            <!-- 互相关注状态 -->
            <div v-if="isMutual" class="follow-status-container">
              <el-tag size="small" type="success" class="status-tag">互相关注</el-tag>
              <el-button 
                size="small"
                type="danger" 
                @click="$emit('unfollow')"
                class="unfollow-btn"
              >
                取消关注
              </el-button>
            </div>
            <!-- 已关注状态 -->
            <div v-else-if="isFollowed" class="follow-status-container">
              <el-tag size="small" type="info" class="status-tag">已关注</el-tag>
              <el-button 
                size="small"
                type="danger" 
                @click="$emit('unfollow')"
                class="unfollow-btn"
              >
                取消关注
              </el-button>
            </div>
            <!-- 回关状态（对方关注了我，但我没有关注对方） -->
            <div v-else-if="isFollower" class="follow-status-container">
              <el-tag size="small" type="warning" class="status-tag">粉丝</el-tag>
              <el-button 
                size="small"
                type="primary" 
                @click="$emit('follow')"
                class="follow-btn"
              >
                回关
              </el-button>
            </div>
            <!-- 关注按钮（未关注状态） -->
            <el-button 
              v-else
              type="primary" 
              size="small"
              @click="$emit('follow')"
              class="follow-btn"
            >
              关注
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { InfoFilled, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
const props = defineProps({
  user: Object,
  isFollowed: Boolean,
  isMutual: Boolean,
  isFollower: Boolean, // 对方是否关注了我
})
const emit = defineEmits(['follow', 'unfollow', 'refresh'])
const baseUrl = import.meta.env.VITE_API_BASE_URL
const avatarUrl = computed(() => {
  const path = props.user?.profile_picture || 'media/avatars/default.png'
  return /^https?:\/\//.test(path) ? path : `${baseUrl}${path.replace(/^\/+/, '')}`
})

// 复制功能
const copyUniqueId = () => {
  navigator.clipboard.writeText(props.user!.unique_id)
  ElMessage.success('ID已复制')
}

</script>

<style scoped>
.user-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.avatar-col {
  display: flex;
  justify-content: center;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 新增的姓名容器样式 */
.name-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

/* 修改后的性别图标样式 */
.gender-icon {
  font-size: 20px;
  /* 增大图标尺寸 */
  font-weight: bold;
  /* 加粗图标 */
  margin-left: 4px;
  /* 与用户名间距 */
}

.gender-icon.male {
  color: #409EFF;
  /* 蓝色 - 男 */
}

.gender-icon.female {
  color: #F56C6C;
  /* 粉色 - 女 */
}

.gender-icon.other,
.gender-icon.unknown {
  color: #909399;
  /* 灰色 - 其他/未知 */
}

.bio {
  color: #666;
  font-size: 14px;
  margin: 4px 0;
}

.stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #999;
  margin: 8px 0;
}

.stats span {
  cursor: pointer;
  transition: color 0.2s;
}

.stats span:hover {
  color: #333;
}

.fans-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.refresh-stats-btn {
  padding: 2px;
  color: #999;
  transition: color 0.2s;
}

.refresh-stats-btn:hover {
  color: #409EFF;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.actions .el-button {
  padding: 6px 12px;
  font-size: 12px;
}

.follow-status-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  font-size: 12px;
  padding: 4px 8px;
}

.follow-btn {
  min-width: 60px;
}

.unfollow-btn {
  min-width: 70px;
  font-size: 11px;
  padding: 4px 8px;
}

.unique-id-container {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.unique-id-label {
  font-weight: 500;
}

.unique-id-value {
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  color: #333;
}

.info-icon {
  color: #909399;
  cursor: help;
  font-size: 14px;
}

.info-icon:hover {
  color: #409EFF;
}

.copyable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.copyable:hover {
  background-color: #e0e0e0;
}
</style> 