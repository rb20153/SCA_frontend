<template>
  <a-modal
    v-model:open="visible"
    title="编辑项目"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical">
      <a-form-item label="项目名称" required>
        <a-input
          v-model:value="form.projectName"
          placeholder="请输入项目名称"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="项目说明">
        <a-input
          v-model:value="form.description"
          placeholder="请输入项目说明"
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
      <a-form-item label="所属部门">
        <AsyncOptionsSelect
          ref="departmentSelectRef"
          v-model="departmentId"
          placeholder="请选择部门"
          select-class="project-form-select"
          :load-options="loadEnabledDepartmentSelectOptions"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { updateProject } from '@/api/project'
import { searchUsers } from '@/api/user'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import UserSearchInput from '@/components/common/UserSearchInput.vue'
import type { ProjectFormValues } from '@/types/project'
import type { UserSearchCandidate } from '@/types/user'
import { loadEnabledDepartmentSelectOptions } from '@/utils/remoteSelectLoaders'

const props = defineProps<{
  /** 编辑时的项目 ID */
  projectId: string
  /** 编辑时传入的初始表单值 */
  initialValues: ProjectFormValues
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const selectedOwner = ref<UserSearchCandidate | null>(null)
const departmentId = ref<string | undefined>(undefined)

const ownerSearchRef = ref<InstanceType<typeof UserSearchInput> | null>(null)
const departmentSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

const form = reactive<ProjectFormValues>({
  projectName: '',
  description: '',
  owner: '',
  department: '',
})

/** 搜索负责人（不限项目成员） */
async function searchOwnerUsers(keyword: string) {
  const res = await searchUsers(keyword)
  return res.data
}

/** 将外部初始值同步到表单 */
async function syncFormFromProps() {
  form.projectName = props.initialValues?.projectName ?? ''
  form.description = props.initialValues?.description ?? ''
  form.owner = props.initialValues?.owner ?? ''
  form.department = props.initialValues?.department ?? ''

  selectedOwner.value = null
  departmentId.value = undefined
  ownerSearchRef.value?.setDisplayName(form.owner)

  departmentSelectRef.value?.resetOptions()
  if (props.initialValues?.department) {
    const options = await departmentSelectRef.value?.prefetchOptions()
    departmentId.value = options?.find((item) => item.label === form.department)?.value
  }
}

/** 重置弹窗内搜索/下拉状态 */
function resetSelectors() {
  ownerSearchRef.value?.reset()
  departmentSelectRef.value?.resetOptions()
  selectedOwner.value = null
  departmentId.value = undefined
}

/** 校验后调用新增或更新 API */
async function handleOk() {
  if (!form.projectName.trim()) {
    message.warning('请输入项目名称')
    return Promise.reject()
  }

  const ownerName = ownerSearchRef.value?.getSubmitDisplayName() ?? ''
  if (!ownerName) {
    message.warning('请选择负责人')
    return Promise.reject()
  }

  const departmentName =
    departmentSelectRef.value?.getSelectedLabel()?.trim() ?? form.department.trim()

  const payload: ProjectFormValues = {
    projectName: form.projectName.trim(),
    description: form.description.trim(),
    owner: ownerName,
    department: departmentName,
  }

  submitting.value = true
  try {
    await updateProject(props.projectId, payload)
    message.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      void syncFormFromProps()
    } else {
      resetSelectors()
    }
  },
)

watch(
  () => props.initialValues,
  () => {
    if (visible.value) {
      void syncFormFromProps()
    }
  },
  { deep: true },
)
</script>

<style scoped>
.project-form-select {
  width: 100%;
  max-width: 360px;
}
</style>
