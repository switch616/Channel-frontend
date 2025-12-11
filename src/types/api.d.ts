// API 响应类型定义
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
  success: boolean
  trace_id?: string
}

// 验证码响应（可能直接返回图片数据，也可能包装在 data 中）
export interface CaptchaResponse {
  image: string
  image_base64?: string
  captcha_id: string
}

export * from './models/user'
export * from './models/video'
export * from './models/comment'

// 分页参数
export interface PaginationParams {
  page?: number
  size?: number
  order?: string
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// 登录请求
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
  captcha_id: string;
  captcha_text: string;
  remember?: boolean;
}

// 登录响应
export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

// 注册请求
export interface RegisterRequest {
  username: string
  email: string
  password: string
  verification_code?: string
}

// 上传进度回调
export type UploadProgressCallback = (progressEvent: {
  loaded: number
  total: number
  percent: number
}) => void

