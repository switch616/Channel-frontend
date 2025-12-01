import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import router from '@/router' // 如果你使用 vue-router，需要引入

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：附加有效 Token
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一错误处理 & Token 过期跳转登录页
service.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.detail ||
      error.response?.data?.msg ||
      error.message ||
      '请求错误'

    ElMessage.error(message)

    // 如果是 401 或 token 无效，清除 token 并跳转登录页
    if (status === 401) {
      removeToken()
      router.push({ path: '/login', query: { redirect: location.pathname } })
    }

    return Promise.reject(error)
  }
)

export default service
