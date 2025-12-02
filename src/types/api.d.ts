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

// 用户相关类型
export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  signature?: string
  following_count?: number
  follower_count?: number
  video_count?: number
  [key: string]: any
}

// 视频相关类型
export interface Video {
  id: number
  title: string
  description?: string
  cover_url: string
  video_url: string
  author_id: number
  author?: User
  like_count?: number
  comment_count?: number
  view_count?: number
  created_at?: string
  updated_at?: string
  [key: string]: any
}

// 评论相关类型
export interface Comment {
  id: number
  video_id: number
  user_id: number
  user?: User
  content: string
  parent_id?: number
  like_count?: number
  dislike_count?: number
  reply_count?: number
  created_at?: string
  replies?: Comment[]
  [key: string]: any
}

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

