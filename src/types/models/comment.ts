import type { Author } from './user.ts'

/**
 * 【评论业务统一模型】
 * 前端内部使用的 Comment 类型
 * - 已做字段语义转换（如 created_at → time）
 * - 已做用户信息扁平化（username / avatar）
 * - 支持树形结构（children / replies）
 * 
 * 使用场景：
 * - 评论列表渲染
 * - 评论回复树
 * - 点赞 / 踩状态展示
 */
export interface Comment {
  /** 评论唯一 ID */
  id: number

  /** 所属视频 ID */
  video_id: number

  /** 评论用户 ID */
  user_id: number

  /** 评论内容 */
  content: string

  /** 父评论 ID（为空表示一级评论） */
  parent_id?: number | null

  /** 点赞数 */
  like_count?: number

  /** 踩数 */
  dislike_count?: number

  /** 回复数量 */
  reply_count?: number

  /** 创建时间（原始时间戳或字符串） */
  created_at?: string

  /** 评论作者信息（完整用户对象） */
  user?: Author

  /** 后端返回的回复列表 */
  replies?: Comment[]

  /** 前端渲染使用的子评论 */
  children?: Comment[]

  /** 评论用户名（扁平字段，方便渲染） */
  username: string

  /** 用户头像 */
  avatar?: string

  /** 格式化后的时间（如：2小时前） */
  time: string

  /** 点赞数（前端使用字段） */
  likes?: number

  /** 踩数（前端使用字段） */
  dislikes?: number

  /** 回复数量（前端使用字段） */
  replyCount?: number
}

/**
 * 【评论排序 & 分页参数】
 * 用于获取评论列表接口
 */
export interface CommentOrderParams {
  /** 排序方式：最新 / 最热 */
  order: 'latest' | 'hottest'

  /** 当前页码 */
  page?: number

  /** 每页数量 */
  size?: number
}

/**
 * 【后端返回的评论用户结构】
 * 原始数据结构，不建议直接用于页面
 */
export interface RawCommentUser {
  /** 用户 ID */
  id: number

  /** 用户名 */
  username: string

  /** 用户头像 */
  profile_picture?: string
}

/**
 * 【后端原始评论结构】
 * - 字段命名为 snake_case
 * - 数据结构偏接口契约
 */
export interface RawComment {
  /** 评论 ID */
  id: number

  /** 所属视频 ID */
  video_id: number

  /** 评论内容 */
  content: string

  /** 创建时间 */
  created_at: string

  /** 点赞数 */
  like_count: number

  /** 踩数 */
  dislike_count: number

  /** 回复数 */
  reply_count: number

  /** 用户 ID */
  user_id: number

  /** 评论用户信息 */
  user?: RawCommentUser

  /** 子评论（原始结构） */
  children?: RawComment[]
}

/**
 * 【评论渲染专用结构】
 * - 完全为 UI 服务
 * - 字段已语义化、格式化
 * - 可直接用于组件渲染
 */
export interface CommentItemType {
  /** 评论 ID */
  id: number

  /** 所属视频 ID */
  video_id: number

  /** 评论内容 */
  content: string

  /** 用户名 */
  username: string

  /** 用户头像 */
  avatar?: string

  /** 用户 ID */
  user_id: number

  /** 已格式化时间 */
  time: string

  /** 点赞数 */
  likes?: number

  /** 踩数 */
  dislikes?: number

  /** 回复数量 */
  replyCount: number

  /** 子评论列表 */
  children: CommentItemType[]
}
