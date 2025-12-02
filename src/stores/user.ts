import { defineStore } from 'pinia'
import { loginAPI, getUserProfileAPI } from '@/api/auth'
import { setToken, removeToken, getToken } from '@/utils/auth'
import { eventBus, EVENTS } from '@/utils/eventBus'
import type { User, LoginRequest } from '@/types/api'
import type { Router } from 'vue-router'

interface UserPreferences {
  theme: string
  language: string
  notifications: {
    email: boolean
    push: boolean
    like: boolean
    comment: boolean
    follow: boolean
  }
}

interface UserState {
  user: User | null
  token: string
  // 缓存相关
  lastProfileFetch: number | null
  profileCacheDuration: number
  // 用户偏好设置
  preferences: UserPreferences
  // 用户活动状态
  isOnline: boolean
  lastActivity: number
  // 用户权限
  permissions: string[]
  roles: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    token: getToken() || '',
    // 缓存相关
    lastProfileFetch: null,
    profileCacheDuration: 5 * 60 * 1000, // 5分钟缓存
    // 用户偏好设置
    preferences: {
      theme: 'light',
      language: 'zh-CN',
      notifications: {
        email: true,
        push: true,
        like: true,
        comment: true,
        follow: true
      }
    },
    // 用户活动状态
    isOnline: true,
    lastActivity: Date.now(),
    // 用户权限
    permissions: [],
    roles: []
  }),

  actions: {
    setToken(token: string, expiresIn?: number, remember: boolean = false): void {
      this.token = token
      setToken(token, expiresIn, remember)
    },

    setUser(userData: User): void {
      this.user = userData
    },

    // 更新关注统计数据（用于关注操作后）
    // 这个方法用于在关注/取关操作后，直接更新store中的统计数据
    // 避免重新调用完整的用户资料接口，提升性能
    updateFollowStats(followingCount: number, followerCount: number): void {
      if (this.user) {
        this.user.following_count = followingCount
        this.user.follower_count = followerCount
      }
    },

    // 增量更新用户资料字段
    updateUserField(field: keyof User, value: any): void {
      if (this.user && field in this.user) {
        (this.user as any)[field] = value
        console.log(`更新用户字段: ${field} = ${value}`)
      }
    },

    // 批量更新用户资料字段
    updateUserFields(fields: Partial<User>): void {
      if (this.user) {
        Object.assign(this.user, fields)
        console.log('批量更新用户字段:', Object.keys(fields))
      }
    },

    // 处理关注事件 - 当其他用户关注/取关当前用户时更新粉丝数
    handleFollowEvent(data: { target_user_id: number; target_follower_count: number }): void {
      if (this.user && data.target_user_id === this.user.id) {
        // 其他用户关注/取关了当前用户，更新当前用户的粉丝数
        this.user.follower_count = data.target_follower_count
        console.log('收到关注事件，更新粉丝数:', data.target_follower_count)
      }
    },

    // 初始化事件监听
    initEventListeners(): void {
      // 监听关注事件
      eventBus.on(EVENTS.USER_FOLLOW_UPDATED, this.handleFollowEvent)
    },

    // 清理事件监听
    clearEventListeners(): void {
      eventBus.off(EVENTS.USER_FOLLOW_UPDATED, this.handleFollowEvent)
    },

    async login(payload: LoginRequest): Promise<void> {
      const res = await loginAPI(payload)
      this.setToken(res.data.access_token)
      await this.fetchUserProfile()
      // 登录后初始化事件监听
      this.initEventListeners()
    },

    async fetchUserProfile(forceRefresh: boolean = false): Promise<User | null> {
      // 检查缓存是否有效
      if (!forceRefresh && this.lastProfileFetch && 
          (Date.now() - this.lastProfileFetch) < this.profileCacheDuration) {
        console.log('使用缓存的用户资料数据')
        return this.user
      }

      console.log('从服务器获取用户资料数据')
      
      try {
        const res = await getUserProfileAPI()
        // 统一响应格式：{ code, msg, data, success }
        if (res?.success && res?.data) {
          this.user = res.data as User
          this.lastProfileFetch = Date.now()
          console.log('用户资料获取成功:', res.data)
          return res.data as User
        } else {
          throw new Error(res?.msg || '获取用户资料失败')
        }
      } catch (e) {
        console.error('获取用户资料失败:', e)
        // 如果是 401 错误，才清除登录状态
        if ((e as any)?.response?.status === 401) {
          this.logout()
        }
        throw e
      }
    },

    // 强制刷新用户资料（忽略缓存）
    async forceRefreshUserProfile(): Promise<User | null> {
      return await this.fetchUserProfile(true)
    },

    // 清除缓存
    clearProfileCache(): void {
      this.lastProfileFetch = null
    },

    // 更新用户偏好设置
    updatePreferences(newPreferences: Partial<UserPreferences>): void {
      this.preferences = { ...this.preferences, ...newPreferences }
      // 可以在这里调用API保存到服务器
      this.savePreferencesToServer()
    },

    // 保存偏好设置到服务器
    async savePreferencesToServer(): Promise<void> {
      try {
        // 这里调用API保存偏好设置
        // await updateUserPreferencesAPI(this.preferences)
        console.log('偏好设置已保存')
      } catch (error) {
        console.error('保存偏好设置失败:', error)
      }
    },

    // 更新用户活动状态
    updateActivityStatus(): void {
      this.lastActivity = Date.now()
      this.isOnline = true
    },

    // 设置用户权限
    setPermissions(permissions: string[]): void {
      this.permissions = permissions
    },

    // 设置用户角色
    setRoles(roles: string[]): void {
      this.roles = roles
    },

    // 检查用户权限
    hasPermission(permission: string): boolean {
      return this.permissions.includes(permission)
    },

    // 检查用户角色
    hasRole(role: string): boolean {
      return this.roles.includes(role)
    },

    // 检查是否为管理员
    isAdmin(): boolean {
      return this.hasRole('admin') || this.hasRole('super_admin')
    },

    logout(router?: Router): void {
      // 先清除 store 中的状态
      this.token = ''
      this.user = null
      this.permissions = []
      this.roles = []
      this.isOnline = false
      // 清除缓存时间戳
      this.lastProfileFetch = null
      // 再清除存储中的 token（确保顺序，避免时序问题）
      removeToken()
      // 登出时清理事件监听
      this.clearEventListeners()
      // 跳转到登录页（如果传入router）
      if (router) {
        router.push('/login')
      }
    }
  }
})

