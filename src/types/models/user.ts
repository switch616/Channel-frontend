export interface Author {
  id: number
  username: string
  profile_picture: string
  fans_count?: number
  is_followed?: boolean
  is_mutual?: boolean
  is_follower?: boolean
}

export interface UserProfile extends Author {
  email?: string
  signature?: string
  following_count?: number
  follower_count?: number
  video_count?: number
}

