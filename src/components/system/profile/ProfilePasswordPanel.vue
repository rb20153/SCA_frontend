<template>
  <div class="profile-panel">
    <p class="password-hint">
      密码至少 8 位，须包含大小写字母与数字；修改成功后需重新登录。
    </p>

    <form class="password-form" autocomplete="off" @submit.prevent="handleSubmit">
      <!-- 干扰浏览器自动填充的隐藏域 -->
      <input type="text" class="autofill-trap" tabindex="-1" autocomplete="username" aria-hidden="true" />
      <input type="password" class="autofill-trap" tabindex="-1" autocomplete="new-password" aria-hidden="true" />

      <div class="profile-form-row">
        <label>旧密码</label>
        <div class="profile-form-control">
          <a-input-password
            v-model:value="form.oldPassword"
            placeholder="请输入旧密码"
            autocomplete="off"
            name="sca-profile-old-pwd"
            :readonly="oldPasswordReadonly"
            @focus="oldPasswordReadonly = false"
          />
        </div>
      </div>

      <div class="profile-form-row">
        <label>新密码</label>
        <div class="profile-form-control">
          <a-input-password
            v-model:value="form.newPassword"
            placeholder="请输入新密码"
            autocomplete="new-password"
            name="sca-profile-new-pwd"
          />
        </div>
      </div>

      <div class="profile-form-row">
        <label>确认密码</label>
        <div class="profile-form-control">
          <a-input-password
            v-model:value="form.confirmPassword"
            placeholder="请再次输入新密码"
            autocomplete="new-password"
            name="sca-profile-confirm-pwd"
          />
        </div>
      </div>

      <div class="profile-actions">
        <a-button type="primary" html-type="submit" :loading="submitting">
          更新密码
        </a-button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { changeUserPassword } from '@/api/profile'
import { useAuthStore } from '@/stores/auth'
import { isValidProfilePassword } from '@/utils/profileDisplay'

const router = useRouter()
const authStore = useAuthStore()

const submitting = ref(false)
/** 初始 readonly，聚焦时再输入，降低浏览器自动填充旧密码概率 */
const oldPasswordReadonly = ref(true)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

/** 清空密码表单 */
function resetForm() {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  oldPasswordReadonly.value = true
}

/** 校验并提交密码修改，成功后退出登录 */
async function handleSubmit() {
  if (!form.oldPassword) {
    message.warning('请输入旧密码')
    return
  }
  if (!isValidProfilePassword(form.newPassword)) {
    message.warning('新密码至少 8 位，须包含大小写字母与数字')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    message.warning('两次输入的新密码不一致')
    return
  }

  submitting.value = true
  try {
    await changeUserPassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    })
    message.success('密码已修改，请重新登录')
    resetForm()
    authStore.logout()
    await router.push('/login')
  } catch (error) {
    const msg = error instanceof Error ? error.message : '修改密码失败'
    message.error(msg)
  } finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  resetForm()
})
</script>

<style scoped>
.profile-panel {
  max-width: 560px;
}

.password-hint {
  margin: 0 0 24px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.password-form {
  position: relative;
}

.autofill-trap {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.profile-form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
}

.profile-form-row > label {
  width: 88px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 16px;
  padding-top: 6px;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
}

.profile-form-control {
  flex: 1;
  min-width: 0;
  max-width: 360px;
}

.profile-actions {
  padding-left: 88px;
}
</style>
