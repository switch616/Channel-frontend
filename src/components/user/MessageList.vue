<template>
  <div class="message-list">
    <el-empty v-if="!messages.length" description="暂无消息通知" />
    <el-timeline v-else>
      <el-timeline-item
        v-for="(msg, index) in messages"
        :key="index"
        :timestamp="msg.time"
        placement="top"
      >
        <p class="content">{{ msg.content }}</p>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">

interface MessageItem {
  time: string
  content: string
  [key: string]: unknown
}

defineProps<{
  messages: MessageItem[]
}>()
</script>

<style scoped>
.message-list {
  padding: 10px 20px;
  max-height: 600px;
  overflow-y: auto;
}
.content {
  color: #333;
}
</style>
