import request from '@/api/axios'
import type { ApiResponse, PaginationParams, PaginatedResponse, User } from '@/types/api'

export const followUser = async (userId: number): Promise<ApiResponse> => {
  return await request({
    url: '/user/follow',
    method: 'post',
    data: { user_id: userId }
  })
}

export const removeFollow = async (userId: number): Promise<ApiResponse> => {
  return await request({
    url: '/user/remove_follow',
    method: 'post',
    data: { user_id: userId }
  })
}

export const removeFan = async (userId: number): Promise<ApiResponse> => {
  return await request({
    url: '/user/remove_fan',
    method: 'post',
    data: { user_id: userId }
  })
}

export const getFollowStatus = async (userId: number): Promise<ApiResponse<{ is_following: boolean }>> => {
  return await request({
    url: '/user/follow_status',
    method: 'get',
    params: { user_id: userId }
  })
}

export const getFansCount = async (userId: number): Promise<ApiResponse<{ count: number }>> => {
  return await request({
    url: '/user/fans_count',
    method: 'get',
    params: { user_id: userId }
  })
}

export const getFollowingCount = async (userId: number): Promise<ApiResponse<{ count: number }>> => {
  return await request({
    url: '/user/following_count',
    method: 'get',
    params: { user_id: userId }
  })
}

export const getFollowingList = (params: PaginationParams & { user_id?: number }): Promise<ApiResponse<PaginatedResponse<User>>> => {
  return request({
    url: '/user/following_list',
    method: 'get',
    params
  })
}

export const getFansList = (params: PaginationParams & { user_id?: number }): Promise<ApiResponse<PaginatedResponse<User>>> => {
  return request({
    url: '/user/fans_list',
    method: 'get',
    params
  })
}

export function changePassword(data: { old_password: string; new_password: string }): Promise<ApiResponse> {
  return request.post('/user/change_password', data)
}

