<template>
  <a-modal
    v-model:open="visible"
    title="开始 AI 解析"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    width="720px"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical">
      <a-form-item label="关联项目" required>
        <AsyncOptionsSelect
          v-model="projectId"
          placeholder="请选择"
          :allow-clear="false"
          select-class="modal-select-full"
          :load-options="loadDetectTaskProjectSelectOptions"
        />
      </a-form-item>

      <SourceIngestForm ref="ingestFormRef" v-model="sourceForm" />

      <a-form-item label="扫描深度">
        <a-select
          v-model:value="scanDepth"
          :options="AI_PARSE_SCAN_DEPTH_OPTIONS"
          class="modal-select-full"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createAiParseTask } from '@/api/detect'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import SourceIngestForm from '@/components/common/SourceIngestForm.vue'
import type { AiParseScanDepth } from '@/types/detect'
import type { SourceIngestFormState } from '@/types/sourceIngest'
import { loadDetectTaskProjectSelectOptions } from '@/utils/remoteSelectLoaders'
import { AI_PARSE_SCAN_DEPTH_OPTIONS } from '@/utils/aiParseQuery'
import { createDefaultSourceIngestForm, validateSourceIngestForm } from '@/utils/sourceIngest'
import { usePagePermission } from '@/composables/usePagePermission'

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const projectId = ref<string | undefined>(undefined)
const scanDepth = ref<AiParseScanDepth>(3)
let sourceForm = reactive<SourceIngestFormState>(createDefaultSourceIngestForm())
const ingestFormRef = ref<InstanceType<typeof SourceIngestForm> | null>(null)

/** 重置弹窗表单 */
function resetForm() {
  projectId.value = undefined
  scanDepth.value = 3
  Object.assign(sourceForm, createDefaultSourceIngestForm())
  ingestFormRef.value?.resetUpload()
}

/** 校验并提交 AI 解析任务 */
async function handleOk() {
  if (!canWrite('/detect/ai-analysis')) return Promise.reject()
  if (!projectId.value) {
    message.warning('请选择关联项目')
    return Promise.reject()
  }

  const packageFile = ingestFormRef.value?.getPackageFile()
  const validation = validateSourceIngestForm(sourceForm, packageFile)
  if (!validation.valid) {
    message.warning(validation.message)
    return Promise.reject()
  }

  submitting.value = true
  try {
    await createAiParseTask({
      projectId: projectId.value,
      scanDepth: scanDepth.value,
      sourceMode: sourceForm.sourceMode,
      repositoryUrl: sourceForm.repositoryUrl,
      authType: sourceForm.authType,
      accessToken: sourceForm.accessToken,
      username: sourceForm.username,
      password: sourceForm.password,
      sshPrivateKey: sourceForm.sshPrivateKey,
      sshPassphrase: sourceForm.sshPassphrase,
      packageFile: packageFile ?? undefined,
      packageFileName: packageFile?.name,
    })
    message.success('AI 解析任务已提交')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

watch(visible, (open) => {
  if (!open) {
    resetForm()
  }
})
</script>

<style scoped>
.modal-select-full {
  width: 100%;
  max-width: none;
}
</style>
