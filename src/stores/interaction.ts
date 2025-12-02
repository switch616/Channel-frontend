import { defineStore } from 'pinia'

interface InteractionState {
  likedVideos: number[]
  collectedVideos: number[]
}

export const useInteractionStore = defineStore('interaction', {
  state: (): InteractionState => ({
    likedVideos: [],
    collectedVideos: []
  }),

  actions: {
    addLikedVideo(videoId: number): void {
      if (!this.likedVideos.includes(videoId)) {
        this.likedVideos.push(videoId)
      }
    },

    removeLikedVideo(videoId: number): void {
      const index = this.likedVideos.indexOf(videoId)
      if (index > -1) {
        this.likedVideos.splice(index, 1)
      }
    },

    addCollectedVideo(videoId: number): void {
      if (!this.collectedVideos.includes(videoId)) {
        this.collectedVideos.push(videoId)
      }
    },

    removeCollectedVideo(videoId: number): void {
      const index = this.collectedVideos.indexOf(videoId)
      if (index > -1) {
        this.collectedVideos.splice(index, 1)
      }
    }
  }
})

