import request from '@/api/axios'
import type { ApiResponse, PaginationParams, PaginatedResponse, Video, Comment, UploadProgressCallback } from '@/types/api'

export const uploadVideoAPI = async (data: FormData, onUploadProgress?: UploadProgressCallback): Promise<ApiResponse<Video>> => {
  return await request({
    url: '/video/upload_video',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })
}

export const getMyVideos = async (params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<Video>>> => {
  return await request({
    url: '/video/my_list',
    method: 'get',
    params,
  })
}

// 获取首页推荐视频列表
export const getRecommendVideos = async (params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<Video>>> => {
  return await request({
    url: '/video/recommend',
    method: 'get',
    params,
  })
}

// 获取视频详情
export const getVideoDetail = async (id: number): Promise<ApiResponse<Video>> => {
  return await request({
    url: `/video/detail/${id}`,
    method: 'get'
  })
}

// 视频点赞
export const likeVideo = async (videoId: number): Promise<ApiResponse> => {
  return await request({
    url: '/interaction/like',
    method: 'post',
    data: { video_id: videoId }
  })
}

// 视频收藏
export const favoriteVideo = async (videoId: number): Promise<ApiResponse> => {
  return await request({
    url: '/interaction/collection',
    method: 'post',
    data: { video_id: videoId }
  })
}

// 获取视频评论列表
export const getVideoComments = async (videoId: number, params: PaginationParams & { parent_id?: number | null } = {}): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
  return await request({
    url: `/comment/video/${videoId}`,
    method: 'get',
    params
  })
}

// 发表评论
export const addComment = async (videoId: number, data: { content: string; parent_id?: number | null }): Promise<ApiResponse<Comment>> => {
  return await request({
    url: `/comment/`,
    method: 'post',
    data: { video_id: videoId, ...data }
  })
}

// 评论点赞
export const likeComment = async (commentId: number): Promise<ApiResponse> => {
  return await request({
    url: `/comment/${commentId}/like`,
    method: 'post'
  })
}

// 评论踩
export const dislikeComment = async (commentId: number): Promise<ApiResponse> => {
  return await request({
    url: `/comment/${commentId}/dislike`,
    method: 'post'
  })
}

// 获取评论回复列表
export const getCommentReplies = async (videoId: number, params: PaginationParams & { parent_id?: number } = {}): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
  return await request({
    url: `/comment/video/${videoId}`,
    method: 'get',
    params
  })
}

// 获取视频评论树（无限嵌套）
export function getVideoCommentTree(videoId: number): Promise<ApiResponse<Comment[]>> {
  return request({
    url: `/comment/video/${videoId}/tree`,
    method: 'get'
  })
}

// 删除评论
export const deleteComment = async (commentId: number): Promise<ApiResponse> => {
  return await request({
    url: `/comment/${commentId}`,
    method: 'delete'
  })
}

// 获取我点赞的视频
export const getMyLikeVideos = (params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<Video>>> => {
  return request({
    url: '/interaction/my_likes',
    method: 'get',
    params
  })
}

// 获取我收藏的视频
export const getMyFavoriteVideos = (params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<Video>>> => {
  return request({
    url: '/interaction/my_collections',
    method: 'get',
    params
  })
}

// 获取热门视频
export const getHotVideos = (params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<Video>>> => {
  return request({
    url: '/video/hot',
    method: 'get',
    params
  })
}

// 获取最新视频
export const getLatestVideos = (params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<Video>>> => {
  return request({
    url: '/video/latest',
    method: 'get',
    params
  })
}

export const getWatchHistory = async (params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<Video>>> => {
  return await request({
    url: '/analytics/user/watch-history-mysql',
    method: 'get',
    params,
  })
}

export const logVideoView = async (data: { video_id: number; watch_duration?: number } = {}): Promise<ApiResponse> => {
  return await request({
    url: '/analytics/log_video_view',
    method: 'post',
    data,
  })
}

export function deleteLike(videoId: number): Promise<ApiResponse> {
  return request({
    url: `/interaction/like/${videoId}`,
    method: 'delete'
  })
}

export function deleteCollection(videoId: number): Promise<ApiResponse> {
  return request({
    url: `/interaction/collection/${videoId}`,
    method: 'delete'
  })
}

export function deleteHistory(videoId: number): Promise<ApiResponse> {
  return request({
    url: `/analytics/watch-history/${videoId}`,
    method: 'delete'
  })
}

// 获取他人作品
export const getUserVideos = async (userId: number, params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<Video>>> => {
  return await request({
    url: `/user/${userId}/videos`,
    method: 'get',
    params
  })
}

// 获取他人资料
export const getUserProfile = async (userId: number): Promise<ApiResponse<User>> => {
  return await request({
    url: `/user/profile/${userId}`,
    method: 'get'
  })
}

// 关注
export const followUser = async (userId: number): Promise<ApiResponse> => {
  return await request({
    url: '/user/follow',
    method: 'post',
    data: { user_id: userId }
  })
}

// 取关
export const unfollowUser = async (userId: number): Promise<ApiResponse> => {
  return await request({
    url: '/user/unfollow',
    method: 'post',
    data: { user_id: userId }
  })
}

// 获取关注状态
export const getFollowStatus = async (userId: number): Promise<ApiResponse<{ is_following: boolean }>> => {
  return await request({
    url: '/user/follow_status',
    method: 'get',
    params: { user_id: userId }
  })
}

