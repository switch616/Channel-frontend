/**
 * 应用全局状态管理
 * 按照设计文档的应用状态层设计
 */
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    // 应用配置
    config: {
      appName: 'YUN 社交媒体平台',
      version: '1.0.0',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088',
      uploadMaxSize: 100 * 1024 * 1024, // 100MB
      supportedVideoFormats: ['mp4', 'avi', 'mov', 'wmv', 'flv'],
      supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    },
    
    // 主题设置
    theme: {
      mode: 'light', // light, dark, auto
      primaryColor: '#409eff',
      customColors: {}
    },
    
    // 布局设置
    layout: {
      sidebarCollapsed: false,
      sidebarWidth: 200,
      headerHeight: 60,
      footerHeight: 40
    },
    
    // 加载状态
    loading: {
      global: false,
      page: false,
      component: false
    },
    
    // 错误状态
    error: {
      global: null,
      page: null,
      component: null
    },
    
    // 通知消息
    notifications: [],
    
    // 面包屑导航
    breadcrumbs: [],
    
    // 页面标题
    pageTitle: '',
    
    // 设备信息
    device: {
      type: 'desktop', // desktop, tablet, mobile
      width: window.innerWidth,
      height: window.innerHeight
    },
    
    // 网络状态
    network: {
      online: navigator.onLine,
      type: 'unknown'
    }
  }),

  getters: {
    // 获取完整页面标题
    fullPageTitle: (state) => {
      return state.pageTitle ? `${state.pageTitle} - ${state.config.appName}` : state.config.appName
    },
    
    // 是否为移动设备
    isMobile: (state) => state.device.type === 'mobile',
    
    // 是否为平板设备
    isTablet: (state) => state.device.type === 'tablet',
    
    // 是否为桌面设备
    isDesktop: (state) => state.device.type === 'desktop',
    
    // 是否有全局错误
    hasGlobalError: (state) => !!state.error.global,
    
    // 是否有页面错误
    hasPageError: (state) => !!state.error.page,
    
    // 是否有组件错误
    hasComponentError: (state) => !!state.error.component,
    
    // 是否有任何加载状态
    isLoading: (state) => state.loading.global || state.loading.page || state.loading.component,
    
    // 未读通知数量
    unreadNotificationCount: (state) => state.notifications.filter(n => !n.read).length,
    
    // 当前主题模式
    currentThemeMode: (state) => {
      if (state.theme.mode === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return state.theme.mode
    }
  },

  actions: {
    // 设置应用配置
    setConfig(config) {
      this.config = { ...this.config, ...config }
    },

    // 设置主题
    setTheme(theme) {
      this.theme = { ...this.theme, ...theme }
      this.applyTheme()
    },

    // 应用主题
    applyTheme() {
      const root = document.documentElement
      const mode = this.currentThemeMode
      
      root.setAttribute('data-theme', mode)
      root.style.setProperty('--primary-color', this.theme.primaryColor)
      
      // 应用自定义颜色
      Object.entries(this.theme.customColors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })
    },

    // 切换主题模式
    toggleTheme() {
      const modes = ['light', 'dark', 'auto']
      const currentIndex = modes.indexOf(this.theme.mode)
      const nextIndex = (currentIndex + 1) % modes.length
      this.setTheme({ mode: modes[nextIndex] })
    },

    // 设置布局
    setLayout(layout) {
      this.layout = { ...this.layout, ...layout }
    },

    // 切换侧边栏
    toggleSidebar() {
      this.layout.sidebarCollapsed = !this.layout.sidebarCollapsed
    },

    // 设置加载状态
    setLoading(type, loading) {
      this.loading[type] = loading
    },

    // 设置错误状态
    setError(type, error) {
      this.error[type] = error
    },

    // 清除错误状态
    clearError(type) {
      this.error[type] = null
    },

    // 添加通知
    addNotification(notification) {
      const id = Date.now() + Math.random()
      const newNotification = {
        id,
        type: 'info',
        duration: 4500,
        showClose: true,
        ...notification
      }
      
      this.notifications.unshift(newNotification)
      
      // 自动移除通知
      if (newNotification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(id)
        }, newNotification.duration)
      }
      
      return id
    },

    // 移除通知
    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    // 标记通知为已读
    markNotificationAsRead(id) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
      }
    },

    // 清除所有通知
    clearNotifications() {
      this.notifications = []
    },

    // 设置面包屑
    setBreadcrumbs(breadcrumbs) {
      this.breadcrumbs = breadcrumbs
    },

    // 设置页面标题
    setPageTitle(title) {
      this.pageTitle = title
      document.title = this.fullPageTitle
    },

    // 更新设备信息
    updateDeviceInfo() {
      const width = window.innerWidth
      const height = window.innerHeight
      
      let type = 'desktop'
      if (width < 768) {
        type = 'mobile'
      } else if (width < 1024) {
        type = 'tablet'
      }
      
      this.device = { type, width, height }
    },

    // 更新网络状态
    updateNetworkStatus() {
      this.network.online = navigator.onLine
      
      // 尝试获取网络类型（如果支持）
      if ('connection' in navigator) {
        this.network.type = navigator.connection.effectiveType || 'unknown'
      }
    },

    // 初始化应用
    init() {
      // 监听窗口大小变化
      window.addEventListener('resize', this.updateDeviceInfo)
      
      // 监听网络状态变化
      window.addEventListener('online', this.updateNetworkStatus)
      window.addEventListener('offline', this.updateNetworkStatus)
      
      // 初始化设备信息
      this.updateDeviceInfo()
      this.updateNetworkStatus()
      
      // 应用主题
      this.applyTheme()
      
      // 监听系统主题变化
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (this.theme.mode === 'auto') {
            this.applyTheme()
          }
        })
      }
    },

    // 销毁应用
    destroy() {
      window.removeEventListener('resize', this.updateDeviceInfo)
      window.removeEventListener('online', this.updateNetworkStatus)
      window.removeEventListener('offline', this.updateNetworkStatus)
    }
  }
})
