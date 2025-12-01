<template>
  <el-carousel height="200px" :interval="5000" arrow="always">
    <el-carousel-item v-for="item in banners" :key="item.id">
      <img :src="item.image" class="banner-img" alt="banner" />
    </el-carousel-item>
  </el-carousel>
</template>

<script setup>
defineProps({
  banners: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}
</style>
