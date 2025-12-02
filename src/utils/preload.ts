import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'

type UserBehavior = 'hover_profile_link' | 'navigate_to_profile'

// 预加载管理器
class PreloadManager {
  private preloadQueue: Map<string, Promise<any>> = new Map()
  private isPreloading: boolean = false

  // 预加载用户资料
  async preloadUserProfile(): Promise<void> {
    if (this.isPreloading) return
    
    const userStore = useUserStore()
    
    // 双重检查：既检查 store 中的 token，也检查存储中的 token
    // 避免退出登录时 store 还没更新但存储已清除的情况
    const token = getToken()
    if (!token || !userStore.token) {
      return
    }
    
    this.isPreloading = true
    
    try {
      // 使用缓存策略，如果缓存有效则不重新请求
      await userStore.fetchUserProfile()
      console.log('用户资料预加载完成')
    } catch (error) {
      console.warn('用户资料预加载失败:', error)
    } finally {
      this.isPreloading = false
    }
  }

  // 预加载视频列表
  async preloadUserVideos(): Promise<void> {
    // 这里可以预加载用户的视频列表
    // 暂时不实现，因为视频列表数据量较大
    console.log('视频列表预加载功能待实现')
  }

  // 智能预加载：根据用户行为预测需要的数据
  async smartPreload(userBehavior: UserBehavior): Promise<void> {
    switch (userBehavior) {
      case 'hover_profile_link':
        await this.preloadUserProfile()
        break
      case 'navigate_to_profile':
        await this.preloadUserProfile()
        await this.preloadUserVideos()
        break
      default:
        break
    }
  }
}

// 创建全局预加载管理器实例
export const preloadManager = new PreloadManager()

// 导出便捷方法
export const preloadUserProfile = (): Promise<void> => preloadManager.preloadUserProfile()
export const smartPreload = (behavior: UserBehavior): Promise<void> => preloadManager.smartPreload(behavior)

