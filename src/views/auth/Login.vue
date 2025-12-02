<template>
  <div class="login-wrapper">
    <!-- 左侧项目信息区域 -->
    <div class="login-info">
      <img src="@/assets/auth_logo.png" alt="项目Logo" class="logo" />
      <h1 class="app-title">{{ appTitle }}</h1>
      <p class="app-description">
        {{ appDescription }}
      </p>
    </div>

    <!-- 右侧登录卡片 -->
    <el-card class="login-card" shadow="always">
      <h2 class="login-title">登录</h2>
      <el-form :model="form" ref="formRef" label-width="80px">
        <el-form-item label="账号">
          <el-input v-model="form.email" placeholder="请输入账号或邮箱" :prefix-icon="Message" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input v-model="form.password" placeholder="请输入密码" type="password" show-password :prefix-icon="Lock" />
        </el-form-item>

        <el-form-item label="验证码">
          <div class="captcha-row">
            <el-input v-model="form.captcha_text" placeholder="请输入验证码" class="captcha-input"
              :prefix-icon="CircleCheck" />
            <img v-if="captchaImage" :src="captchaImage" class="captcha-img" @click="loadCaptcha" title="点击刷新验证码"
              loading="lazy" />
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.remember">记住密码</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submit" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-hint">
        没有账号？
        <router-link to="/register">前往注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { loginAPI, getImageAerificationCode } from '@/api/auth'
import { Message, Lock, CircleCheck } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { encryptData, decryptData } from '@/utils/auth'  // 引入加密解密函数
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()

const appTitle = import.meta.env.VITE_APP_TITLE || 'YUN'
const appDescription = import.meta.env.VITE_APP_DESCRIPTION || 'YUN'


const form = reactive({
  email: '',
  password: '',
  captcha_id: '',
  captcha_text: '',
  remember: false,
})

const captchaImage = ref('')
const formRef = ref()
const router = useRouter()

const loadCaptcha = async () => {
  try {
    const res:any = await getImageAerificationCode()
    
    // 验证码API直接返回 { captcha_id, image_base64 }，不是包装在统一响应格式中
    // 但如果后端改为统一格式，也兼容处理
    if (res?.success && res?.data) {
      // 统一响应格式：{ code, msg, data: { captcha_id, image_base64 }, success }
      form.captcha_id = res.data.captcha_id
      captchaImage.value = res.data.image_base64 || res.data.image || ''
    } else if (res?.captcha_id && res?.image_base64) {
      // 直接返回格式：{ captcha_id, image_base64 }
      form.captcha_id = res.captcha_id
      captchaImage.value = res.image_base64
    } else {
      ElMessage.error(res?.msg || '获取验证码失败')
    }
  } catch (error: any) {
    console.error('加载验证码失败:', error)
    ElMessage.error(error?.response?.data?.msg || error?.message || '获取验证码失败')
  }
}

// 读取本地存储的账号密码（记住密码），解密后加载
const loadRememberedAccount = () => {
  const remembered = localStorage.getItem('remembered_account')
  if (remembered) {
    const decryptedData = decryptData(remembered)
    if (decryptedData?.email && decryptedData?.password) {
      form.email = decryptedData.email
      form.password = decryptedData.password
      form.remember = true
    }
  }
}

const submit = async () => {
  try {
    const res = await loginAPI(form)

    // 新响应规范：{ code, msg, data, success, trace_id }
    if (!res?.success) {
      ElMessage.error(res?.msg || '登录失败')
      await loadCaptcha()
      form.captcha_text = ''
      return
    }

    const token = res.data?.access_token
    const expiresIn = res.data?.expires_in || 3600  // 默认过期时间为3600秒（1小时）

    if (!token) {
      ElMessage.error('登录响应异常：未获取到 Token')
      await loadCaptcha()
      form.captcha_text = ''
      return
    }

    // 存储 token 和过期时间（传递 remember 参数）
    userStore.setToken(token, expiresIn, form.remember)

    // 处理"记住密码"
    if (form.remember) {
      const encryptedData = encryptData({ email: form.email, password: form.password })
      localStorage.setItem('remembered_account', encryptedData)
    } else {
      localStorage.removeItem('remembered_account')
    }

    // 获取用户资料
    await userStore.fetchUserProfile()
    ElMessage.success(res?.msg || '登录成功')

    // 登录成功后跳转到首页（不需要刷新，因为状态已经在 store 中）
    router.push('/')
  } catch (err) {
    console.log(err)
    // HTTP 层面的错误交给 axios 拦截器，但这里兜底提示
    ElMessage.error(err?.response?.data?.msg || err?.response?.data?.detail || err?.message || '登录失败')
    await loadCaptcha()
    form.captcha_text = ''
  }
}


onMounted(() => {
  loadCaptcha()
  loadRememberedAccount()
})

</script>


<style scoped lang="scss">
@use "@/styles/user/auth.scss" as *;

.login-wrapper {
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

.login-info {
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

.login-card {
  @extend .card;
  width: 100%;
  max-width: 400px;
  padding: 40px 35px;
  border-radius: 12px;
}

.login-title {
  @extend .title;
  margin-bottom: 35px;
  font-size: 28px;
  letter-spacing: 1.2px;
}

.captcha-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.captcha-img {
  width: 110px;
  height: 38px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
  transition: transform 0.25s ease;
  object-fit: contain;
  border: 1px solid #cbd5e1;
}

.captcha-img:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.captcha-input {
  flex: 1;
  border-radius: 6px;
  height: 44px;
  font-size: 14px;
}

.el-checkbox {
  font-size: 14px;
  color: #4a5568;
  user-select: none;
}

.el-button {
  width: 100%;
  height: 46px;
  font-weight: 600;
  font-size: 16px;
  border-radius: 8px;
}

.register-hint {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #718096;
}

.register-hint a {
  margin-left: 5px;
  color: #409eff;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.3s ease;
}

.register-hint a:hover {
  color: #2c7be5;
  text-decoration: underline;
}

@media (max-width: 420px) {
  .login-card {
    padding: 30px 20px;
  }

  .login-title {
    font-size: 24px;
  }

  .el-button {
    height: 42px;
    font-size: 14px;
  }
}
</style>
