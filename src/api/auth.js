import request from '@/api/axios'

export const getImageAerificationCode = async () => {
  return await request.get('/user/captcha/image_verification_code')
}

export const loginAPI = async (formData) => {
  return await request.post('/user/auth/login', formData)
}

export const sendEmailCodeAPI = async (email) => {
  return await request.post('/user/captcha/send_email', null, {
    params: {
      email,
      type: 0, // 注册验证码
    },
  })
}

export const registerAPI = async (formData) => {
  return await request.post('/user/auth/register', formData)
}

export const getUserProfileAPI = async () => {
  return await request.get('/user/profile')  // 这个路径需要和后端对应
}

// 更新用户资料
export const updateUserProfileAPI = (data) => {
  return request.post('/user/update-profile', data)
}

// 上传头像接口
export const uploadAvatarAPI = (formData, headers) => {
  return request.post('/user/upload-avatar', formData, { headers })
}