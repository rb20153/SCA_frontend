<template>
  <div class="project-basic-panel">
    <a-spin :spinning="submitting">
      <div class="profile-form-row">
        <label>项目名称</label>
        <div class="profile-form-control">
          <a-input :value="project.projectName" disabled />
        </div>
      </div>

      <div class="profile-form-row">
        <label>负责人</label>
        <div class="profile-form-control">
          <AsyncOptionsSelect
            ref="ownerSelectRef"
            v-model="form.ownerUserId"
            placeholder="请选择负责人"
            select-class="project-basic-select"
            :load-options="loadEnabledUserSelectOptions"
          />
        </div>
      </div>

      <div class="profile-form-row">
        <label>项目说明</label>
        <div class="profile-form-control">
          <a-textarea
            v-model:value="form.description"
            placeholder="请输入项目说明"
            :rows="4"
            allow-clear
          />
        </div>
      </div>

      <div class="profile-form-row">
        <label>所属部门</label>
        <div class="profile-form-control">
          <AsyncOptionsSelect
            ref="departmentSelectRef"
            v-model="form.departmentId"
            placeholder="请选择部门"
            select-class="project-basic-select"
            :load-options="loadEnabledDepartmentSelectOptions"
          />
        </div>
      </div>

      <div class="profile-form-row">
        <label>项目状态</label>
        <div class="profile-form-control">
          <a-select
            v-model:value="form.status"
            :options="PROJECT_STATUS_FORM_OPTIONS"
            class="project-basic-select"
          />
        </div>
      </div>

      <ProfileFormActions
        :submitting="submitting"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { updateProjectBasicInfo } from '@/api/project'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import ProfileFormActions from '@/components/common/ProfileFormActions.vue'
import type { Project, UpdateProjectBasicInfoParams } from '@/types/project'
import { PROJECT_STATUS_FORM_OPTIONS } from '@/utils/projectDisplay'
import {
  loadEnabledDepartmentSelectOptions,
  loadEnabledUserSelectOptions,
} from '@/utils/remoteSelectLoaders'

const props = defineProps<{
  /** 当前项目（来自列表跳转或详情 API） */
  project: Project
}>()

const emit = defineEmits<{
  updated: [project: Project]
}>()

const submitting = ref(false)
const ownerSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)
const departmentSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

const form = reactive<UpdateProjectBasicInfoParams>({
  description: '',
  ownerUserId: '',
  departmentId: '',
  status: 'in_progress',
})

/** 将项目数据同步到表单 */
function syncFormFromProject() {
  form.description = props.project.description
  form.ownerUserId = props.project.ownerUserId
  form.departmentId = props.project.departmentId
  form.status = props.project.status
}

/** 预加载下拉选项，保证当前负责人/部门能正确展示 */
async function prefetchSelectOptions() {
  await Promise.all([
    ownerSelectRef.value?.prefetchOptions(),
    departmentSelectRef.value?.prefetchOptions(),
  ])
}

/** 校验并提交基本信息更新 */
async function handleSubmit() {
  if (!form.ownerUserId) {
    message.warning('请选择负责人')
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
      ownerUserId: form.ownerUserId,
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
    void prefetchSelectOptions()
  },
  { deep: true },
)

onMounted(() => {
  syncFormFromProject()
  void prefetchSelectOptions()
})
</script>

<style scoped>
.project-basic-panel {
  max-width: 560px;
}

.profile-form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
}

.profile-form-row > label {
  width: 88px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 16px;
  padding-top: 6px;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
}

.profile-form-control {
  flex: 1;
  min-width: 0;
  max-width: 360px;
}

.project-basic-select {
  width: 100%;
}
</style>
