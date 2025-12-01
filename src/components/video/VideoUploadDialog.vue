<template>
  <el-dialog v-model="visible" title="上传视频" width="700px">
    <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
      <el-form-item label="视频标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入视频标题" />
      </el-form-item>

      <el-form-item label="视频描述" prop="description">
        <el-input type="textarea" v-model="form.description" placeholder="请输入视频描述" :rows="4" />
      </el-form-item>

      <el-form-item label="视频文件" prop="video">
        <el-upload ref="uploadRef" class="video-uploader" :show-file-list="true" :file-list="fileList"
          :auto-upload="false" :on-change="handleChange" :before-upload="beforeVideoUpload">
          <el-button type="primary" :loading="uploading">
            {{ uploading ? `上传中 ${uploadProgress}%` : '点击上传' }}
          </el-button>
          <template #tip>
            <div class="el-upload__tip">支持 MP4、WebM、MOV 格式，最大 100MB。</div>
          </template>
        </el-upload>
        <video v-if="form.videoUrl" :src="form.videoUrl" controls class="video-preview"></video>
      </el-form-item>

      <el-form-item label="预览图" prop="cover">
        <el-upload class="cover-uploader" :show-file-list="false" :auto-upload="false"
          :before-upload="beforeCoverUpload" :on-change="handleCoverChange">
          <img v-if="form.coverUrl" :src="form.coverUrl" class="cover-preview" />
          <el-button v-else type="primary">上传预览图</el-button>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const emit = defineEmits(['success', 'cancel'])

const userStore = useUserStore()
const token = computed(() => userStore.token)

const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
const uploadUrl = `${baseUrl}/video/upload_video`

const visible = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const submitting = ref(false)

const fileList = ref([])

const form = reactive({
  title: '',
  description: '',
  videoUrl: '',
  videoFile: null,
  video: false,
  coverUrl: '',
  coverFile: null,
  cover: false,
})

const rules = reactive({
  title: [
    { required: true, message: '请输入视频标题', trigger: 'blur' },
    { max: 50, message: '标题不能超过 50 字符', trigger: 'blur' },
  ],
  description: [{ required: true, message: '请输入视频描述', trigger: 'blur' }],
  video: [{ required: true, message: '请上传视频文件', trigger: 'change' }],
  cover: [{ required: true, message: '请上传视频预览图', trigger: 'change' }],
})

const open = () => {
  visible.value = true
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    title: '',
    description: '',
    videoUrl: '',
    videoFile: null,
    video: false,
    coverUrl: '',
    coverFile: null,
    cover: false,
  })
  uploadProgress.value = 0
  uploading.value = false
  submitting.value = false
  fileList.value = []
  uploadRef.value?.clearFiles()
}

const getFilenameWithoutExtension = (filename) =>
  filename.replace(/\.[^/.]+$/, '')

const getFileType = (file) => file?.raw?.type || file?.type || ''

const beforeVideoUpload = (file) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
  const isVideo = allowedTypes.includes(getFileType(file))
  const isSizeOk = file.size / 1024 / 1024 < 100

  if (!isVideo) {
    ElMessage.error('仅支持 MP4、WebM、MOV 格式视频')
    return false
  }
  if (!isSizeOk) {
    ElMessage.error('视频大小不能超过 100MB')
    return false
  }
  return true
}

const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isSizeOk = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('请上传图片格式的预览图')
    return false
  }
  if (!isSizeOk) {
    ElMessage.error('预览图大小不能超过 5MB')
    return false
  }
  return true
}

const handleCoverChange = (file) => {
  const raw = file.raw || file
  form.coverFile = raw
  form.coverUrl = URL.createObjectURL(raw)
  form.cover = true
}

const handleChange = async (file, newFileList) => {
  fileList.value = [newFileList[newFileList.length - 1]]

  if (form.videoFile) {
    try {
      await ElMessageBox.confirm('已存在视频文件，是否替换？', '替换确认', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      fileList.value = []
      return
    }
  }

  replaceVideo(file)
}

const replaceVideo = (file) => {
  if (!beforeVideoUpload(file)) {
    fileList.value = []
    return
  }

  const rawFile = file.raw || file
  form.videoFile = rawFile
  form.videoUrl = URL.createObjectURL(rawFile)
  form.title = getFilenameWithoutExtension(rawFile.name)
  form.video = true

  // 自动生成封面图
  generateCoverFromVideo(form.videoUrl)
}

const generateCoverFromVideo = (videoUrl) => {
  const video = document.createElement('video')
  video.src = videoUrl
  video.crossOrigin = 'anonymous'
  video.muted = true
  video.currentTime = 0.1

  video.addEventListener('loadeddata', () => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        form.coverFile = new File([blob], 'cover.png', { type: 'image/png' })
        form.coverUrl = URL.createObjectURL(blob)
        form.cover = true
      }
    }, 'image/png')
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (!form.videoFile || !form.coverFile) {
    ElMessage.error('请上传视频和预览图')
    return
  }

  uploading.value = true
  submitting.value = true
  uploadProgress.value = 0

  try {
    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('description', form.description)
    payload.append('video', form.videoFile)
    payload.append('cover', form.coverFile)

    const res = await axios.post(uploadUrl, payload, {
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (e) => {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100)
      },
    })

    // 统一响应结构：后端返回 ResponseSchema => { code, msg, data: { url }, success }
    const body = res?.data

    if (!body?.success) {
      throw new Error(body?.msg || '上传失败')
    }

    const url = body?.data?.url
    if (!url) {
      throw new Error('上传成功但未返回视频地址')
    }

    form.videoUrl = /^https?:\/\//.test(url)
      ? url
      : `${baseUrl}/${url.replace(/^\/+/, '')}`

    ElMessage.success('视频上传成功')
    visible.value = false
    emit('success', body.data)
  } catch (error) {
    const msg =
      error?.response?.data?.msg ||
      error?.response?.data?.detail ||
      error?.message ||
      '上传失败'
    ElMessage.error(msg)
  } finally {
    uploading.value = false
    submitting.value = false
  }
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

defineExpose({ open, resetForm })
</script>

<style scoped>
.video-uploader {
  width: 100%;
}
.video-preview {
  width: 100%;
  max-height: 300px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #f5f7fa;
}
.cover-preview {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}
</style>
