import request from '@/api/axios'

export const followUser = async (userId) => {
  return await request({
    url: '/user/follow',
    method: 'post',
    data: { user_id: userId }
  })
}

export const removeFollow = async (userId) => {
  return await request({
    url: '/user/remove_follow',
    method: 'post',
    data: { user_id: userId }
  })
}

export const removeFan = async (userId) => {
  return await request({
    url: '/user/remove_fan',
    method: 'post',
    data: { user_id: userId }
  })
}

export const getFollowStatus = async (userId) => {
  return await request({
    url: '/user/follow_status',
    method: 'get',
    params: { user_id: userId }
  })
}

export const getFansCount = async (userId) => {
  return await request({
    url: '/user/fans_count',
    method: 'get',
    params: { user_id: userId }
  })
}

export const getFollowingCount = async (userId) => {
  return await request({
    url: '/user/following_count',
    method: 'get',
    params: { user_id: userId }
  })
}

export const getFollowingList = (params) => {
  return request({
    url: '/user/following_list',
    method: 'get',
    params
  })
}

export const getFansList = (params) => {
  return request({
    url: '/user/fans_list',
    method: 'get',
    params
  })
}

export function changePassword(data) {
  return request.post('/user/change_password', data)
} 