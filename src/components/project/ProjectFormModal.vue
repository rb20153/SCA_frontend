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
import { nextTick, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { updateProject } from '@/api/project'
import { searchUsers } from '@/api/user'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import UserSearchInput from '@/components/common/UserSearchInput.vue'
import type { Project, ProjectFormValues } from '@/types/project'
import type { UserSearchCandidate } from '@/types/user'
import { loadEnabledDepartmentSelectOptions } from '@/utils/remoteSelectLoaders'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  /** 编辑时的项目 ID */
  projectId: string
  /** 列表行项目数据（编辑回填直接读此对象，不再请求接口） */
  project: Project
}>()

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

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

/** 等待弹窗内子组件 ref 挂载（destroy-on-close 下需多帧） */
async function waitForSelectorRefs(maxAttempts = 8) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await nextTick()
    if (ownerSearchRef.value && departmentSelectRef.value) {
      return
    }
  }
}

/** 用列表行里的部门名称/ID 回填下拉，不请求部门接口 */
function applyDepartmentFromList(project: Project) {
  const deptName = (project.department ?? '').trim()
  const deptId = (project.departmentId ?? '').trim()

  departmentSelectRef.value?.resetOptions()

  if (!deptName && !deptId) {
    departmentId.value = undefined
    return
  }

  const selectValue = deptId || deptName
  departmentSelectRef.value?.seedOption({
    value: selectValue,
    label: deptName || deptId,
  })
  departmentId.value = selectValue
}

/** 将列表行初始值同步到表单与负责人/部门控件 */
async function syncFormFromProps() {
  const values = props.project
  form.projectName = values.projectName ?? ''
  form.description = values.description ?? ''
  form.owner = values.owner ?? ''
  form.department = values.department ?? ''

  await waitForSelectorRefs()

  const ownerUserId = values.ownerUserId?.trim()
  if (ownerUserId && form.owner) {
    selectedOwner.value = {
      userId: ownerUserId,
      realName: form.owner,
      username: '',
      departmentName: form.department,
      roleName: '',
    }
  } else if (form.owner) {
    selectedOwner.value = null
    ownerSearchRef.value?.setDisplayName(form.owner)
  } else {
    selectedOwner.value = null
    ownerSearchRef.value?.reset()
  }

  applyDepartmentFromList(values)
}

/** 关闭弹窗时清空表单与选择器 */
function resetForm() {
  form.projectName = ''
  form.description = ''
  form.owner = ''
  form.department = ''
  resetSelectors()
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
  if (!canWrite('/projects')) return Promise.reject()
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
      resetForm()
    }
  },
  { immediate: true },
)

watch(
  () => props.project,
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
