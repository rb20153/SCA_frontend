<template>
  <a-modal
    v-model:open="visible"
    :title="mode === 'create' ? '新增项目' : '编辑项目'"
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
      <a-form-item label="负责人">
        <a-input
          v-model:value="form.owner"
          placeholder="请输入负责人"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="所属部门">
        <a-input
          v-model:value="form.department"
          placeholder="请输入所属部门"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createProject, updateProject } from '@/api/project'
import type { ProjectFormValues } from '@/types/project'

const props = defineProps<{
  /** 弹窗模式：新增或编辑 */
  mode: 'create' | 'edit'
  /** 编辑时的项目 ID */
  projectId?: string
  /** 编辑时传入的初始表单值 */
  initialValues?: ProjectFormValues
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

const form = reactive<ProjectFormValues>({
  projectName: '',
  description: '',
  owner: '',
  department: '',
})

/** 将外部初始值同步到表单 */
function syncFormFromProps() {
  form.projectName = props.initialValues?.projectName ?? ''
  form.description = props.initialValues?.description ?? ''
  form.owner = props.initialValues?.owner ?? ''
  form.department = props.initialValues?.department ?? ''
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      syncFormFromProps()
    }
  },
)

watch(
  () => props.initialValues,
  () => {
    if (visible.value) {
      syncFormFromProps()
    }
  },
  { deep: true },
)

/** 校验后调用新增或更新 API */
async function handleOk() {
  if (!form.projectName.trim()) {
    message.warning('请输入项目名称')
    return Promise.reject()
  }

  const payload: ProjectFormValues = {
    projectName: form.projectName.trim(),
    description: form.description.trim(),
    owner: form.owner.trim(),
    department: form.department.trim(),
  }

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await createProject(payload)
      message.success('创建成功')
    } else {
      if (!props.projectId) {
        message.error('缺少项目 ID')
        return Promise.reject()
      }
      await updateProject(props.projectId, payload)
      message.success('保存成功')
    }
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
