<template>
  <FormStepWizardModal
    v-model:open="visible"
    v-model:current-step="currentStep"
    title="新增项目"
    :steps="WIZARD_STEPS"
    :can-go-next="canGoNext"
    :can-submit="canSubmit"
    :submitting="submitting"
    submit-text="确认创建"
    :scrollable-panel="currentStep === 2"
    @cancel="handleCancel"
    @prev="goPrev"
    @next="goNext"
    @submit="handleSubmit"
  >
    <template #step-0>
      <a-form layout="vertical">
        <a-form-item label="项目名称" required>
          <a-input
            v-model:value="basicForm.projectName"
            placeholder="请输入项目名称"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="项目说明">
          <a-textarea
            v-model:value="basicForm.description"
            placeholder="请输入项目说明"
            :rows="3"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="负责人" required>
          <UserSearchInput
            ref="ownerSearchRef"
            v-model="selectedOwner"
            placeholder="请输入用户姓名"
            :search-users="searchOwnerUsers"
          />
        </a-form-item>
        <a-form-item label="所属部门" required>
          <AsyncOptionsSelect
            ref="departmentSelectRef"
            v-model="departmentId"
            placeholder="请选择部门"
            select-class="wizard-field"
            :load-options="loadEnabledDepartmentSelectOptions"
          />
        </a-form-item>
      </a-form>
    </template>

    <template #step-1>
      <a-form layout="vertical">
        <a-form-item label="检测策略" required>
          <AsyncOptionsSelect
            ref="policySelectRef"
            v-model="policyForm.policyId"
            placeholder="请选择检测策略"
            select-class="wizard-field"
            :load-options="loadPolicySelectOptions"
          />
        </a-form-item>
        <p v-if="!policyForm.policyId" class="policy-binding-hint">
          选择检测策略后将自动带出默认参数，可按项目需要调整
        </p>
        <a-spin :spinning="paramsLoading" size="small">
          <a-form-item label="相似度阈值" required>
            <a-input-number
              v-model:value="policyForm.similarityThreshold"
              :min="0"
              :max="100"
              :disabled="paramsFieldsDisabled"
              class="wizard-number"
            />
          </a-form-item>
          <a-form-item label="最小匹配长度" required>
            <a-input-number
              v-model:value="policyForm.minMatchLength"
              :min="1"
              :max="9999"
              :disabled="paramsFieldsDisabled"
              class="wizard-number"
            />
          </a-form-item>
          <a-form-item label="排除目录">
            <TagInput
              ref="excludeDirTagRef"
              v-model="policyForm.excludeDirectories"
              :disabled="paramsFieldsDisabled"
            />
          </a-form-item>
        </a-spin>
      </a-form>
    </template>

    <template #step-2>
      <ProjectDeliverableInlineForm
        ref="deliverableFormRef"
        @valid-change="deliverableStepValid = $event"
      />
    </template>
  </FormStepWizardModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createProject } from '@/api/project'
import { searchUsers } from '@/api/user'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import FormStepWizardModal from '@/components/common/FormStepWizardModal.vue'
import TagInput from '@/components/common/TagInput.vue'
import UserSearchInput from '@/components/common/UserSearchInput.vue'
import ProjectDeliverableInlineForm from '@/components/project/ProjectDeliverableInlineForm.vue'
import { usePolicyBindingParamsFill } from '@/composables/usePolicyBindingParamsFill'
import type {
  CreateProjectWizardParams,
  Project,
} from '@/types/project'
import type { UserSearchCandidate } from '@/types/user'
import {
  createDefaultProjectPolicyBinding,
  validateProjectPolicyBinding,
} from '@/utils/projectCreate'
import {
  loadEnabledDepartmentSelectOptions,
  loadPolicySelectOptions,
} from '@/utils/remoteSelectLoaders'

const WIZARD_STEPS = ['基本信息', '绑定策略', '上传交付物'] as const

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: [project: Project]
}>()

const submitting = ref(false)
const currentStep = ref(0)
const selectedOwner = ref<UserSearchCandidate | null>(null)
const departmentId = ref<string | undefined>(undefined)
const deliverableStepValid = ref(false)

const ownerSearchRef = ref<InstanceType<typeof UserSearchInput> | null>(null)
const departmentSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)
const policySelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)
const excludeDirTagRef = ref<InstanceType<typeof TagInput> | null>(null)
const deliverableFormRef = ref<InstanceType<typeof ProjectDeliverableInlineForm> | null>(null)

const basicForm = reactive({
  projectName: '',
  description: '',
})

