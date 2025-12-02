// 简单的事件总线实现
type EventCallback = (data?: any) => void

class EventBus {
  private events: Record<string, EventCallback[]> = {}

  // 监听事件
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  // 移除监听
  off(event: string, callback?: EventCallback): void {
    if (!this.events[event]) return
    if (!callback) {
      delete this.events[event]
    } else {
      const index = this.events[event].indexOf(callback)
      if (index > -1) {
        this.events[event].splice(index, 1)
      }
    }
  }

  // 触发事件
  emit(event: string, data?: any): void {
    if (!this.events[event]) return
    this.events[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`事件 ${event} 回调执行错误:`, error)
      }
    })
  }

  // 清除所有事件
  clear(): void {
    this.events = {}
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()

// 预定义的事件类型
export const EVENTS = {
  USER_FOLLOW_UPDATED: 'user_follow_updated',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  VIDEO_UPLOADED: 'video_uploaded',
  VIDEO_LIKED: 'video_liked',
  VIDEO_COLLECTED: 'video_collected'
} as const

