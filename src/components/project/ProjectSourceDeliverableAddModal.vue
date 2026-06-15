<template>
  <a-modal
    v-model:open="visible"
    title="添加源码交付物"
    width="640px"
    :confirm-loading="submitting"
    :ok-button-props="{ disabled: !canSubmit }"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <SourceIngestForm ref="ingestFormRef" v-model="form" />

    <a-form layout="vertical" class="scan-path-form">
      <a-form-item label="扫描路径前缀">
        <a-input
          v-model:value="scanPathPrefix"
          placeholder="留空表示整包；示例：src/flight-control/"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { addProjectSourceDeliverable } from '@/api/project'
import SourceIngestForm from '@/components/common/SourceIngestForm.vue'
import type { SourceIngestFormState } from '@/types/sourceIngest'
import { createDefaultSourceIngestForm, validateSourceIngestForm } from '@/utils/sourceIngest'

const visible = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  projectId: string
}>()

const submitting = ref(false)
const scanPathPrefix = ref('')
const form = reactive<SourceIngestFormState>(createDefaultSourceIngestForm())

const ingestFormRef = ref<InstanceType<typeof SourceIngestForm> | null>(null)

/** 表单是否满足提交条件 */
const canSubmit = computed(() => {
  const packageFile =
    form.sourceMode === 'upload-source-package'
      ? ingestFormRef.value?.getPackageFile()
      : undefined
  return validateSourceIngestForm(form, packageFile).valid
})

/** 重置表单与上传状态 */
function resetForm() {
  Object.assign(form, createDefaultSourceIngestForm())
  scanPathPrefix.value = ''
  ingestFormRef.value?.resetUpload()
}

/** 提交添加源码交付物；成功后关闭弹窗，不刷新列表 */
async function handleOk() {
  const packageFile =
    form.sourceMode === 'upload-source-package'
      ? ingestFormRef.value?.getPackageFile()
      : undefined

  const validation = validateSourceIngestForm(form, packageFile)
  if (!validation.valid) {
    message.warning(validation.message)
    return Promise.reject()
  }

  submitting.value = true
  try {
    await addProjectSourceDeliverable(props.projectId, {
      ...form,
      scanPathPrefix: scanPathPrefix.value.trim() || undefined,
      packageFile,
    })
    message.success('源码交付物已提交，后台解析中')
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
.scan-path-form {
  margin-top: 8px;
}
</style>
