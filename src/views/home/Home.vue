<template>
  <div class="home-layout">
    <aside class="sidebar">
      <ul class="sidebar-menu">
        <li v-for="item in menuList" :key="item.name" :class="{active: isActive(item.name)}" @click="goSection(item.name)">
          <component :is="item.icon" class="sidebar-icon" />
          <span>{{ item.title }}</span>
        </li>
      </ul>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { sidebarMenu } from './sidebarMenu'

const menuList = sidebarMenu

const router = useRouter()
const route = useRoute()

const goSection = (name: string) => {
  router.push({ name })
}
const isActive = (name: string) => route.name === name
</script>

<style scoped>
.home-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}
.sidebar {
  width: 162px; /* 180*0.9 */
  background: #fff;
  border-right: 1px solid #eee;
  padding: 28.8px 0 0 0; /* 32*0.9 */
  box-shadow: 1.8px 0 7.2px 0 rgba(0,0,0,0.03); /* 2,8*0.9 */
  /* position: fixed; */
  /* top: 64px; */
  /* left: 0; */
  /* height: calc(100vh - 64px); */
  z-index: 999;
  display: flex;
  flex-direction: column;
}
.sidebar-menu {
  list-style: none;
  padding: 0 0 0 21.6px; /* 24*0.9 */
  margin: 0;
  user-select: none;
}
.sidebar-menu li {
  display: flex;
  align-items: center;
  gap: 7.2px; /* 8*0.9 */
  padding: 9px 0 9px 7.2px; /* 10,8*0.9 */
  cursor: pointer;
  color: #666;
  font-size: 13.5px; /* 15*0.9 */
  border-radius: 7.2px; /* 8*0.9 */
  margin-bottom: 7.2px; /* 8*0.9 */
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.sidebar-menu li.active,
.sidebar-menu li:hover {
  background: #eaf3ff;
  color: #409eff;
  box-shadow: 0 1.8px 7.2px rgba(64,158,255,0.08); /* 2,8*0.9 */
}
.sidebar-icon {
  width: 12.6px; /* 14*0.9 */
  height: 12.6px;
  font-size: 12.6px;
  margin-right: 1.8px; /* 2*0.9 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.main-content {
  flex: 1;
  padding: 0 0 0 0;
  min-width: 0;
  /* margin-left: 180px; */
  display: flex;
  flex-direction: column;
}
</style> 