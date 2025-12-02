<template>
  <el-dialog v-model="visible" title="编辑个人资料" width="550px">
    <div class="avatar-edit-container">
      <el-upload
        class="avatar-uploader-centered"
        :action="uploadUrl"
        :show-file-list="false"
        :on-success="handleAvatarSuccess"
        :before-upload="beforeAvatarUpload"
        :headers="uploadHeaders"
      >
        <img v-if="form.profile_picture" :src="form.profile_picture" class="avatar-large" />
        <i v-else class="el-icon-plus avatar-uploader-icon-large"></i>
      </el-upload>
      <p class="avatar-tip">点击头像上传</p>
    </div>

    <el-form :model="form" label-width="80px" ref="formRef">
      <el-form-item label="用户名" prop="username" 
        :rules="[{ required: true, message: '用户名不能为空' }]">
        <el-input v-model="form.username" />
      </el-form-item>
      
      <!-- 新增性别选择 -->
      <el-form-item label="性别">
        <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
          <el-option label="其他" value="other" />
          <el-option label="未知" value="unknown" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="签名">
        <el-input type="textarea" v-model="form.bio" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="submitting">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { updateUserProfileAPI } from '@/api/auth'

const emit = defineEmits<{
  (e: 'success'): void
}>()

// Store
const userStore = useUserStore()
const user = computed(() => userStore.user)
const token = computed(() => userStore.token)

// 基础 URL
const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
const uploadUrl = `${baseUrl}/user/upload-avatar`

// 表单引用
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null)

// 弹窗控制
const visible = ref(false)

// 提交状态
const submitting = ref(false)

// 表单数据
const form = reactive<{
  username: string
  gender: string
  bio: string
  profile_picture: string
}>({
  username: '',
  gender: 'male', // 默认值设为男
  bio: '',
  profile_picture: '',
})

// 上传请求头
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${token.value || ''}`
}))

// 打开弹窗并初始化
const open = () => {
  form.username = user.value.username || ''
  form.gender = user.value.gender || 'male' // 从用户信息获取性别，默认为男
  form.bio = user.value.bio || ''
  form.profile_picture = getFullAvatarUrl(user.value?.profile_picture)
  visible.value = true
}

// 获取完整头像URL
const getFullAvatarUrl = (path?: string | null) => {
  if (!path) return `${baseUrl}/media/avatars/default.png`
  return /^https?:\/\//.test(path) ? path : `${baseUrl}/${path.replace(/^\/+/, '')}`
}

// 上传成功处理
const handleAvatarSuccess = (response: any) => {
  const url = response.url || response.data?.url
  if (!url) return ElMessage.error('上传失败')

  const fullUrl = /^https?:\/\//.test(url) ? url : `${baseUrl}/${url.replace(/^\/+/, '')}`
  form.profile_picture = fullUrl
  
  // 立即更新用户store中的头像
  userStore.setUser({ 
    ...userStore.user, 
    profile_picture: url // 使用原始URL，因为avatarUrl计算属性会处理完整URL
  })
  
  ElMessage.success('头像上传成功')
}

// 上传前校验
const beforeAvatarUpload = (file: File) => {
  const isImage = ['image/jpeg', 'image/png'].includes(file.type)
  const isSizeOk = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG 图片')
    return false
  }
  if (!isSizeOk) {
    ElMessage.error('图片不能超过 2MB')
    return false
  }

  return true
}

// 保存提交
const handleSave = async () => {
  try {
    const valid = await formRef.value!.validate()
    if (!valid) return

    submitting.value = true

    const res = await updateUserProfileAPI({
      username: form.username,
      gender: form.gender, // 新增性别字段
      bio: form.bio,
    })

    if (res?.code === 0) {
      ElMessage.success('资料已更新')
      visible.value = false
      userStore.setUser({
        ...userStore.user,
        username: form.username,
        gender: form.gender, // 更新store中的性别
        bio: form.bio,
      })
      emit('success')
    } else {
      ElMessage.error(res?.message || '更新失败')
    }
  } catch (err) {
    ElMessage.error('网络错误或服务异常')
    console.error(err)
  } finally {
    submitting.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  open,
})
</script>

<style scoped>
.avatar-edit-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.avatar-uploader-centered {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.avatar-uploader-icon-large {
  font-size: 32px;
  color: #8c939d;
  line-height: 100px;
  text-align: center;
}

.avatar-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>