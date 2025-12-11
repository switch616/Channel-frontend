# 视频播放方案笔记（含关键代码）

## 1. 播放器选型与集成（Plyr）
- 组件：`src/components/video/VideoPlayer.vue`，封装 `vue-plyr`。
- 主要控件/设置：播放、进度、时间、音量、字幕、设置、画中画、全屏；质量 1080/720，倍速 0.5-2。
- 播放上报防抖：
```19:31:src/components/video/VideoPlayer.vue
const hasReported = ref(false)
const onPlay = async () => {
  if (!hasReported.value && props.videoId) {
    await logVideoView({ video_id: props.videoId })
    hasReported.value = true
  }
}
```
- 预加载：`preload="metadata"`，减小首帧黑屏概率。

## 2. 固定画布 & 适配不同分辨率
- 父容器固定画布（最大 900x500，9/5 比例）：
```720:733:src/views/video/VideoDetail.vue
.video-section-inner {
  max-width: 900px;
  height: 500px;
  max-height: 500px;
  aspect-ratio: 9 / 5;
  border-radius: 20px;
  overflow: hidden;
}
```
- 视频等比缩放（不拉伸，不裁剪）：
```80:86:src/components/video/VideoPlayer.vue
::v-deep(video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```
- 模糊背景取封面图（页面层）：
```728:749:src/views/video/VideoDetail.vue
.video-blur-bg {
  background-image: url(cover_image);
  filter: blur(40px) brightness(0.88) saturate(1.15);
  transform: scale(1.1);
}
```

## 3. 播放瞬间防抖/防黑屏
- 问题：Plyr 在 poster→首帧间会以默认黑色填充，出现闪黑。
- 解决：增加模糊海报覆盖层，直到 `canplay` 后再移除，同时强制 Plyr 全链路透明。
```1:24:src/components/video/VideoPlayer.vue
<div class="plyr-host">
  <div v-if="poster && showPosterOverlay" class="poster-overlay"
       :style="{ backgroundImage: `url(${poster})` }"></div>
  <vue-plyr :options="plyrOptions">
    <video :poster="poster" preload="metadata"
           @play="onPlay" @canplay="onCanPlay">...</video>
  </vue-plyr>
</div>

const showPosterOverlay = ref(true)
const onCanPlay = () => { showPosterOverlay.value = false }
```
```64:85:src/components/video/VideoPlayer.vue
.poster-overlay {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  filter: blur(28px) brightness(0.9) saturate(1.1);
  transform: scale(1.05); z-index: 1;
}
::v-deep(.plyr) { background: transparent; z-index: 2; }
::v-deep(.plyr__video-wrapper), ::v-deep(video),
::v-deep(.plyr--video) { background: transparent !important; }
```

## 4. 其他注意点 / 排查建议
- 封面缺失：overlay 会隐藏，背景透明；可配置默认占位封面。
- 若仍偶发闪烁：可延迟隐藏 overlay（如 `setTimeout(hide, 50~150ms)`）或把 `preload` 改为 `auto`（流量更高）。
- 控件不被压缩：画布固定，视频缩放；控件渲染在画布尺寸，不随视频缩放变形。
- 样式穿透：使用 `::v-deep` 作用于 Plyr 内部，保证透明背景和尺寸。
- 响应式：父容器 `max-width: 900px; max-height: 500px; margin: 0 auto;`，小屏自动等比缩放。

## 5. 相关文件
- 组件：`src/components/video/VideoPlayer.vue`
- 页面：`src/views/video/VideoDetail.vue`


