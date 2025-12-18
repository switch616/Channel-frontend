import { VideoCamera, Star, User } from "@element-plus/icons-vue";
import type { Component } from "vue";

interface MenuItem {
  name: string;
  title: string;
  icon: Component;
}

export const sidebarMenu: MenuItem[] = [
  {
    name: "Jingxuan",
    title: "精选",
    icon: Star,
  },
  {
    name: "ShuaShipin",
    title: "刷视频",
    icon: VideoCamera,
  },
  {
    name: "UserCenter",
    title: "我的",
    icon: User,
  },
];
