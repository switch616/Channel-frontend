<template>
  <el-dialog :model-value="visible" :title="title" width="600px" @close="handleClose">
    <div class="search-bar">
      <el-input v-model="search" placeholder="搜索用户名或ID" size="small" clearable @keyup.enter="fetchList(true)" style="width: 100%" />
      <el-select v-if="showOrder" v-model="order" size="small" style="width: 120px; margin-left: 8px" @change="fetchList(true)">
        <el-option label="最近关注" value="desc" />
        <el-option label="最早关注" value="asc" />
      </el-select>
    </div>
    
    <div class="user-list" v-loading="loading" @scroll="handleScroll">
      <div v-if="list.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无数据" />
      </div>
      
      <div v-for="user in list" :key="user.id" class="user-item">
        <div class="user-avatar">
          <el-avatar :src="resolveUrl(user.profile_picture)" :size="50" />
        </div>
        <div class="user-info">
          <div class="user-name">
            <span class="username">{{ user.username }}</span>
            <span class="unique-id">({{ user.unique_id }})</span>
          </div>
          <div class="user-bio" v-if="user.bio">{{ user.bio }}</div>
          <div class="user-bio" v-else>
            <span class="placeholder-text">这个人很懒，还没有写简介</span>
          </div>
        </div>
        <div class="user-actions">
          <!-- 关注列表：显示关注状态和操作 -->
          <template v-if="type === 'following'">
            <!-- 互相关注状态 -->
            <div v-if="user.is_mutual && user.is_followed" class="mutual-badge">
              <el-tag size="small" type="success">互相关注</el-tag>
            </div>
            <!-- 已关注状态 -->
            <div v-else-if="user.is_followed" class="follow-status">
              <el-tag size="small" type="info">已关注</el-tag>
            </div>
            <!-- 关注按钮（取消关注后显示） -->
            <el-button 
              v-else
              size="small" 
              type="primary"
              @click="handleFollow(user)"
            >
              关注
            </el-button>
            <!-- 取消关注按钮（仅在已关注或互相关注时显示） -->
            <el-button 
              v-if="user.is_followed"
              size="small" 
              type="danger" 
              @click="handleUnfollow(user)"
              style="margin-left: 8px;"
            >
              取消关注
            </el-button>
          </template>
          
          <!-- 粉丝列表：显示关注状态和操作 -->
          <template v-else>
            <!-- 互相关注状态 -->
            <div v-if="user.is_mutual" class="mutual-badge">
              <el-tag size="small" type="success">互相关注</el-tag>
            </div>
            <!-- 回关按钮 -->
            <el-button 
              v-else
              size="small" 
              type="primary"
              @click="handleFollow(user)"
            >
              回关
            </el-button>
            <!-- 移除粉丝按钮（可选功能） -->
            <el-button 
              size="small" 
              type="danger" 
              @click="handleRemoveFan(user)"
              style="margin-left: 8px;"
            >
              移除粉丝
            </el-button>
          </template>
        </div>
      </div>
      
      <div v-if="loading && list.length > 0" class="loading-more">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      
      <div v-if="!hasMore && list.length > 0" class="no-more">
        <span>没有更多了</span>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { getFollowingList, getFansList, followUser, removeFollow, removeFan } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { eventBus, EVENTS } from '@/utils/eventBus'

const props = defineProps({
  visible: Boolean,
  type: { type: String, default: 'following' }, // following or fans
  userId: { type: Number, required: true },
})
const emit = defineEmits(['close'])

const userStore = useUserStore()
const title = computed(() => props.type === 'following' ? '关注列表' : '粉丝列表')
const showOrder = computed(() => props.type === 'following')

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const search = ref('')
const order = ref('desc')
const hasMore = ref(true)

