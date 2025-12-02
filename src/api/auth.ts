import request from '@/api/axios'
import type { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, User } from '@/types/api'

// 验证码API直接返回 { captcha_id, image_base64 }，不是统一响应格式
export const getImageAerificationCode = async (): Promise<{ captcha_id: string; image_base64: string } | ApiResponse<{ captcha_id: string; image_base64: string }>> => {
  return await request.get('/user/captcha/image_verification_code')
}

export const loginAPI = async (formData: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  return await request.post('/user/auth/login', formData)
}

export const sendEmailCodeAPI = async (email: string): Promise<ApiResponse> => {
  return await request.post('/user/captcha/send_email', null, {
    params: {
      email,
      type: 0, // 注册验证码
    },
  })
}

export const registerAPI = async (formData: RegisterRequest): Promise<ApiResponse> => {
  return await request.post('/user/auth/register', formData)
}

export const getUserProfileAPI = async (): Promise<ApiResponse<User>> => {
  return await request.get('/user/profile')
}

// 更新用户资料
export const updateUserProfileAPI = (data: Partial<User>): Promise<ApiResponse<User>> => {
  return request.post('/user/update-profile', data)
}

// 上传头像接口
export const uploadAvatarAPI = (formData: FormData, headers?: Record<string, string>): Promise<ApiResponse<{ avatar_url: string }>> => {
  return request.post('/user/upload-avatar', formData, { headers })
}

