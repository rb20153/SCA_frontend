<template>
  <a-modal
    v-model:open="visible"
    title="导入策略"
    width="560px"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    :confirm-loading="submitting"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form layout="vertical">
      <a-form-item label="策略文件" required>
        <a-upload-dragger
          :file-list="fileList"
          :before-upload="handleBeforeUpload"
          :max-count="1"
          accept=".json,.yaml,.yml"
          @remove="clearFile"
        >
          <p class="upload-icon">
            <InboxOutlined />
          </p>
          <p class="upload-title">点击或拖拽上传 JSON / YAML 文件</p>
        </a-upload-dragger>
      </a-form-item>

      <a-form-item label="导入模式" required>
        <a-select
          v-model:value="importMode"
          :options="POLICY_IMPORT_MODE_OPTIONS"
          class="form-select-full"
        />
      </a-form-item>

      <a-form-item label="导入前校验">
        <a-checkbox-group
          v-model:value="prechecks"
          :options="POLICY_IMPORT_PRECHECK_OPTIONS"
          class="precheck-group"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { importPolicy } from '@/api/policy'
import { useSingleFileUpload } from '@/composables/useSingleFileUpload'
import type { Policy, PolicyImportMode, PolicyImportPrecheck } from '@/types/policy'
import {
  POLICY_IMPORT_MODE_OPTIONS,
  POLICY_IMPORT_PRECHECK_OPTIONS,
} from '@/utils/policyDisplay'
import { usePagePermission } from '@/composables/usePagePermission'

const POLICY_FILE_EXTENSIONS = ['.json', '.yaml', '.yml'] as const

const DEFAULT_PRECHECKS: PolicyImportPrecheck[] = ['dedup', 'compatibility', 'risk']

const props = defineProps<{
  /** 编辑已有策略时传入 */
  contextPolicy?: Policy | null
}>()

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

const submitting = ref(false)
const importMode = ref<PolicyImportMode>('create')
const prechecks = ref<PolicyImportPrecheck[]>([...DEFAULT_PRECHECKS])

const {
  fileList,
  handleBeforeUpload,
  clearFile,
  getSelectedFile,
} = useSingleFileUpload({
  allowedExtensions: POLICY_FILE_EXTENSIONS,
  invalidExtensionMessage: '仅支持 JSON / YAML 文件',
})

/** 重置表单 */
function resetForm() {
  importMode.value = props.contextPolicy ? 'new-version' : 'create'
  prechecks.value = [...DEFAULT_PRECHECKS]
  clearFile()
}

/** 关闭弹窗 */
function handleCancel() {
  visible.value = false
}

/** 校验后提交导入请求 */
async function handleOk() {
  if (!canWrite('/policies')) return Promise.reject()
  const file = getSelectedFile()
  if (!file) {
    message.warning('请上传策略文件')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await importPolicy({
      file,
      importMode: importMode.value,
      prechecks: prechecks.value,
      policyId: props.contextPolicy?.policyId,
    })
    message.success('策略导入成功，正在校验')
    visible.value = false
  } finally {
    submitting.value = false
  }
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
.upload-icon {
  margin: 0 0 8px;
  font-size: 32px;
  color: #1677ff;
}

.upload-title {
  margin: 0;
  color: rgba(0, 0, 0, 0.65);
}

.form-select-full {
  width: 100%;
}

.precheck-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.precheck-group :deep(.ant-checkbox-wrapper) {
  margin-inline-start: 0;
}
</style>
