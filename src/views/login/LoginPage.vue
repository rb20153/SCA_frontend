<template>
  <div class="login-page">
    <a-card class="login-card" :bordered="false">
      <div class="login-logo">
        <h2>SCA 检测平台</h2>
        <p>动力学仿真软件代码自主率与开源风险检测系统</p>
      </div>

      <!-- ── Login Form ──────────────────────────────────────────── -->
      <a-form
        v-if="mode === 'login'"
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        layout="vertical"
        @finish="handleLogin"
      >
        <a-form-item name="username" label="用户名">
          <a-input
            v-model:value="loginForm.username"
            size="large"
            placeholder="请输入用户名"
            allow-clear
            autocomplete="username"
          />
        </a-form-item>

        <a-form-item name="password" label="密码">
          <a-input-password
            v-model:value="loginForm.password"
            size="large"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </a-form-item>

        <div class="login-extras">
          <a-checkbox v-model:checked="rememberMe">记住我</a-checkbox>
          <span class="forgot-hint">忘记密码请联系管理员重置</span>
        </div>

        <a-form-item style="margin-bottom: 0">
          <a-button type="primary" html-type="submit" size="large" block :loading="loading">
            登 录
          </a-button>
        </a-form-item>
      </a-form>

      <!-- ── Register Form ───────────────────────────────────────── -->
      <a-form
        v-else
        :model="registerForm"
        :rules="registerRules"
        ref="registerFormRef"
        layout="vertical"
        @finish="handleRegister"
      >
        <a-form-item name="username" label="用户名">
          <a-input
            v-model:value="registerForm.username"
            size="large"
            placeholder="4-20位字母或数字"
            allow-clear
            autocomplete="username"
          />
        </a-form-item>

        <a-form-item name="realName" label="真实姓名">
          <a-input
            v-model:value="registerForm.realName"
            size="large"
            placeholder="请输入真实姓名"
            allow-clear
          />
        </a-form-item>

        <a-form-item name="phone" label="手机号">
          <a-input
            v-model:value="registerForm.phone"
            size="large"
            placeholder="请输入手机号"
            allow-clear
            autocomplete="tel"
          />
        </a-form-item>

        <a-form-item name="departmentId" label="部门">
          <a-select
            v-model:value="registerForm.departmentId"
            size="large"
            placeholder="请选择部门"
            :options="departmentSelectOptions"
            :loading="departmentLoading"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>

        <a-form-item name="password" label="密码">
          <a-input-password
            v-model:value="registerForm.password"
            size="large"
            placeholder="至少8位，包含字母和数字"
            autocomplete="new-password"
          />
        </a-form-item>

        <a-form-item name="confirmPassword" label="确认密码">
          <a-input-password
            v-model:value="registerForm.confirmPassword"
            size="large"
            placeholder="再次输入密码"
            autocomplete="new-password"
          />
        </a-form-item>

        <a-form-item style="margin-bottom: 0">
          <a-button type="primary" html-type="submit" size="large" block :loading="loading">
            注 册
          </a-button>
        </a-form-item>
      </a-form>

      <!-- ── Mode switch link ────────────────────────────────────── -->
      <div class="login-footer">
        <template v-if="mode === 'login'">
          还没有账号？
          <a class="switch-link" @click="switchMode('register')">立即注册</a>
        </template>
        <template v-else>
          已有账号？
          <a class="switch-link" @click="switchMode('login')">去登录</a>
        </template>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { login, checkUsernameAvailable, register } from '@/api/auth'
import { getEnabledDepartmentOptions } from '@/api/user'
import type { DepartmentOption } from '@/types/user'
import { getRememberMePreference } from '@/utils/tokenStorage'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

type PageMode = 'login' | 'register'
const mode = ref<PageMode>('login')

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(getRememberMePreference())

const departmentOptions = ref<DepartmentOption[]>([])
const departmentLoading = ref(false)

