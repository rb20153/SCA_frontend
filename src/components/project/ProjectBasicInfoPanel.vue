<template>
  <div class="project-basic-panel">
    <a-spin :spinning="submitting">
      <a-form layout="vertical" class="project-basic-form">
        <a-row :gutter="24">
          <a-col :xs="24" :md="12">
            <a-form-item label="项目名称" :required="projectNameEditable">
              <a-input
                v-model:value="form.projectName"
                :disabled="!canWrite('/projects') || !projectNameEditable"
                placeholder="请输入项目名称"
                allow-clear
              />
              <p v-if="!projectNameEditable" class="project-basic-hint">
                已有 {{ project.taskCount }} 个关联任务，项目名称不可修改
              </p>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="负责人" required>
              <UserSearchInput
                ref="ownerSearchRef"
                v-model="selectedOwner"
                placeholder="请输入用户姓名"
                :search-users="searchOwnerUsers"
                :disabled="!canWrite('/projects')"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24" class="project-basic-main-row">
          <a-col :xs="24" :md="12">
            <a-form-item label="项目说明">
              <a-textarea
                v-model:value="form.description"
                placeholder="请输入项目说明"
                :rows="8"
                :disabled="!canWrite('/projects')"
                allow-clear
                class="project-basic-textarea"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="所属部门" required>
              <AsyncOptionsSelect
                ref="departmentSelectRef"
                v-model="form.departmentId"
                placeholder="请选择部门"
                select-class="project-basic-select"
                :load-options="loadEnabledDepartmentSelectOptions"
                :disabled="!canWrite('/projects')"
              />
            </a-form-item>
            <a-form-item label="项目状态" required>
              <a-select
                v-model:value="form.status"
                :options="PROJECT_STATUS_FORM_OPTIONS"
                :disabled="!canWrite('/projects')"
                class="project-basic-select"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <ProfileFormActions
          v-if="canWrite('/projects')"
          :submitting="submitting"
          label-offset="0"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </a-form>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { updateProject } from '@/api/project'
import { searchUsers } from '@/api/user'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import ProfileFormActions from '@/components/common/ProfileFormActions.vue'
import UserSearchInput from '@/components/common/UserSearchInput.vue'
import type { Project, ProjectStatus } from '@/types/project'
import type { UserSearchCandidate } from '@/types/user'
import { PROJECT_STATUS_FORM_OPTIONS } from '@/utils/projectDisplay'
import { loadEnabledDepartmentSelectOptions } from '@/utils/remoteSelectLoaders'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  /** 当前项目（来自列表跳转或详情 API） */
  project: Project
}>()

const emit = defineEmits<{
  updated: [project: Project]
}>()
const { canWrite } = usePagePermission()

const submitting = ref(false)
const selectedOwner = ref<UserSearchCandidate | null>(null)
const ownerSearchRef = ref<InstanceType<typeof UserSearchInput> | null>(null)
const departmentSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

const form = reactive({
  projectName: '',
  description: '',
  departmentId: '',
  status: 'in_progress' as ProjectStatus,
})

/** 仅当项目没有关联任务时允许改名，避免历史任务与项目名不一致 */
const projectNameEditable = computed(() => (props.project.taskCount ?? 0) === 0)

/** 搜索负责人（不限项目成员） */
async function searchOwnerUsers(keyword: string) {
  const res = await searchUsers(keyword)
  return res.data
}

/** 判断部门 ID 是否被后端误写成 projectId */
function isInvalidDepartmentId(deptId: string): boolean {
  const trimmed = deptId.trim()
  if (!trimmed) return true
  if (trimmed === props.project.projectId) return true
  return trimmed.startsWith('proj-')
}

