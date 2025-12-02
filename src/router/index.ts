// src/router/index.ts
import { createRouter, createWebHistory, Router } from 'vue-router'
import { constantRoutes } from './routes'
import { setupRouterGuards } from './guards'

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 }),
})

// 封装统一的守卫逻辑
setupRouterGuards(router)

export default router

