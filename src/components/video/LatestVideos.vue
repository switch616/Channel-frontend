<template>
  <VideoGrid 
    :videos="videoList" 
    :loading="loading"
    :finished="finished"
    @load-more="loadVideos"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VideoGrid from './VideoGrid.vue'
import { getLatestVideos } from '@/api/video'

const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')

const videoList = ref([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = 16
const total = ref(0)

const loadVideos = async () => {
  if (loading.value || finished.value) return
  loading.value = true
  try {
    const res = await getLatestVideos({ page: page.value, size: pageSize })
    const data = res.data || {}
    const mappedVideos = (data.items || []).map(item => ({
      id: item.id,
      title: item.title,
      user: item.uploader_username,
      cover_image: /^https?:\/\//.test(item.cover_image)
        ? item.cover_image
        : `${baseUrl}/${item.cover_image?.replace(/^\/+/, '') || ''}`,
      videoUrl: /^https?:\/\//.test(item.file_path)
        ? item.file_path
        : `${baseUrl}/${item.file_path?.replace(/^\/+/, '') || ''}`,
      duration: item.duration,
      like_count: item.like_count,
    }))
    videoList.value.push(...mappedVideos)
    total.value = data.total || 0
    if (videoList.value.length >= total.value) {
      finished.value = true
    } else {
      page.value++
    }
  } catch (err) {
    console.error('加载最新视频失败:', err.message)
  } finally {
    loading.value = false
  }
}

onMounted(loadVideos)
</script> 