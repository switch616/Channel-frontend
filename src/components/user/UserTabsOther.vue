<template>
  <el-tabs v-model="internalTab" class="user-tabs" @tab-click="onTabClick">
    <el-tab-pane label="作品" name="videos">
      <slot name="videos" />
    </el-tab-pane>
    <el-tab-pane label="点赞" name="likes">
      <slot name="likes" />
    </el-tab-pane>
    <el-tab-pane label="收藏" name="favorites">
      <slot name="favorites" />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'videos',
  },
})
const emit = defineEmits(['update:modelValue'])

const internalTab = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    internalTab.value = val
  }
)

const onTabClick = (tab:any) => {
  emit('update:modelValue', tab.paneName)
}
</script>

<style scoped>
.user-tabs {
  padding: 20px;
  margin-left: 50px;
  margin-right: 50px;
}
</style> 