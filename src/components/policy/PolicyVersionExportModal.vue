<template>
  <a-modal
    v-model:open="visible"
    title="策略导出"
    ok-text="确定"
    cancel-text="取消"
    width="520px"
    destroy-on-close
    :confirm-loading="submitting"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form layout="vertical" class="export-form">
      <a-form-item label="导出范围" required>
        <a-select
          v-model:value="scope"
          placeholder="请选择导出范围"
          :options="POLICY_VERSION_EXPORT_SCOPE_OPTIONS"
        />
      </a-form-item>

      <a-form-item label="导出格式" required>
        <a-select
          v-model:value="format"
          placeholder="请选择导出格式"
          :options="POLICY_VERSION_EXPORT_FORMAT_OPTIONS"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { exportPolicyVersion } from '@/api/policy'
import type {
  PolicyVersionExportFormat,
  PolicyVersionExportScope,
  PolicyVersionListItem,
} from '@/types/policy'
import {
  POLICY_VERSION_EXPORT_FORMAT_OPTIONS,
  POLICY_VERSION_EXPORT_SCOPE_OPTIONS,
} from '@/utils/policyVersionDisplay'
import { triggerReportDownload } from '@/utils/reportDownload'

const props = defineProps<{
  /** 策略 ID */
  policyId: string
  /** 要导出的版本行 */
  version: PolicyVersionListItem | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const submitting = ref(false)
const scope = ref<PolicyVersionExportScope>('params-and-rules')
const format = ref<PolicyVersionExportFormat>('json')

/** 弹窗关闭时重置表单默认值 */
function resetForm() {
  scope.value = 'params-and-rules'
  format.value = 'json'
}

/** 校验并提交导出请求，成功后下载并关闭弹窗 */
async function handleOk() {
  if (!props.version) {
    return Promise.reject()
  }
  if (!scope.value) {
    message.warning('请选择导出范围')
    return Promise.reject()
  }
  if (!format.value) {
    message.warning('请选择导出格式')
    return Promise.reject()
  }

  submitting.value = true
  try {
    const res = await exportPolicyVersion({
      policyId: props.policyId,
      versionId: props.version.versionId,
      scope: scope.value,
      format: format.value,
    })
    if (!res.data?.downloadUrl) {
      message.warning('导出失败，请稍后重试')
      return Promise.reject()
    }
    triggerReportDownload(res.data.downloadUrl, res.data.fileName)
    message.success('导出成功')
    visible.value = false
  } catch (error) {
    const msg = error instanceof Error ? error.message : '导出失败，请稍后重试'
    message.error(msg)
    return Promise.reject()
  } finally {
    submitting.value = false
  }
}

/** 取消导出 */
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
.export-form {
  margin-top: 8px;
}
</style>