const policyForm = reactive(createDefaultProjectPolicyBinding())
const skipPolicyParamsFill = ref(false)

const { paramsLoading, paramsFieldsDisabled } = usePolicyBindingParamsFill(
  toRef(policyForm, 'policyId'),
  policyForm,
  { skipFill: skipPolicyParamsFill },
)

/** 搜索负责人（不限项目成员） */
async function searchOwnerUsers(keyword: string) {
  const res = await searchUsers(keyword)
  return res.data
}

/** 第一步校验：名称、负责人、部门均必填 */
const isStep0Valid = computed(() => {
  if (!basicForm.projectName.trim()) {
    return false
  }
  if (selectedOwner.value?.userId === undefined) {
    return false
  }
  return departmentId.value !== undefined && departmentId.value !== ''
})

/** 第二步校验：已选策略且默认参数已加载 */
const isStep1Valid = computed(
  () => !paramsLoading.value && validateProjectPolicyBinding(policyForm).valid,
)

/** 第三步校验：已选类型且表单填写完整 */
const isStep2Valid = computed(() => deliverableStepValid.value)

const canGoNext = computed(() => {
  if (currentStep.value === 0) {
    return isStep0Valid.value
  }
  if (currentStep.value === 1) {
    return isStep1Valid.value
  }
  return false
})

const canSubmit = computed(
  () => isStep0Valid.value && isStep1Valid.value && isStep2Valid.value,
)

/** 重置向导 */
function resetWizard() {
  currentStep.value = 0
  basicForm.projectName = ''
  basicForm.description = ''
  Object.assign(policyForm, createDefaultProjectPolicyBinding())
  selectedOwner.value = null
  departmentId.value = undefined
  deliverableStepValid.value = false
  ownerSearchRef.value?.reset()
  departmentSelectRef.value?.resetOptions()
  policySelectRef.value?.resetOptions()
  excludeDirTagRef.value?.clearInput()
  deliverableFormRef.value?.reset()
}

/** 关闭弹窗 */
function handleCancel() {
  visible.value = false
}

/** 进入下一步 */
function goNext() {
  if (currentStep.value === 0 && !isStep0Valid.value) {
    if (!basicForm.projectName.trim()) {
      message.warning('请输入项目名称')
      return
    }
    if (selectedOwner.value?.userId === undefined) {
      message.warning('请从列表中选择负责人')
      return
    }
    message.warning('请选择所属部门')
    return
  }
  if (currentStep.value === 1) {
    const validation = validateProjectPolicyBinding(policyForm)
    if (!validation.valid) {
      message.warning(validation.message)
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

/** 组装提交参数 */
function buildSubmitPayload(): CreateProjectWizardParams | null {
  const ownerUserId = selectedOwner.value?.userId
  if (!ownerUserId) {
    message.warning('请从列表中选择负责人')
    return null
  }
  if (!departmentId.value) {
    message.warning('请选择所属部门')
    return null
  }
  if (!policyForm.policyId) {
    message.warning('请选择检测策略')
    return null
  }

  const deliverables = deliverableFormRef.value?.buildDeliverables()
  if (deliverables === undefined) {
    message.warning('请选择交付物类型')
    return null
  }
  if (deliverables.length === 0 && !deliverableFormRef.value?.getIsValid()) {
    const hint = deliverableFormRef.value?.getValidationMessage()
    message.warning(hint || '请完成交付物信息')
    return null
  }

  const departmentName = departmentSelectRef.value?.getSelectedLabel() ?? ''

  return {
    projectName: basicForm.projectName.trim(),
    description: basicForm.description.trim(),
    owner: selectedOwner.value?.realName ?? ownerSearchRef.value?.getSubmitDisplayName() ?? '',
    ownerUserId,
    department: departmentName,
    departmentId: departmentId.value,
    policy: {
      policyId: policyForm.policyId,
      similarityThreshold: policyForm.similarityThreshold,
      minMatchLength: policyForm.minMatchLength,
      excludeDirectories: [...policyForm.excludeDirectories],
    },
    deliverables,
  }
}

/** 提交创建项目 */
async function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  const payload = buildSubmitPayload()
  if (!payload) {
    return
  }

  submitting.value = true
  try {
    const res = await createProject(payload)
    message.success('项目已创建')
    visible.value = false
    emit('success', res.data)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '创建失败')
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      resetWizard()
    }
  },
)
</script>

<style scoped>
.wizard-field {
  width: 100%;
  max-width: 420px;
}

.wizard-number {
  width: 120px;
}

.policy-binding-hint {
  margin: -8px 0 16px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
