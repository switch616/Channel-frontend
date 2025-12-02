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
    <el-tab-pane label="观看历史" name="history">
      <slot name="history" />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue'

type TabName = 'videos' | 'likes' | 'favorites' | 'history'

const props = defineProps({
  modelValue: {
    type: String as PropType<TabName>,
    default: 'videos',
  },
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: TabName): void
}>()

const internalTab = ref<TabName>(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    internalTab.value = val
  }
)

const onTabClick = (tab: { paneName: TabName }) => {
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
