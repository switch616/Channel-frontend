<template>
  <NavBar v-if="showNavBar" />
  <router-view />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import NavBar from '@/components/layout/NavBar.vue'

const route = useRoute()

// 根据当前路由的 meta 判断是否显示 NavBar
const showNavBar = computed(() => route.meta.showNavBar === true)
</script>

<style>

</style>
