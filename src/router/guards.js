// src/router/guards.js
import { getToken, removeToken } from '@/utils/auth'
import { useMeta } from '@/utils/useMeta'
import { preloadUserProfile } from '@/utils/preload'

// 安装所有全局守卫
export function setupRouterGuards(router) {
  setupAuthGuard(router)
  setupMetaGuard(router)
  setupExpiredTokenGuard(router)
}

// 认证守卫：拦截需要登录的页面
function setupAuthGuard(router) {
  router.beforeEach((to, from, next) => {
    const token = getToken()
    if (to.meta.requiresAuth && !token) {
      return next('/login')
    }
    
    // 路由级别的预加载
    if (to.name === 'UserProfile' || to.path === '/user/profile') {
      // 预加载用户资料
      preloadUserProfile()
    }
    
    next()
  })
}

// SEO Meta TDK 设置守卫
function setupMetaGuard(router) {
  router.beforeEach((to, from, next) => {
    const meta = to.meta || {}
    useMeta({
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
    })
    next()
  })
}

// token 过期处理
function setupExpiredTokenGuard(router) {
  router.afterEach((to, from) => {
    const token = getToken()
    if (token && isTokenExpired(token)) {
      removeToken()
      router.push('/login')
    }
  })
}

// token 过期检测方法
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiryTime = payload.exp * 1000
    return Date.now() > expiryTime
  } catch (err) {
    return true // token 不合法直接认为过期
  }
}
