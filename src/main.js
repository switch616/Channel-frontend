import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import './assets/style.css'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { useRouter } from 'vue-router'

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error)
  const appStore = useAppStore()
  appStore.setError('global', event.error.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason)
  const appStore = useAppStore()
  appStore.setError('global', event.reason?.message || '未知错误')
})

// 监听存储变化（多标签页同步）
window.addEventListener('storage', (e) => {
  if (e.key === 'force_logout') {
    const userStore = useUserStore()
    const router = useRouter()
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

// 初始化用户状态
const userStore = useUserStore()
if (userStore.token) {
  userStore.fetchUserProfile()
}

app.use(ElementPlus)
app.use(router)
app.mount('#app')