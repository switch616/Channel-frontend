<template>
  <div class="user-header" v-if="user">
    <el-row align="middle">
      <el-col :xs="24" :sm="6" class="avatar-col">
        <el-avatar :size="80" :src="avatarUrl" />
      </el-col>
      <el-col :xs="24" :sm="18">
        <div class="user-info">
          <div class="name-container">
            <h2 class="username">{{ user.username }}</h2>
            <el-icon v-if="user.gender" :class="['gender-icon', user.gender]">
              <component :is="genderIcon" />
            </el-icon>
          </div>
          <div class="unique-id-container">
            <span class="unique-id-label">ID:</span>
            <span class="unique-id-value copyable" @click="copyUniqueId">
              {{ user.unique_id }}
            </span>
            <el-tooltip content="这是用户唯一标识ID" placement="top">
              <el-icon class="info-icon">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <p class="bio" v-if="user.bio">{{ user.bio }}</p>
          <div class="stats">
            <span>作品 {{ user.video_count || 0 }}</span>
            <span @click="openFollowDialog('following')" style="cursor:pointer;">关注 {{ user.following_count || 0 }}</span>
            <span @click="openFollowDialog('fans')" style="cursor:pointer;">粉丝 {{ user.follower_count || 0 }}</span>
            <el-button 
              link
              size="small" 
              @click="refreshUserProfile"
              :loading="refreshing"
              style="margin-left: 8px; padding: 0;"
            >
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <div class="actions">
            <el-button type="primary" @click="openEditDialog">修改资料</el-button>
            <el-button type="success" @click="openVideoUpload">上传视频</el-button>
            <el-button type="warning" @click="openChangePwdDialog">修改密码</el-button>
          </div>
        </div>
      </el-col>
    </el-row>
    <!-- 弹窗组件始终渲染 -->
    <FollowListDialog
      :visible="showFollowDialog"
      :type="followDialogType"
      :userId="user?.id"
      @close="closeFollowDialog"
    />
    <ProfileEditDialog ref="profileEditRef" @success="handleProfileUpdate" />
    <VideoUploadDialog ref="videoUploadRef" @success="handleVideoUploadSuccess" />
    <ChangePasswordDialog ref="changePwdDialog" />
  </div>
</template>

<script setup lang="ts">
import {
  Male as MaleIcon,
  Female as FemaleIcon,
  HelpFilled as OtherGenderIcon,
  InfoFilled,
  Refresh
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import ProfileEditDialog from '@/components/user/ProfileEditDialog.vue'
import VideoUploadDialog from '@/components/video/VideoUploadDialog.vue'
import FollowListDialog from './FollowListDialog.vue'
import ChangePasswordDialog from './ChangePasswordDialog.vue'

// Store
const userStore = useUserStore()
const user = computed(() => userStore.user)

// 基础 URL
const baseUrl = import.meta.env.VITE_API_BASE_URL

// 组件引用
const profileEditRef = ref<InstanceType<typeof ProfileEditDialog> | null>(null)
const videoUploadRef = ref<InstanceType<typeof VideoUploadDialog> | null>(null)
const changePwdDialog = ref<{ visible: boolean } | null>(null)

const showFollowDialog = ref(false)
const followDialogType = ref<'following' | 'fans'>('following')
const refreshing = ref(false)

// 性别图标计算
const genderIcon = computed(() => {
  switch (user.value?.gender) {
    case 'male':
      return MaleIcon
    case 'female':
      return FemaleIcon
    default: // other/unknown
      return OtherGenderIcon
  }
})

// 用户头像（响应式）- 直接从store获取确保实时更新
const avatarUrl = computed(() => {
  const path = user.value?.profile_picture || 'media/avatars/default.png'
  const base = /^https?:\/\//.test(path) ? path : `${baseUrl}${path.replace(/^\/+/, '')}`
  return `${base}?t=${Date.now()}` // 添加时间戳防止缓存
})

// 打开编辑资料弹窗
const openEditDialog = () => {
  profileEditRef.value?.open()
}

// 处理资料更新成功
const handleProfileUpdate = () => {
  // 不需要额外处理，因为avatarUrl是计算属性会自动更新
}

// 打开视频上传
const openVideoUpload = () => {
  videoUploadRef.value?.open()
}

const props = defineProps<{
  user?: unknown
  readonly?: boolean
  showFollow?: boolean
  isFollowed?: boolean
}>()
const emit = defineEmits<{
  (e: 'follow'): void
  (e: 'video-upload-success'): void
}>()

// 视频上传成功处理
const handleVideoUploadSuccess = () => {
  // 更新用户视频数量
  if (userStore.user) {
    userStore.setUser({
      ...userStore.user,
      video_count: (userStore.user.video_count || 0) + 1
    })
  }
  emit('video-upload-success') // 通知父组件刷新视频列表
}

// 复制功能
const copyUniqueId = () => {
  if (!user.value) return
  navigator.clipboard.writeText(user.value.unique_id)
  ElMessage.success('ID已复制')
}

const openFollowDialog = (type: 'following' | 'fans') => {
  followDialogType.value = type
  showFollowDialog.value = true
}
const closeFollowDialog = () => {
  showFollowDialog.value = false
}

// 刷新用户资料 - 强制从数据库刷新
const refreshUserProfile = async () => {
  refreshing.value = true
  try {
    await userStore.forceRefreshUserProfile()
    ElMessage.success('资料已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const openChangePwdDialog = () => {
  changePwdDialog.value!.visible = true
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

.actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.actions .el-button {
  padding: 8px 16px;
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