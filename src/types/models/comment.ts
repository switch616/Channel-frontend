import type { Author } from './user.ts'

export interface Comment {
  id: number
  video_id: number
  user_id: number
  content: string
  parent_id?: number | null
  like_count?: number
  dislike_count?: number
  reply_count?: number
  created_at?: string
  user?: Author
  replies?: Comment[]
  children?: Comment[]
  // 兼容旧结构
  username: string
  avatar?: string
  time: string
  likes?: number
  dislikes?: number
  replyCount?: number
}

export interface CommentOrderParams {
  order: 'latest' | 'hottest'
  page?: number
  size?: number
}

