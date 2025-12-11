import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import './assets/style.css'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import VuePlyr from 'vue-plyr'
import 'vue-plyr/dist/vue-plyr.css'

// 全局错误处理
window.addEventListener('error', (event: ErrorEvent) => {
  console.error('全局错误:', event.error)
  const appStore = useAppStore()
  appStore.setError('global', event.error?.message || '未知错误')
})

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('未处理的Promise拒绝:', event.reason)
  const appStore = useAppStore()
  appStore.setError('global', (event.reason as Error)?.message || '未知错误')
})

// 监听存储变化（多标签页同步）
window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key === 'force_logout') {
    const userStore = useUserStore()
    // 注意：这里不能使用 useRouter()，因为它在 setup 外调用
    // 应该直接使用 router 实例
    userStore.logout(router)
  }
})

const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 创建Pinia实例
const pinia = createPinia()
app.use(pinia)

// 初始化应用状态
const appStore = useAppStore()
appStore.init()

// 初始化用户状态 - 如果有 token，自动获取用户信息
const userStore = useUserStore()
if (userStore.token) {
  // 异步获取用户信息，不阻塞应用启动
  userStore.fetchUserProfile().catch((err) => {
    console.error('初始化用户信息失败:', err)
    // 如果获取失败，可能是 token 过期，清除 token
    if (err?.response?.status === 401) {
      userStore.logout()
    }
  })
}

app.use(ElementPlus)
app.use(router)
app.use(VuePlyr, {
    plyr: {}
  })
app.mount('#app')

