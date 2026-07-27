<template>
  <div class="project-policy-panel">
    <PageLoading :loading="loading && !panelReady">
      <a-empty
        v-if="panelReady && !savedBinding && !form.policyId"
        description="暂无检测策略配置"
        class="project-policy-empty"
      />
      <a-spin v-if="panelReady" :spinning="submitting">
        <a-form layout="vertical" class="project-policy-form">
          <a-form-item label="检测策略" required>
            <AsyncOptionsSelect
              ref="policySelectRef"
              v-model="form.policyId"
              placeholder="请选择检测策略"
              select-class="project-policy-select"
              :load-options="loadPolicySelectOptions"
            />
          </a-form-item>
          <p v-if="!form.policyId" class="policy-binding-hint">
            选择检测策略后将自动带出默认参数，可按项目需要调整
          </p>
          <a-spin :spinning="paramsLoading" size="small">
            <a-form-item label="相似度阈值" required>
              <a-input-number
                v-model:value="form.similarityThreshold"
                :min="0"
                :max="100"
                :disabled="paramsFieldsDisabled"
                class="project-policy-number"
              />
            </a-form-item>
            <a-form-item label="最小匹配长度" required>
              <a-input-number
                v-model:value="form.minMatchLength"
                :min="1"
                :max="9999"
                :disabled="paramsFieldsDisabled"
                class="project-policy-number"
              />
            </a-form-item>
            <a-form-item label="排除目录">
              <TagInput
                ref="excludeDirTagRef"
                v-model="form.excludeDirectories"
                :disabled="paramsFieldsDisabled"
              />
            </a-form-item>
          </a-spin>

          <ProfileFormActions
            :submitting="submitting"
            submit-text="更新检测策略"
            cancel-text="取消修改"
            label-offset="0"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </a-form>
      </a-spin>
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getProjectPolicyBinding, updateProjectPolicyBinding } from '@/api/project'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import ProfileFormActions from '@/components/common/ProfileFormActions.vue'
import TagInput from '@/components/common/TagInput.vue'
import { usePolicyBindingParamsFill } from '@/composables/usePolicyBindingParamsFill'
import type { ProjectPolicyBinding, ProjectPolicyBindingInput } from '@/types/project'
import { validateProjectPolicyBinding } from '@/utils/projectCreate'
import { loadPolicySelectOptions } from '@/utils/remoteSelectLoaders'

const props = defineProps<{
  /** 当前项目 ID */
  projectId: string
  /** Tab 是否可见，用于懒加载 */
  visible: boolean
}>()

const loading = ref(false)
const submitting = ref(false)
const panelReady = ref(false)
const savedBinding = ref<ProjectPolicyBinding | null>(null)

const policySelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)
const excludeDirTagRef = ref<InstanceType<typeof TagInput> | null>(null)

const form = reactive<ProjectPolicyBindingInput>({
  policyId: '',
  similarityThreshold: 0,
  minMatchLength: 0,
  excludeDirectories: [],
})

const skipPolicyParamsFill = ref(true)

const policyIdRef = computed({
  get: () => form.policyId || undefined,
  set: (id) => {
    form.policyId = id ?? ''
  },
})

const { paramsLoading, paramsFieldsDisabled } = usePolicyBindingParamsFill(
  policyIdRef,
  form,
  { skipFill: skipPolicyParamsFill },
)

/** 将绑定数据写入表单 */
function applyBindingToForm(binding: ProjectPolicyBinding) {
  form.policyId = binding.policyId
  form.similarityThreshold = binding.similarityThreshold
  form.minMatchLength = binding.minMatchLength
  form.excludeDirectories = [...binding.excludeDirectories]
  savedBinding.value = binding
}

/** 清空表单，便于首次配置策略 */
function resetFormForNewBinding() {
  form.policyId = ''
  form.similarityThreshold = 0
  form.minMatchLength = 0
  form.excludeDirectories = []
  savedBinding.value = null
}

/** 从服务端拉取当前项目的策略绑定 */
async function fetchBinding() {
  loading.value = true
  skipPolicyParamsFill.value = true
  try {
    const res = await getProjectPolicyBinding(props.projectId)
    if (!res.data) {
      resetFormForNewBinding()
      return
    }
    applyBindingToForm(res.data)
    await policySelectRef.value?.prefetchOptions()
  } finally {
    loading.value = false
    panelReady.value = true
    await nextTick()
    skipPolicyParamsFill.value = false
  }
}

/** 恢复为上次保存的策略配置 */
function handleCancel() {
  if (!savedBinding.value) {
    return
  }
  skipPolicyParamsFill.value = true
  applyBindingToForm(savedBinding.value)
  excludeDirTagRef.value?.clearInput()
  skipPolicyParamsFill.value = false
}

/** 校验并提交策略更新 */
async function handleSubmit() {
  if (paramsLoading.value) {
    message.warning('正在加载策略默认参数，请稍候')
    return
  }
  const validation = validateProjectPolicyBinding(form)
  if (!validation.valid) {
    message.warning(validation.message)
    return
  }

  submitting.value = true
  try {
    const res = await updateProjectPolicyBinding(props.projectId, {
      policyId: form.policyId,
      similarityThreshold: form.similarityThreshold,
      minMatchLength: form.minMatchLength,
      excludeDirectories: [...form.excludeDirectories],
    })
    message.success('检测策略已更新')
    applyBindingToForm(res.data)
  } finally {
    submitting.value = false
  }
}

watch(
  () => [props.visible, props.projectId] as const,
  ([visible, projectId]) => {
    if (visible && projectId) {
      void fetchBinding()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.project-policy-panel {
  max-width: 640px;
}

.project-policy-empty {
  margin: 48px auto 24px;
  padding: 16px 0;
}

.project-policy-empty :deep(.ant-empty-image) {
  margin-inline: auto;
}

.project-policy-empty :deep(.ant-empty-description) {
  text-align: center;
}

.project-policy-form :deep(.ant-form-item) {
  margin-bottom: 20px;
}

.project-policy-select {
  width: 100%;
  max-width: 420px;
}

.project-policy-number {
  width: 120px;
}

.policy-binding-hint {
  margin: -8px 0 16px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