const departmentSelectOptions = computed(() =>
  departmentOptions.value.map((item) => ({
    label: item.departmentName,
    value: item.departmentId,
  })),
)

const loginForm = reactive({ username: '', password: '' })

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

/** 提交登录，按记住我选择 token 存储策略 */
async function handleLogin() {
  loading.value = true
  try {
    const res = await login({ username: loginForm.username, password: loginForm.password })
    authStore.setToken(res.data.token, rememberMe.value)
    authStore.setUserInfo(res.data.userInfo)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } finally {
    loading.value = false
  }
}

const registerForm = reactive({
  username: '',
  realName: '',
  phone: '',
  departmentId: undefined as string | undefined,
  password: '',
  confirmPassword: '',
})

/** 拉取启用状态的部门下拉（注册页打开时调用，无需登录） */
async function loadDepartmentOptions() {
  if (departmentOptions.value.length > 0) return
  departmentLoading.value = true
  try {
    const res = await getEnabledDepartmentOptions()
    departmentOptions.value = res.data
  } finally {
    departmentLoading.value = false
  }
}

/** 根据选中的部门 ID 解析部门名称，供注册接口提交 */
function resolveDepartmentName(departmentId: string): string | null {
  const matched = departmentOptions.value.find((item) => item.departmentId === departmentId)
  return matched?.departmentName ?? null
}

async function checkUsernameExists(_rule: unknown, value: string) {
  if (!value || value.length < 4) return Promise.resolve()
  const res = await checkUsernameAvailable(value)
  if (!res.data.available) {
    return Promise.reject(new Error('该用户名已被注册，请换一个'))
  }
  return Promise.resolve()
}

function checkPasswordStrength(_rule: unknown, value: string) {
  if (!value) return Promise.resolve()
  if (value.length < 8) return Promise.reject(new Error('密码至少8位'))
  if (!/[a-zA-Z]/.test(value)) return Promise.reject(new Error('密码需包含字母'))
  if (!/\d/.test(value)) return Promise.reject(new Error('密码需包含数字'))
  return Promise.resolve()
}

function checkConfirmPassword(_rule: unknown, value: string) {
  if (value !== registerForm.password) {
    return Promise.reject(new Error('两次输入的密码不一致'))
  }
  return Promise.resolve()
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9]{4,20}$/,
      message: '用户名为4-20位字母或数字',
      trigger: 'blur',
    },
    { validator: checkUsernameExists, trigger: 'blur' },
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度为2-20个字符', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur',
    },
  ],
  departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: checkPasswordStrength, trigger: 'change' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: checkConfirmPassword, trigger: 'change' },
  ],
}

/** 提交注册信息，部门名称由下拉选项解析后传给接口 */
async function handleRegister() {
  const departmentId = registerForm.departmentId
  if (!departmentId) {
    message.warning('请选择部门')
    return
  }
  const departmentName = resolveDepartmentName(departmentId)
  if (!departmentName) {
    message.warning('所选部门无效，请重新选择')
    return
  }

  loading.value = true
  try {
    await register({
      username: registerForm.username,
      realName: registerForm.realName,
      phone: registerForm.phone,
      department: departmentName,
      password: registerForm.password,
    })
    message.success('注册成功，请登录')
    loginForm.username = registerForm.username
    loginForm.password = ''
    switchMode('login')
  } finally {
    loading.value = false
  }
}

/** 切换登录/注册模式，进入注册时拉取部门下拉 */
function switchMode(target: PageMode) {
  mode.value = target
  if (target === 'login') {
    registerFormRef.value?.resetFields()
  } else {
    loginFormRef.value?.resetFields()
    loadDepartmentOptions()
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 420px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.login-logo {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1677ff;
  margin-bottom: 4px;
}

.login-logo p {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.login-extras {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.forgot-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.switch-link {
  color: #1677ff;
  cursor: pointer;
}

.switch-link:hover {
  text-decoration: underline;
}
</style>