const fetchList = async (reset = false) => {
  if (reset) {
    page.value = 1
    list.value = []
    hasMore.value = true
  }
  
  if (!hasMore.value || loading.value) return
  
  loading.value = true
  try {
    const api = props.type === 'following' ? getFollowingList : getFansList
    const params = {
      user_id: props.userId,
      page: page.value,
      size: pageSize,
      search: search.value,
      order: order.value,
    }
    const res = await api(params)
    console.log('API响应:', res)
    
    // 根据实际API响应结构调整数据访问路径
    let newItems = []
    let newTotal = 0
    
    if (res.data && res.data.data) {
      // 包装过的响应格式：{ code: 0, msg: "success", data: { total: 1, items: [...] } }
      newItems = res.data.data.items || []
      newTotal = res.data.data.total || 0
    } else {
      // 直接返回的数据格式：{ total: 1, items: [...] }
      newItems = res.data?.items || []
      newTotal = res.data?.total || 0
    }
    
    if (reset) {
      list.value = newItems
    } else {
      list.value.push(...newItems)
    }
    
    total.value = newTotal
    hasMore.value = list.value.length < total.value
    page.value++
    
    console.log('处理后的数据:', { list: list.value, total: total.value, hasMore: hasMore.value })
  } catch (e) {
    console.error('获取列表失败:', e)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 滚动加载更多
const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  // 滚动到底部时加载更多
  if (scrollHeight - scrollTop - clientHeight < 50 && !loading.value && hasMore.value) {
    fetchList()
  }
}

// 关注/取消关注（粉丝列表）
const handleFollow = async (user) => {
  try {
    const res = await followUser(user.id)
    if (res.data) {
      user.is_followed = res.data.is_followed
      user.is_mutual = res.data.is_followed // 关注后变为互相关注
      // 更新用户store中的统计数据
      userStore.updateFollowStats(res.data.following_count, res.data.follower_count)
      // 触发关注事件
      eventBus.emit(EVENTS.USER_FOLLOW_UPDATED, {
        action: 'follow',
        current_user_id: userStore.user.id,
        target_user_id: user.id,
        current_following_count: res.data.following_count,
        current_follower_count: res.data.follower_count,
        target_follower_count: res.data.follower_count
      })
      ElMessage.success('关注成功')
    }
  } catch (error) {
    ElMessage.error('关注失败')
  }
}

// 取消关注（关注列表）
const handleUnfollow = async (user) => {
  try {
    await ElMessageBox.confirm(`确定要取消关注 ${user.username} 吗？`, '取消关注', {
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想',
      type: 'warning',
    })
    
    const res = await followUser(user.id)
    if (res.data) {
      // 更新用户状态：取消关注
      user.is_followed = false
      user.is_mutual = false // 取消关注后不再是互相关注
      
      // 更新用户store中的统计数据
      userStore.updateFollowStats(res.data.following_count, res.data.follower_count)
      // 触发关注事件
      eventBus.emit(EVENTS.USER_FOLLOW_UPDATED, {
        action: 'unfollow',
        current_user_id: userStore.user.id,
        target_user_id: user.id,
        current_following_count: res.data.following_count,
        current_follower_count: res.data.follower_count,
        target_follower_count: res.data.follower_count
      })
      ElMessage.success('已取消关注')
    }
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败')
  }
}

// 移除粉丝（粉丝列表）
const handleRemoveFan = async (user) => {
  try {
    await ElMessageBox.confirm(`确定要移除粉丝 ${user.username} 吗？`, '移除粉丝', {
      confirmButtonText: '确定移除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    const res = await removeFan(user.id)
    if (res.data) {
      // 从列表中移除该用户
      const index = list.value.findIndex(item => item.id === user.id)
      if (index > -1) {
        list.value.splice(index, 1)
        total.value--
      }
      
      // 更新用户store中的统计数据
      userStore.updateFollowStats(res.data.following_count, res.data.follower_count)
      // 触发关注事件
      eventBus.emit(EVENTS.USER_FOLLOW_UPDATED, {
        action: 'remove_fan',
        current_user_id: userStore.user.id,
        target_user_id: user.id,
        current_following_count: res.data.following_count,
        current_follower_count: res.data.follower_count
      })
      ElMessage.success('移除粉丝成功')
    }
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('移除失败')
  }
}

const handleClose = () => {
  emit('close')
}

const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
function resolveUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${baseUrl}/${path.replace(/^\/+/,'')}`
}

watch(() => props.visible, (val) => {
  if (val) {
    console.log('FollowListDialog open, userId:', props.userId)
    fetchList(true)
  }
})

watch(() => props.userId, (val) => {
  if (props.visible) {
    console.log('userId changed:', val)
    fetchList(true)
  }
})

watch(() => search.value, () => {
  fetchList(true)
})
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 4px;
}

.user-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 0 4px;
}

.user-list::-webkit-scrollbar {
  width: 6px;
}

.user-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.user-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.user-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f8f9fa;
}

.user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.username {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-right: 8px;
}

.unique-id {
  font-size: 12px;
  color: #999;
}

.user-bio {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder-text {
  color: #ccc;
  font-style: italic;
}

.user-actions {
  margin-left: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mutual-badge {
  display: flex;
  align-items: center;
}

.follow-status {
  display: flex;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  color: #999;
  font-size: 14px;
}

.loading-more .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.no-more {
  text-align: center;
  padding: 20px 0;
  color: #999;
  font-size: 14px;
}

/* 弹窗样式优化 */
:deep(.el-dialog) {
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 20px 24px;
}
</style> 