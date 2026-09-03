<template>
  <div class="login-page diffuse-gradient-page">
    <a-card class="login-card" :bordered="false">
      <div class="login-logo">
        <h2>动力学仿真软件代码自主率与开源风险检测工具</h2>
        <p>简称SCA平台</p>
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

        <a-form-item v-if="!departmentLoadFailed" name="departmentId" label="部门">
          <AsyncOptionsSelect
            ref="departmentSelectRef"
            v-model="registerForm.departmentId"
            size="large"
            placeholder="请选择部门"
            select-class="login-select-full"
            :load-options="loadRegisterDepartmentOptions"
          />
        </a-form-item>

        <!-- 部门列表拉取失败时降级为手填，保证注册流程不被阻断 -->
        <a-form-item
          v-else
          name="departmentName"
          label="部门"
          extra="部门列表暂时获取不到，请手动填写部门名称"
        >
          <a-input
            v-model:value="registerForm.departmentName"
            size="large"
            placeholder="请输入部门名称，如：研发部"
            allow-clear
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
import { nextTick, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { useAuthStore } from '@/stores/auth'
import { login, checkUsernameAvailable, register } from '@/api/auth'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import type { SelectOption } from '@/types/common'
import { getRememberMePreference } from '@/utils/tokenStorage'
import { loadEnabledDepartmentSelectOptions } from '@/utils/remoteSelectLoaders'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

type PageMode = 'login' | 'register'
const mode = ref<PageMode>('login')

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(getRememberMePreference())

const departmentSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

const loginForm = reactive({ username: '', password: '' })

const loginRules: Record<string, Rule[]> = {
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
    try {
      // 登录响应可能不带页面权限，立即通过 /auth/me 获取 permission，避免首次进入时侧栏显示全量菜单
      await authStore.fetchUserInfo()
    } catch {
      message.warning('登录成功，但用户权限加载失败，请刷新重试')
    }
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
  /** 部门下拉不可用时手填的部门名称 */
  departmentName: '',
  password: '',
  confirmPassword: '',
})

/** 部门下拉是否已确认拉不到（拉到过一次就不再降级） */
const departmentLoadFailed = ref(false)

/**
 * 注册页部门下拉数据源。
 * 公共目录服务暂时不可用时降级为手工录入，保证注册流程具备容灾能力。
 */
async function loadRegisterDepartmentOptions(): Promise<SelectOption[]> {
  try {
    return await loadEnabledDepartmentSelectOptions(true)
  } catch {
    departmentLoadFailed.value = true
    return []
  }
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

const registerRules: Record<string, Rule[]> = {
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
  departmentName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: checkPasswordStrength, trigger: 'change' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: checkConfirmPassword, trigger: 'change' },
  ],
}

/**
 * 提交注册信息
 * 接口收的是部门名称而非 ID：下拉可用时取选中项 label，降级手填时取输入框内容
 */
async function handleRegister() {
  let departmentName: string | undefined

  if (departmentLoadFailed.value) {
    departmentName = registerForm.departmentName.trim()
    if (!departmentName) {
      message.warning('请输入部门名称')
      return
    }
  } else {
    if (!registerForm.departmentId) {
      message.warning('请选择部门')
      return
    }
    departmentName = departmentSelectRef.value?.getSelectedLabel()
    if (!departmentName) {
      message.warning('所选部门无效，请重新选择')
      return
    }
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

/** 切换登录/注册模式 */
function switchMode(target: PageMode) {
  mode.value = target
  if (target === 'login') {
    registerFormRef.value?.resetFields()
    departmentSelectRef.value?.resetOptions()
  } else {
    loginFormRef.value?.resetFields()
    // 进注册页就先探一次部门接口，拉不到时直接渲染手填输入框，不用等用户点开下拉
    void nextTick(() => departmentSelectRef.value?.prefetchOptions())
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 600px;
  max-width: 100%;
  box-shadow: 0 8px 32px rgba(22, 119, 255, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.92);
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

.login-select-full {
  width: 100%;
}
</style>
