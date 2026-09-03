<template>
  <a-modal
    v-model:open="visible"
    :title="step === 'confirm' ? '重置密码' : '设置新密码'"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <template v-if="step === 'confirm'">
      <p class="modal-message">重置后当前密码作废，是否继续？</p>
    </template>

    <template v-else>
      <p class="modal-hint">
        系统将自动生成 32 位临时密码（含大小写字母、数字与特殊字符 !-_），请告知用户并尽快修改。
      </p>
      <a-input-group compact class="password-group">
        <a-input
          v-model:value="newPassword"
          readonly
          class="password-input"
          :maxlength="64"
        />
        <a-button @click="regeneratePassword">重新生成</a-button>
      </a-input-group>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { resetUserPassword } from '@/api/user'
import type { SystemUser } from '@/types/user'
import { generateInitialPassword, isStrongSystemPassword } from '@/utils/passwordGenerator'

const props = defineProps<{
  user: SystemUser
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const step = ref<'confirm' | 'password'>('confirm')
const newPassword = ref('')
const submitting = ref(false)

/** 重新生成临时密码 */
function regeneratePassword() {
  newPassword.value = generateInitialPassword()
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      step.value = 'confirm'
      newPassword.value = ''
    }
  },
)

/** 关闭弹窗 */
function handleCancel() {
  visible.value = false
}

/** 两步确认：先确认意图，再提交新密码 */
async function handleOk() {
  if (step.value === 'confirm') {
    newPassword.value = generateInitialPassword()
    step.value = 'password'
    return Promise.reject()
  }

  if (!newPassword.value) {
    message.warning('请生成临时密码')
    return Promise.reject()
  }
  if (!isStrongSystemPassword(newPassword.value)) {
    message.warning('临时密码不符合规则，请点击重新生成')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await resetUserPassword({
      userId: props.user.userId,
      username: props.user.username,
      newPassword: newPassword.value,
    })
    message.success('重置成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-message,
.modal-hint {
  margin: 0 0 12px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.6;
}

.password-group {
  display: flex;
  width: 100%;
}

.password-input {
  flex: 1;
}
</style>
