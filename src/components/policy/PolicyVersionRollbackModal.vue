<template>
  <a-modal
    v-model:open="visible"
    title="回滚策略版本"
    ok-text="确认"
    cancel-text="取消"
    width="520px"
    destroy-on-close
    :confirm-loading="submitting"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <p class="rollback-hint">
      回滚将使历史版本重新生效，并写入审计日志，是否继续？
    </p>

    <a-form layout="vertical" class="rollback-form">
      <a-form-item label="输入版本号确认" required>
        <a-input
          v-model:value="confirmVersionNo"
          :placeholder="version ? version.versionNo : '如 v2.2.0'"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { rollbackPolicyVersion } from '@/api/policy'
import type { PolicyVersionListItem } from '@/types/policy'

const props = defineProps<{
  /** 策略 ID */
  policyId: string
  /** 要回滚的历史版本行 */
  version: PolicyVersionListItem | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const confirmVersionNo = ref('')

/** 关闭弹窗时清空确认输入 */
function resetForm() {
  confirmVersionNo.value = ''
}

/** 校验版本号并提交回滚请求 */
async function handleOk() {
  if (!props.version) {
    return Promise.reject()
  }

  const trimmed = confirmVersionNo.value.trim()
  if (!trimmed) {
    message.warning('请输入版本号确认')
    return Promise.reject()
  }

  if (trimmed !== props.version.versionNo.trim()) {
    message.warning(`请输入当前历史版本号 ${props.version.versionNo}`)
    return Promise.reject()
  }

  submitting.value = true
  try {
    await rollbackPolicyVersion({
      policyId: props.policyId,
      versionId: props.version.versionId,
      confirmVersionNo: trimmed,
    })
    message.success('回滚成功')
    visible.value = false
    emit('success')
  } catch (error) {
    const msg = error instanceof Error ? error.message : '回滚失败，请稍后重试'
    message.error(msg)
    return Promise.reject()
  } finally {
    submitting.value = false
  }
}

/** 取消回滚 */
function handleCancel() {
  visible.value = false
}

watch(
  () => visible.value,
  (open) => {
    if (!open) {
      resetForm()
    }
  },
)
</script>

<style scoped>
.rollback-hint {
  margin: 0 0 16px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.6;
}

.rollback-form {
  margin-top: 0;
}
</style>
