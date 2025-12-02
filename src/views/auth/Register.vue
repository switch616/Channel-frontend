<template>
  <div class="register-wrapper">
    <!-- 左侧项目信息区域 -->
    <div class="register-info">
      <img src="@/assets/auth_logo.png" alt="项目Logo" class="logo" />
      <h1 class="app-title">{{ appTitle }}</h1>
      <p class="app-description">
        {{ appDescription }}
      </p>
    </div>

    <!-- 右侧注册卡片 -->
    <el-card class="register-card" shadow="always">
      <h2 class="register-title">注册</h2>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" :prefix-icon="Message" />
        </el-form-item>

        <el-form-item label="验证码" prop="code">
          <div class="code-row">
            <el-input v-model="form.code" placeholder="请输入验证码" class="code-input" :prefix-icon="CircleCheck" />
            <el-button type="primary" :disabled="countdown > 0 || isSending" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="Message" />
        </el-form-item>

        <el-form-item label="电话号码" prop="phone_number">
          <el-input v-model="form.phone_number" placeholder="请输入电话号码" :prefix-icon="Message" />
        </el-form-item>

        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" :prefix-icon="Message" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入密码" type="password" show-password :prefix-icon="Lock" />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" placeholder="请再次输入密码" type="password" show-password
            :prefix-icon="Lock" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="register" style="width: 100%">注册</el-button>
        </el-form-item>
      </el-form>

      <div class="login-hint">
        已有账号？
        <router-link to="/login">前往登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Message, Lock, CircleCheck } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'  // 引入 Vue Router
import { extractErrorMessage } from '@/utils/errorHandler'
import { sendEmailCodeAPI, registerAPI } from '@/api/auth'

const router = useRouter()  // 使用 Vue Router
const appTitle = import.meta.env.VITE_APP_TITLE || 'YUN'
const appDescription = import.meta.env.VITE_APP_DESCRIPTION || 'YUN'

const form = reactive({
  email: '',
  username: '',
  phone_number: '', // 电话号码
  address: '', // 地址
  code: '',
  password: '',
  confirmPassword: '' // 
})

const countdown = ref(0)
const isSending = ref(false)
const formRef = ref()
let timer: any = null

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone_number: [
    { required: true, message: '请输入电话号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '电话号码格式不正确', trigger: 'blur' }  // 验证国内手机号格式
  ],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    {
      validator: (_rule: any, value: any) => {
        if (!value) {
          return Promise.reject('请再次输入密码')
        }
        if (value !== form.password) {
          return Promise.reject('两次密码不一致')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}

const sendCode = async () => {
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    ElMessage.warning('请输入合法邮箱')
    return
  }

  if (isSending.value || countdown.value > 0) return

  try {
    isSending.value = true
    const res = await sendEmailCodeAPI(form.email)

    // 目前该接口仍返回 { message }，如果后续也改为统一响应，可直接使用 res.msg / res.success
    if (res?.success === false) {
      ElMessage.error(res?.msg || '验证码发送失败')
      return
    }

    ElMessage.success(res?.msg || res?.msg || '验证码已发送')
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value === 0) clearInterval(timer)
    }, 1000)
  } catch (err) {
    ElMessage.error(extractErrorMessage(err))
  } finally {
    isSending.value = false
  }
}

const register = async () => {
  await formRef.value.validate(async (valid: any) => {
    if (!valid) return

    try {
      // 只提交后端需要的字段，避免多余字段导致校验失败
      const payload = {
        email: form.email,
        username: form.username,
        phone_number: form.phone_number,
        address: form.address,
        code: form.code,
        password: form.password
      }

      const res = await registerAPI(payload)

      // 新响应规范：{ code, msg, data, success, trace_id }
      if (!res?.success) {
        ElMessage.error(res?.msg || '注册失败')
        return
      }

      ElMessage.success(res?.msg || '注册成功')

      // 注册成功后延迟跳转到登录页面
      setTimeout(() => {
        router.push('/login')
      }, 2000)  // 2秒后跳转
    } catch (err) {
      ElMessage.error(extractErrorMessage(err))
    }
  })
}
</script>

<style scoped lang="scss">
@use "@/styles/user/auth.scss" as *;

.register-wrapper {
  @extend .container;
  justify-content: space-around;
  gap: 60px;
  height: 100vh;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 30px;
    height: auto;
    padding: 40px 20px;
  }
}

.register-info {
  color: white;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .logo {
    max-width: 300px;
    margin-bottom: 25px;
  }

  .app-title {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 16px;
    letter-spacing: 2px;
  }

  .app-description {
    font-size: 18px;
    line-height: 1.5;
    color: #d0d7e0;
  }
}

.register-card {
  @extend .card;
  width: 100%;
  max-width: 420px;
  padding: 40px 35px;
  border-radius: 12px;
}

.register-title {
  @extend .title;
  margin-bottom: 35px;
  font-size: 28px;
  letter-spacing: 1.2px;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;

  .code-input {
    flex: 1.5;
    min-width: 150px;
  }

  .el-button {
    flex-shrink: 0;
    width: 110px;
    height: 44px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
  }
}

.code-input {
  flex: 1;
  min-width: 120px;
  border-radius: 6px;
  height: 44px;
  font-size: 14px;
  box-sizing: border-box;
}

.el-button {
  width: 100%;
  height: 46px;
  font-weight: 600;
  font-size: 16px;
  border-radius: 8px;
}

.login-hint {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #718096;
}

.login-hint a {
  margin-left: 5px;
  color: #409eff;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.3s ease;
}

.login-hint a:hover {
  color: #2c7be5;
  text-decoration: underline;
}

@media (max-width: 420px) {
  .register-card {
    padding: 30px 20px;
  }

  .register-title {
    font-size: 24px;
  }

  .el-button {
    height: 42px;
    font-size: 14px;
  }
}
</style>