<template>
  <a-modal
    v-model:open="visible"
    :title="mode === 'create' ? '新增部门' : '修改部门'"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical">
      <a-form-item label="部门名称" required>
        <a-input
          v-model:value="form.departmentName"
          placeholder="请输入部门名称"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="状态">
        <a-select
          v-model:value="form.status"
          :options="DEPARTMENT_STATUS_FORM_OPTIONS"
        />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea
          v-model:value="form.remark"
          placeholder="选填"
          :rows="3"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createDepartment, updateDepartment } from '@/api/system'
import type { DepartmentFormValues } from '@/types/system'
import { DEPARTMENT_STATUS_FORM_OPTIONS } from '@/utils/departmentQuery'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  /** 弹窗模式：新增或编辑 */
  mode: 'create' | 'edit'
  /** 编辑时的部门 ID */
  departmentId?: string
  /** 编辑时传入的初始表单值 */
  initialValues?: DepartmentFormValues
}>()

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

const form = reactive<DepartmentFormValues>({
  departmentName: '',
  status: 'enabled',
  remark: '',
})

/** 将外部初始值同步到表单 */
function syncFormFromProps() {
  form.departmentName = props.initialValues?.departmentName ?? ''
  form.status = props.initialValues?.status ?? 'enabled'
  form.remark = props.initialValues?.remark ?? ''
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
  if (!canWrite('/system/departments')) return Promise.reject()
  if (!form.departmentName.trim()) {
    message.warning('请输入部门名称')
    return Promise.reject()
  }

  const payload: DepartmentFormValues = {
    departmentName: form.departmentName.trim(),
    status: form.status,
    remark: form.remark.trim(),
  }

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await createDepartment(payload)
      message.success('部门已创建')
    } else {
      if (!props.departmentId) {
        message.error('缺少部门 ID')
        return Promise.reject()
      }
      await updateDepartment(props.departmentId, payload)
      message.success('部门已更新')
    }
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