/** 用项目数据回填部门下拉（seedOption 展示名称，避免显示 proj-xxx） */
async function applyDepartmentFromProject() {
  const deptName = (props.project.department ?? '').trim()
  let deptId = (props.project.departmentId ?? '').trim()
  if (isInvalidDepartmentId(deptId)) {
    deptId = ''
  }

  departmentSelectRef.value?.resetOptions()

  if (deptId) {
    departmentSelectRef.value?.seedOption({
      value: deptId,
      label: deptName || deptId,
    })
    form.departmentId = deptId
    return
  }

  if (deptName) {
    const options = await departmentSelectRef.value?.prefetchOptions()
    const matched = options?.find((item) => item.label === deptName)
    if (matched) {
      form.departmentId = matched.value
      return
    }
    departmentSelectRef.value?.seedOption({ value: deptName, label: deptName })
    form.departmentId = deptName
    return
  }

  form.departmentId = ''
}

/** 将项目数据同步到表单与负责人/部门控件 */
async function syncFormFromProject() {
  form.projectName = props.project.projectName
  form.description = props.project.description
  form.status = props.project.status

  const ownerUserId = props.project.ownerUserId?.trim()
  if (ownerUserId && props.project.owner) {
    selectedOwner.value = {
      userId: ownerUserId,
      realName: props.project.owner,
      username: '',
      departmentName: props.project.department,
      roleName: '',
    }
  } else {
    selectedOwner.value = null
    ownerSearchRef.value?.setDisplayName(props.project.owner)
  }

  await nextTick()
  await applyDepartmentFromProject()
}

/** 解析提交用的负责人姓名：已选用户优先，否则取输入框文本或原项目值 */
function resolveOwnerName(): string {
  return (
    selectedOwner.value?.realName ??
    ownerSearchRef.value?.getSubmitDisplayName()?.trim() ??
    props.project.owner
  ).trim()
}

/** 校验并提交基本信息更新 */
async function handleSubmit() {
  if (!canWrite('/projects')) return
  const projectName = form.projectName.trim()
  if (projectNameEditable.value && !projectName) {
    message.warning('请输入项目名称')
    return
  }

  const ownerName = resolveOwnerName()
  if (!ownerName) {
    message.warning('请选择负责人')
    return
  }
  if (!form.departmentId) {
    message.warning('请选择所属部门')
    return
  }

  // 后端按名称存储负责人/部门，提交后用本地提交值回填，避免响应缺字段导致显示回退
  const submittedDepartmentId = form.departmentId
  const submittedDepartmentName =
    departmentSelectRef.value?.getSelectedLabel()?.trim() || props.project.department

  submitting.value = true
  try {
    const res = await updateProject(
      props.project.projectId,
      {
        projectName: projectNameEditable.value ? projectName : undefined,
        description: form.description.trim(),
        owner: ownerName,
        department: submittedDepartmentName,
        status: form.status,
      },
      {
        fallbackDepartmentId: submittedDepartmentId,
        fallbackDepartment: submittedDepartmentName,
      },
    )
    message.success('基本信息已更新')
    // 响应字段缺失时用提交值兜底；status 以响应为准，便于暴露后端未持久化的情况
    emit('updated', {
      ...res.data,
      projectName: res.data.projectName || projectName || props.project.projectName,
      description: res.data.description || form.description.trim(),
      owner: res.data.owner || ownerName,
      departmentId: isInvalidDepartmentId(res.data.departmentId)
        ? submittedDepartmentId
        : res.data.departmentId,
      department: res.data.department || submittedDepartmentName,
    })
  } finally {
    submitting.value = false
  }
}

/** 取消修改，恢复为当前项目数据 */
function handleCancel() {
  void syncFormFromProject()
}

watch(
  () => props.project,
  () => {
    void syncFormFromProject()
  },
  { deep: true },
)

onMounted(() => {
  void syncFormFromProject()
})
</script>

<style scoped>
.project-basic-panel {
  max-width: 960px;
}

.project-basic-form :deep(.ant-form-item) {
  margin-bottom: 20px;
}

.project-basic-main-row {
  align-items: stretch;
}

.project-basic-textarea {
  min-height: 180px;
}

.project-basic-select {
  width: 100%;
}

.project-basic-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
