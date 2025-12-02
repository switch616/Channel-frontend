<template>
  <el-dialog v-model="visible" title="修改密码" width="400px">
    <el-form :model="form" :rules="rules" ref="formRef">
      <el-form-item label="旧密码" prop="old_password">
        <el-input v-model="form.old_password" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="new_password">
        <el-input v-model="form.new_password" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirm_password">
        <el-input v-model="form.confirm_password" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ElMessageBox } from 'element-plus'
import { changePassword } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const visible = ref(false)
const form: Ref<{
  old_password: string
  new_password: string
  confirm_password: string
}> = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})
const formRef = ref<{ validate: (cb: (valid: boolean) => void) => void } | null>(null)
const rules = {
  old_password: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (rule, value) => value === form.value.new_password, message: '两次输入不一致', trigger: 'blur' }
  ]
}

const submit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return
    try {
      await changePassword({
        old_password: form.value.old_password,
        new_password: form.value.new_password
      })
      await ElMessageBox.alert('密码修改成功，请重新登录', '提示', { confirmButtonText: '确定' })
      visible.value = false
      form.value.old_password = ''
      form.value.new_password = ''
      form.value.confirm_password = ''
      // 清理本地缓存
      localStorage.clear()
      sessionStorage.clear()
      // 通知其他标签页强制登出
      localStorage.setItem('force_logout', Date.now())
      // 强制刷新页面再跳转到登录页
      window.location.href = '/login'
    } catch (e) {
      ElMessage.error(e?.response?.data?.detail || '密码修改失败')
    }
  })
}

defineExpose({ visible })
</script> 