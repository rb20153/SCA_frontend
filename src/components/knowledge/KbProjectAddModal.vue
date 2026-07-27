<template>
  <FormStepWizardModal
    v-model:open="visible"
    v-model:current-step="currentStep"
    title="添加开源项目"
    :steps="WIZARD_STEPS"
    :can-go-next="canGoNext"
    :can-submit="canSubmit"
    :submitting="submitting"
    :scrollable-panel="currentStep === 1"
    @cancel="handleCancel"
    @prev="goPrev"
    @next="goNext"
    @submit="handleSubmit"
  >
    <template #step-0>
      <a-form layout="vertical">
        <a-form-item label="项目名称" required>
          <a-input
            v-model:value="projectName"
            placeholder="请输入项目名称"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="分类" required>
          <a-select
            v-model:value="category"
            placeholder="请选择分类"
            :options="KB_PROJECT_CATEGORY_OPTIONS"
            class="wizard-select"
          />
        </a-form-item>
      </a-form>
    </template>

    <template #step-1>
      <SourceIngestForm
        ref="ingestFormRef"
        v-model="ingestForm"
        source-mode-label="入库方式"
      />

      <a-form layout="vertical" class="version-form">
        <a-form-item
          v-if="ingestForm.sourceMode === 'upload-source-package'"
          label="版本号"
          required
        >
          <a-input
            v-model:value="packageVersion"
            placeholder="例如：v2312"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </template>

    <template #step-2>
      <a-form layout="vertical">
        <a-form-item label="标签">
          <TagInput ref="tagInputRef" v-model="tags" />
        </a-form-item>

        <a-form-item label="备注">
          <a-textarea
            v-model:value="remark"
            :rows="4"
            placeholder="可选备注"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </template>
  </FormStepWizardModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createKbProject } from '@/api/knowledge'
import FormStepWizardModal from '@/components/common/FormStepWizardModal.vue'
import SourceIngestForm from '@/components/common/SourceIngestForm.vue'
import TagInput from '@/components/common/TagInput.vue'
import type { KbProjectCategory } from '@/types/knowledge'
import type { SourceIngestFormState } from '@/types/sourceIngest'
import { KB_PROJECT_CATEGORY_OPTIONS } from '@/utils/knowledgeQuery'
import { createDefaultSourceIngestForm, validateSourceIngestForm } from '@/utils/sourceIngest'

const WIZARD_STEPS = ['基本信息', '入库配置', '补充信息'] as const

const visible = defineModel<boolean>('open', { required: true })

const submitting = ref(false)
const currentStep = ref(0)
const projectName = ref('')
const category = ref<KbProjectCategory | undefined>(undefined)
let ingestForm = reactive<SourceIngestFormState>(createDefaultSourceIngestForm())
const packageVersion = ref('')
const tags = ref<string[]>([])
const remark = ref('')

const ingestFormRef = ref<InstanceType<typeof SourceIngestForm> | null>(null)
const tagInputRef = ref<InstanceType<typeof TagInput> | null>(null)

/** 第一步：项目名称与分类 */
const isStep0Valid = computed(
  () => projectName.value.trim().length > 0 && category.value !== undefined,
)

/** 第二步：入库方式与凭据/压缩包；上传模式须填版本号 */
const isStep1Valid = computed(() => {
  const packageFile =
    ingestForm.sourceMode === 'upload-source-package'
      ? ingestFormRef.value?.getPackageFile()
      : undefined

  const ingestValidation = validateSourceIngestForm(ingestForm, packageFile)
  if (!ingestValidation.valid) {
    return false
  }

  if (ingestForm.sourceMode === 'upload-source-package') {
    return packageVersion.value.trim().length > 0
  }

  return true
})

/** 第三步：标签与备注均为可选，恒为 true */
const isStep2Valid = computed(() => true)

/** 当前步骤是否可进入下一步 */
const canGoNext = computed(() => {
  if (currentStep.value === 0) {
    return isStep0Valid.value
  }
  if (currentStep.value === 1) {
    return isStep1Valid.value
  }
  return false
})

/** 全部步骤校验通过才可提交 */
const canSubmit = computed(
  () => isStep0Valid.value && isStep1Valid.value && isStep2Valid.value,
)

/** 进入下一步；未通过校验时提示 */
function goNext() {
  if (currentStep.value === 0 && !isStep0Valid.value) {
    message.warning('请填写项目名称并选择分类')
    return
  }

  if (currentStep.value === 1) {
    const packageFile =
      ingestForm.sourceMode === 'upload-source-package'
        ? ingestFormRef.value?.getPackageFile()
        : undefined
    const ingestValidation = validateSourceIngestForm(ingestForm, packageFile)
    if (!ingestValidation.valid) {
      message.warning(ingestValidation.message)
      return
    }
    if (ingestForm.sourceMode === 'upload-source-package' && !packageVersion.value.trim()) {
      message.warning('请输入版本号')
      return
    }
  }

  if (!canGoNext.value) {
    return
  }

  currentStep.value += 1
}

/** 返回上一步 */
function goPrev() {
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

/** 关闭弹窗 */
function handleCancel() {
  visible.value = false
}

/** 重置向导与表单 */
function resetWizard() {
  currentStep.value = 0
  projectName.value = ''
  category.value = undefined
  Object.assign(ingestForm, createDefaultSourceIngestForm())
  packageVersion.value = ''
  tags.value = []
  remark.value = ''
  ingestFormRef.value?.resetUpload()
  tagInputRef.value?.clearInput()
}

/** 提交添加开源项目；成功后关闭弹窗，不刷新列表 */
async function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  const packageFile =
    ingestForm.sourceMode === 'upload-source-package'
      ? ingestFormRef.value?.getPackageFile()
      : undefined

  submitting.value = true
  try {
    await createKbProject({
      projectName: projectName.value.trim(),
      category: category.value as KbProjectCategory,
      ...ingestForm,
      packageVersion:
        ingestForm.sourceMode === 'upload-source-package'
          ? packageVersion.value.trim()
          : undefined,
      tags: tags.value.length > 0 ? [...tags.value] : undefined,
      remark: remark.value.trim() || undefined,
      packageFile,
    })
    message.success('开源项目已提交，后台处理中')
    visible.value = false
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (!open) {
      resetWizard()
    }
  },
)
</script>

<style scoped>
.wizard-select {
  width: 100%;
  max-width: 360px;
}

.version-form {
  margin-top: 0;
}
</style>
