import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：附加有效 Token
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
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
  (response: AxiosResponse) => {
    const res = response.data

    // 统一业务响应规范：如果包含 code/success 字段，则认为是业务响应
    if (res && typeof res === 'object' && 'code' in res && 'success' in res) {
      // 对于 success = false 的情况，不抛出 HTTP 错误，让调用方自己基于 code 处理
      // 这里只做最小处理：直接返回整体结构 { code, msg, data, success, trace_id }
      return res
    }

    // 其他情况（如验证码图片、第三方接口直透等），保持原样
    return res
  },
  (error: any) => {
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

