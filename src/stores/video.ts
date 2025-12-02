import { defineStore } from 'pinia'
import type { Video } from '@/types/api'

interface VideoState {
  currentVideo: Video | null
  videoList: Video[]
}

export const useVideoStore = defineStore('video', {
  state: (): VideoState => ({
    currentVideo: null,
    videoList: []
  }),

  actions: {
    setCurrentVideo(video: Video | null): void {
      this.currentVideo = video
    },

    setVideoList(videos: Video[]): void {
      this.videoList = videos
    }
  }
})

