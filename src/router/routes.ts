import type { RouteRecordRaw } from 'vue-router'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    meta: { requiresAuth: false, showNavBar: false },  // 登录页不显示
    component: () => import('@/views/auth/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    meta: { requiresAuth: false, showNavBar: false },  // 注册页不显示
    component: () => import('@/views/auth/Register.vue'),
  },
  {
    path: '/',
    name: 'Index',
    meta: { requiresAuth: true, showNavBar: true },  // 首页显示 NavBar
    component: () => import('@/views/home/Index.vue'),
    children: [
      {
        path: '',
        name: 'Jingxuan',
        component: () => import('@/views/home/Jingxuan.vue'),
        meta: { title: '精选', showNavBar: true }
      },
      {
        path: 'shuashipin',
        name: 'ShuaShipin',
        component: () => import('@/views/home/ShuaShipin.vue'),
        meta: { title: '刷视频', showNavBar: true }
      }
    ]
  },
  {
    path: '/user',
    name: 'UserCenter',
    meta: { requiresAuth: true, showNavBar: true },  // 用户中心显示 NavBar
    component: () => import('@/views/user/Profile.vue'),
    children: [
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/user/Profile.vue'),
        meta: {
          title: '个人资料 - YUN 社交媒体平台',
          description: '查看并编辑您的个人资料，包括用户名、签名和头像。',
          keywords: 'YUN, 个人资料, 用户中心, 社交平台, 账号设置',
          showNavBar: true,
          requiresAuth: true,
        },
      }
    ],
  },
  {
    path: '/user/:userId',
    name: 'UserProfileOther',
    meta: { requiresAuth: true, showNavBar: true },
    component: () => import('@/views/user/UserProfileOther.vue'),
  },
  {
    path: '/video/:id',
    name: 'VideoDetail',
    meta: { requiresAuth: true, showNavBar: true }, 
    component: () => import('@/views/video/VideoDetail.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    meta: { showNavBar: false },  // 404页不显示
    component: () => import('@/views/not-found/NotFound.vue'),
  },
]

