import type { Author } from './user.ts'

/**
 * 【视频清晰度类型】
 * - 约束常见清晰度
 * - 保留 string 扩展，兼容后端动态返回（如 4K / 原画）
 */
export type VideoQuality = '1080p' | '720p' | string

/**
 * 【视频播放源信息】
 * 描述同一视频在不同清晰度下的播放地址
 */
export interface VideoSource {
  /** 视频清晰度 */
  quality: VideoQuality

  /** 播放地址 */
  url: string

  /** 清晰度展示文案（如：高清 / 超清） */
  label?: string
}

/**
 * 【视频详情领域模型】
 * - 前端核心使用模型
 * - 聚合播放、互动、作者等信息
 * - 可直接用于详情页渲染
 */
export interface VideoDetail {
  /** 视频 ID */
  id: number

  /** 视频标题 */
  title: string

  /** 视频简介 */
  description?: string

  /** 封面图片（后端字段） */
  cover_image: string

  /** 封面图片 URL（前端兼容字段） */
  cover_url?: string

  /** 视频文件路径（后端使用） */
  file_path: string

  /** 视频播放地址（前端使用） */
  video_url?: string

  /** 点赞数 */
  like_count: number

  /** 收藏数 */
  collect_count: number

  /** 评论数 */
  comment_count: number

  /** 当前用户是否已点赞 */
  is_liked: boolean

  /** 当前用户是否已收藏 */
  is_collected: boolean

  /** 视频上传者信息 */
  uploader: Author

  /** 创建时间 */
  created_at?: string

  /** 更新时间 */
  updated_at?: string

  /** 播放量 */
  view_count?: number

  /** 多清晰度视频源 */
  sources?: Record<VideoQuality, VideoSource>
}

/**
 * 【用户互动状态】
 * 用于描述当前登录用户与目标对象的关系
 */
export interface InteractionState {
  /** 是否点赞 */
  isLiked: boolean

  /** 是否已收藏 */
  isFavorited: boolean

  /** 是否已关注对方 */
  isFollowed: boolean

  /** 是否互相关注 */
  isMutual: boolean

  /** 是否为对方粉丝 */
  isFollower: boolean
}

/**
 * 【后端返回的视频列表原始结构】
 * - 字段命名为 snake_case
 * - 仅作为接口层数据
 */
export interface RawVideoItem {
  /** 视频 ID */
  id: number

  /** 视频标题 */
  title: string

  /** 上传者用户名 */
  uploader_username: string

  /** 视频简介 */
  description?: string

  /** 封面图片 */
  cover_image: string

  /** 视频文件路径 */
  file_path: string
}

/**
 * 【视频列表 UI 展示结构】
 * - 专为列表页 / 卡片组件服务
 * - 字段已扁平化、语义化
 */
export interface VideoItem {
  /** 视频 ID */
  id: number

  /** 视频标题 */
  title: string

  /** 用户名 */
  user: string

  /** 视频简介 */
  description: string

  /** 封面图片 */
  cover_image: string

  /** 视频播放地址 */
  videoUrl: string
}

/* -------------------------------------------
   Slot 模型（核心）
------------------------------------------- */
type SlotType = 'prev' | 'current' | 'next'

export interface VideoSlot {
  type: SlotType
  video: VideoItem | null
}