<template>
  <div class="home-layout">
    <aside class="sidebar" :class="{ collapsed }">
      <!-- 中线收起 / 展开触发器 -->
      <div class="collapse-trigger" @click="toggleSidebar">
        <span class="arrow" :class="{ collapsed }"></span>
      </div>

      <ul class="sidebar-menu">
        <li
          v-for="item in menuList"
          :key="item.name"
          :class="{ active: isActive(item.name) }"
          @click="goSection(item.name)"
        >
          <component :is="item.icon" class="sidebar-icon" />
          <span v-if="!collapsed">{{ item.title }}</span>
        </li>
      </ul>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { sidebarMenu } from './sidebarMenu'

const menuList = sidebarMenu

const router = useRouter()
const route = useRoute()

/** 侧边栏是否收起（默认展开） */
const collapsed = ref(false)

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const goSection = (name: string) => {
  router.push({ name })
}

const isActive = (name: string) => route.name === name
</script>

<style scoped>
.home-layout {
  display: flex;
  height: calc(100vh - 60px);
  background: #f7f8fa; 
}

/* ================= sidebar ================= */
.sidebar {
  width: 162px;
  background: #ffffff;
  border-right: none; 
  padding-top: 28.8px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.03),
              2px 0 8px rgba(0,0,0,0.04); /* 更柔和 */
  z-index: 100;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.25s ease;
}


.sidebar.collapsed {
  width: 54px;
}

/* ===== 中线触发器 ===== */
.collapse-trigger {
  position: absolute;
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  width: 20px;
  height: 48px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-left: none;
  border-radius: 0 10px 10px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.collapse-trigger:hover {
  opacity: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* 箭头 */
.arrow {
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid #409eff;
  transition: transform 0.2s ease;
}

/* 收起态：箭头反向 */
.arrow.collapsed {
  transform: rotate(180deg);
}

/* ================= menu ================= */
.sidebar-menu {
  list-style: none;
  padding: 0 0 0 21.6px;
  margin: 0;
  user-select: none;
}

.sidebar.collapsed .sidebar-menu {
  padding-left: 10px;
}

.sidebar-menu li {
  display: flex;
  align-items: center;
  gap: 7.2px;
  padding: 9px 7.2px;
  cursor: pointer;
  color: #666;
  font-size: 13.5px;
  border-radius: 7.2px;
  margin-bottom: 7.2px;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}

.sidebar-menu li.active,
.sidebar-menu li:hover {
  background: #eef5ff;  
  color: #409eff;
  box-shadow: none;   
}


.sidebar-icon {
  width: 12.6px;
  height: 12.6px;
  font-size: 12.6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ================= main ================= */
.main-content {
  flex: 1;
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>
