import request from '@/api/axios'

export const uploadVideoAPI = async (data, onUploadProgress) => {
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


export const getMyVideos = async (params = {}) => {
  return await request({
    url: '/video/my_list',
    method: 'get',
    params, // { page: 1, size: 10 }
  })
}

// 获取首页推荐视频列表
export const getRecommendVideos = async (params = {}) => {
  return await request({
    url: '/video/recommend',
    method: 'get',
    params, // { page: 1, size: 8 }
  })
}

// 获取视频详情
export const getVideoDetail = async (id) => {
  return await request({
    url: `/video/detail/${id}`,
    method: 'get'
  })
}

// 视频点赞
export const likeVideo = async (videoId) => {
  return await request({
    url: '/interaction/like',
    method: 'post',
    data: { video_id: videoId }
  })
}

// 视频收藏
export const favoriteVideo = async (videoId) => {
  return await request({
    url: '/interaction/collection',
    method: 'post',
    data: { video_id: videoId }
  })
}

// 获取视频评论列表
export const getVideoComments = async (videoId, params = {}) => {
  return await request({
    url: `/comment/video/${videoId}`,
    method: 'get',
    params // { page: 1, size: 20, parent_id: null }
  })
}

// 发表评论
export const addComment = async (videoId, data) => {
  return await request({
    url: `/comment/`,
    method: 'post',
    data // { video_id: 1, content: '评论内容', parent_id: null }
  })
}

// 评论点赞
export const likeComment = async (commentId) => {
  return await request({
    url: `/comment/${commentId}/like`,
    method: 'post'
  })
}

// 评论踩
export const dislikeComment = async (commentId) => {
  return await request({
    url: `/comment/${commentId}/dislike`,
    method: 'post'
  })
}

// 获取评论回复列表
export const getCommentReplies = async (videoId, params = {}) => {
  return await request({
    url: `/comment/video/${videoId}`,
    method: 'get',
    params // { page: 1, size: 10, parent_id: commentId }
  })
}

// 获取视频评论树（无限嵌套）
export function getVideoCommentTree(videoId) {
  return request({
    url: `/comment/video/${videoId}/tree`,
    method: 'get'
  })
}

// 删除评论
export const deleteComment = async (commentId) => {
  return await request({
    url: `/comment/${commentId}`,
    method: 'delete'
  })
}

// 获取我点赞的视频
export const getMyLikeVideos = (params) => {
  return request({
    url: '/interaction/my_likes',
    method: 'get',
    params
  })
}

// 获取我收藏的视频
export const getMyFavoriteVideos = (params) => {
  return request({
    url: '/interaction/my_collections',
    method: 'get',
    params
  })
}

// 获取热门视频
export const getHotVideos = (params = {}) => {
  return request({
    url: '/video/hot',
    method: 'get',
    params
  })
}

// 获取最新视频
export const getLatestVideos = (params = {}) => {
  return request({
    url: '/video/latest',
    method: 'get',
    params
  })
}

export const getWatchHistory = async (params = {}) => {
  return await request({
    url: '/analytics/user/watch-history-mysql',
    method: 'get',
    params,
  })
}

export const logVideoView = async (data = {}) => {
  return await request({
    url: '/analytics/log_video_view',
    method: 'post',
    data,
  })
}

export function deleteLike(videoId) {
  return request({
    url: `/interaction/like/${videoId}`,
    method: 'delete'
  })
}
export function deleteCollection(videoId) {
  return request({
    url: `/interaction/collection/${videoId}`,
    method: 'delete'
  })
}
export function deleteHistory(videoId) {
  return request({
    url: `/analytics/watch-history/${videoId}`,
    method: 'delete'
  })
}

// 获取他人作品
export const getUserVideos = async (userId, params = {}) => {
  return await request({
    url: `/user/${userId}/videos`,
    method: 'get',
    params
  })
}

// 获取他人资料
export const getUserProfile = async (userId) => {
  return await request({
    url: `/user/profile/${userId}`,
    method: 'get'
  })
}

// 关注
export const followUser = async (userId) => {
  return await request({
    url: '/user/follow',
    method: 'post',
    data: { user_id: userId }
  })
}

// 取关
export const unfollowUser = async (userId) => {
  return await request({
    url: '/user/unfollow',
    method: 'post',
    data: { user_id: userId }
  })
}

// 获取关注状态
export const getFollowStatus = async (userId) => {
  return await request({
    url: '/user/follow_status',
    method: 'get',
    params: { user_id: userId }
  })
}