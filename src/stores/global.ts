import { defineStore } from 'pinia'

interface GlobalState {
  // 全局状态
}

export const useGlobalStore = defineStore('global', {
  state: (): GlobalState => ({}),

  actions: {}
})

