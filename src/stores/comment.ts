import { defineStore } from 'pinia'
import type { Comment } from '@/types/api'

interface CommentState {
  comments: Comment[]
  currentComment: Comment | null
}

export const useCommentStore = defineStore('comment', {
  state: (): CommentState => ({
    comments: [],
    currentComment: null
  }),

  actions: {
    setComments(comments: Comment[]): void {
      this.comments = comments
    },

    setCurrentComment(comment: Comment | null): void {
      this.currentComment = comment
    }
  }
})

