<template>
  <div class="project-basic-panel">
    <a-spin :spinning="submitting">
      <a-form layout="vertical" class="project-basic-form">
        <a-row :gutter="24">
          <a-col :xs="24" :md="12">
            <a-form-item label="项目名称">
              <a-input :value="project.projectName" disabled />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="负责人" required>
              <UserSearchInput
                ref="ownerSearchRef"
                v-model="selectedOwner"
                placeholder="请输入用户姓名"
                :search-users="searchOwnerUsers"
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
              />
            </a-form-item>
            <a-form-item label="项目状态" required>
              <a-select
                v-model:value="form.status"
                :options="PROJECT_STATUS_FORM_OPTIONS"
                class="project-basic-select"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <ProfileFormActions
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
import { onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { updateProjectBasicInfo } from '@/api/project'
import { searchUsers } from '@/api/user'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import ProfileFormActions from '@/components/common/ProfileFormActions.vue'
import UserSearchInput from '@/components/common/UserSearchInput.vue'
import type { Project, UpdateProjectBasicInfoParams } from '@/types/project'
import type { UserSearchCandidate } from '@/types/user'
import { PROJECT_STATUS_FORM_OPTIONS } from '@/utils/projectDisplay'
import { loadEnabledDepartmentSelectOptions } from '@/utils/remoteSelectLoaders'

const props = defineProps<{
  /** 当前项目（来自列表跳转或详情 API） */
  project: Project
}>()

const emit = defineEmits<{
  updated: [project: Project]
}>()

const submitting = ref(false)
const selectedOwner = ref<UserSearchCandidate | null>(null)
const ownerSearchRef = ref<InstanceType<typeof UserSearchInput> | null>(null)
const departmentSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

const form = reactive<Omit<UpdateProjectBasicInfoParams, 'ownerUserId'>>({
  description: '',
  departmentId: '',
  status: 'in_progress',
})

/** 搜索负责人（不限项目成员） */
async function searchOwnerUsers(keyword: string) {
  const res = await searchUsers(keyword)
  return res.data
}

/** 将项目数据同步到表单与负责人输入框 */
function syncFormFromProject() {
  form.description = props.project.description
  form.departmentId = props.project.departmentId
  form.status = props.project.status
  selectedOwner.value = null
  ownerSearchRef.value?.setDisplayName(props.project.owner)
}

/** 预加载部门下拉，保证当前部门名称正确展示 */
async function prefetchDepartmentOptions() {
  await departmentSelectRef.value?.prefetchOptions()
}

/** 解析提交用的负责人 ID：新选用户优先，未改负责人时保留原 ID */
function resolveOwnerUserId(): string | undefined {
  if (selectedOwner.value?.userId) {
    return selectedOwner.value.userId
  }
  const displayName = ownerSearchRef.value?.getSubmitDisplayName() ?? ''
  if (displayName === props.project.owner) {
    return props.project.ownerUserId
  }
  return undefined
}

/** 校验并提交基本信息更新 */
async function handleSubmit() {
  const ownerUserId = resolveOwnerUserId()
  if (!ownerUserId) {
    message.warning('请从列表中选择负责人')
    return
  }
  if (!form.departmentId) {
    message.warning('请选择所属部门')
    return
  }

  submitting.value = true
  try {
    const res = await updateProjectBasicInfo(props.project.projectId, {
      description: form.description.trim(),
      ownerUserId,
      departmentId: form.departmentId,
      status: form.status,
    })
    message.success('基本信息已更新')
    emit('updated', res.data)
  } finally {
    submitting.value = false
  }
}

/** 取消修改，恢复为当前项目数据 */
function handleCancel() {
  syncFormFromProject()
}

watch(
  () => props.project,
  () => {
    syncFormFromProject()
    void prefetchDepartmentOptions()
  },
  { deep: true },
)

onMounted(() => {
  syncFormFromProject()
  void prefetchDepartmentOptions()
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
</style>
