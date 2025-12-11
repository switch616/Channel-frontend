import type { Author } from './user.ts'

export type VideoQuality = '1080p' | '720p' | string

export interface VideoSource {
  quality: VideoQuality
  url: string
  label?: string
}

export interface VideoDetail {
  id: number
  title: string
  description?: string
  cover_image: string
  cover_url?: string
  file_path: string
  video_url?: string
  like_count: number
  collect_count: number
  comment_count: number
  is_liked: boolean
  is_collected: boolean
  uploader: Author
  created_at?: string
  updated_at?: string
  view_count?: number
  sources?: Record<VideoQuality, VideoSource>
}

export interface InteractionState {
  isLiked: boolean
  isFavorited: boolean
  isFollowed: boolean
  isMutual: boolean
  isFollower: boolean
}

