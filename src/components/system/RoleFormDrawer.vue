<template>
  <a-drawer
    v-model:open="visible"
    :title="mode === 'create' ? '新增角色' : '修改角色'"
    placement="right"
    :width="720"
    destroy-on-close
    :footer-style="{ textAlign: 'right' }"
  >
    <a-form layout="vertical">
      <a-form-item label="角色名称" required>
        <a-input
          v-model:value="form.roleName"
          placeholder="如：项目协作者"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="角色编码" required>
        <a-input
          v-model:value="form.roleCode"
          placeholder="英文标识，如 project_collab"
          :disabled="isRoleCodeReadonly"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="状态">
        <a-select
          v-model:value="form.status"
          :options="ROLE_STATUS_FORM_OPTIONS"
        />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea
          v-model:value="form.remark"
          placeholder="角色职责说明"
          :rows="3"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="授权">
        <RolePermissionTree
          :permissions="form.permissions"
          :builtin-role-code="builtinRoleCode"
          @update:permissions="handlePermissionsUpdate"
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-space>
        <a-button @click="visible = false">取消</a-button>
        <a-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { createRole, updateRole } from '@/api/system'
import RolePermissionTree from '@/components/system/RolePermissionTree.vue'
import { createDefaultCustomRolePermissions } from '@/utils/rolePermissions'
import type { RoleFormValues, RolePermissionMap } from '@/types/system'
import { ROLE_STATUS_FORM_OPTIONS } from '@/utils/roleQuery'
import { isValidRoleCode } from '@/utils/roleValidation'

const props = defineProps<{
  /** 抽屉模式：新增或编辑 */
  mode: 'create' | 'edit'
  /** 编辑时的角色 ID */
  roleId?: string
  /** 编辑时是否为内置角色 */
  isBuiltin?: boolean
  /** 编辑内置角色时的编码（权限树禁用规则用） */
  builtinRoleCode?: string
  /** 编辑时传入的初始表单值 */
  initialValues?: RoleFormValues
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

const form = reactive<RoleFormValues>({
  roleName: '',
  roleCode: '',
  status: 'enabled',
  remark: '',
  permissions: createDefaultCustomRolePermissions(),
})

/** 内置角色编辑时编码不可改 */
const isRoleCodeReadonly = computed(
  () => props.mode === 'edit' && props.isBuiltin === true,
)

/** 将外部初始值同步到表单 */
function syncFormFromProps() {
  if (props.mode === 'create') {
    form.roleName = ''
    form.roleCode = ''
    form.status = 'enabled'
    form.remark = ''
    form.permissions = createDefaultCustomRolePermissions()
    return
  }

  form.roleName = props.initialValues?.roleName ?? ''
  form.roleCode = props.initialValues?.roleCode ?? ''
  form.status = props.initialValues?.status ?? 'enabled'
  form.remark = props.initialValues?.remark ?? ''
  form.permissions = props.initialValues?.permissions
    ? { ...props.initialValues.permissions }
    : createDefaultCustomRolePermissions()
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
    if (visible.value && props.mode === 'edit') {
      syncFormFromProps()
    }
  },
  { deep: true },
)

/** 权限树勾选变更 */
function handlePermissionsUpdate(permissions: RolePermissionMap) {
  form.permissions = permissions
}

/** 校验表单并提交创建或更新 */
async function handleSubmit() {
  const roleName = form.roleName.trim()
  const roleCode = form.roleCode.trim()

  if (!roleName) {
    message.warning('请输入角色名称')
    return
  }

  if (!roleCode) {
    message.warning('请输入角色编码')
    return
  }

  if (!isValidRoleCode(roleCode)) {
    message.warning('角色编码仅允许英文字母与下划线')
    return
  }

  const payload: RoleFormValues = {
    roleName,
    roleCode,
    status: form.status,
    remark: form.remark.trim(),
    permissions: { ...form.permissions },
  }

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await createRole(payload)
      message.success('角色已创建')
    } else {
      if (!props.roleId) {
        message.error('缺少角色 ID')
        return
      }
      await updateRole(props.roleId, payload)
      message.success('角色已更新')
    }
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
