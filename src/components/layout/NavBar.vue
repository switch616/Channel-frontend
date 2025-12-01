<template>
  <el-header class="navbar">
    <div class="logo" @click="$router.push('/')">
      <img src="@/assets/logo.png" alt="logo" />
      <span class="title">{{ appTitle }}</span>
    </div>
    <div class="user-info">
      <el-avatar v-if="user" :src="avatarUrl" />
      <el-avatar v-else icon="el-icon-user-solid" />
      <el-dropdown v-if="user">
        <span class="el-dropdown-link">{{ user?.username || '未登录' }}<el-icon><arrow-down /></el-icon> </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goProfile" @mouseenter="handleProfileHover">个人中心</el-dropdown-item>
            <el-dropdown-item divided>系统设置</el-dropdown-item>
            <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span v-else style="color: #888; margin-left: 8px;">未登录</span>
    </div>
  </el-header>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { preloadUserProfile } from '@/utils/preload'

const appTitle = import.meta.env.VITE_APP_TITLE
const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')  // 去尾斜杠，防止拼接出错

const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.user)

// 头像完整路径计算
const avatarUrl = computed(() => {
  const avatarPath = user.value?.profile_picture || 'media/avatars/default.png'

  // 如果是完整 URL，直接返回
  if (/^https?:\/\//.test(avatarPath)) {
    return avatarPath
  }

  // 否则拼接 baseUrl + 头像路径
  return `${baseUrl}/${avatarPath.replace(/^\/+/, '')}`
})

const logout = () => {
  userStore.logout(router)
}

const goProfile = () => {
  router.push('/user/profile')
}

// 预加载用户资料
const handleProfileHover = () => {
  preloadUserProfile()
}


</script>


<style scoped>
.navbar {
  /* position: fixed; */
  /* top: 0; */
  /* left: 0; */
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 0 18px; /* 20*0.9 */
  box-shadow: 0 1.8px 7.2px rgba(0, 0, 0, 0.05); /* 2,8*0.9 */
  min-height: 57.6px; /* 64*0.9 */
}

.navbar-placeholder {
  height: 57.6px; /* 64*0.9 */
  width: 100%;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo img {
  height: 45px;
  margin-right: 10px;
}

.logo .title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
