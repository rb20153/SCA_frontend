<template>
  <a-modal
    v-model:open="visible"
    :title="mode === 'create' ? '新增用户' : '修改用户'"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    width="720px"
    @ok="handleOk"
  >
    <a-spin :spinning="optionsLoading">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="用户名" required>
              <a-input
                v-model:value="form.username"
                placeholder="登录名，创建后不可改"
                :disabled="mode === 'edit'"
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="姓名" required>
              <a-input
                v-model:value="form.realName"
                placeholder="真实姓名"
                allow-clear
              />
            </a-form-item>
          </a-col>

          <a-col v-if="mode === 'create'" :span="12">
            <a-form-item label="初始密码" required>
              <a-input-group compact class="password-group">
                <a-input
                  v-model:value="form.password"
                  readonly
                  class="password-input"
                />
                <a-button @click="regeneratePassword">重新生成</a-button>
              </a-input-group>
            </a-form-item>
          </a-col>

          <a-col :span="mode === 'create' ? 12 : 12">
            <a-form-item label="部门" required>
              <AsyncOptionsSelect
                ref="departmentSelectRef"
                v-model="form.departmentId"
                placeholder="请选择部门"
                select-class="user-form-select"
                :load-options="loadEnabledDepartmentSelectOptions"
              />
            </a-form-item>
          </a-col>

          <a-col :span="12">
            <a-form-item label="系统角色" required>
              <a-select
                v-model:value="form.roleId"
                placeholder="请选择系统角色"
                :options="roleSelectOptions"
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号" required>
              <a-input
                v-model:value="form.phone"
                placeholder="11 位手机号"
                allow-clear
                maxlength="11"
              />
            </a-form-item>
          </a-col>

          <a-col :span="12">
            <a-form-item label="状态">
              <a-select
                v-model:value="form.status"
                :options="USER_STATUS_FORM_OPTIONS"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  createUser,
  getEnabledRoleOptions,
  updateUser,
} from '@/api/user'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import type { RoleOption, UserFormValues } from '@/types/user'
import { loadEnabledDepartmentSelectOptions } from '@/utils/remoteSelectLoaders'
import { generateInitialPassword } from '@/utils/passwordGenerator'
import { USER_STATUS_FORM_OPTIONS } from '@/utils/userDisplay'
import { isValidPhone, isValidUsername } from '@/utils/userValidation'

const props = defineProps<{
  /** 弹窗模式：新增或编辑 */
  mode: 'create' | 'edit'
  /** 编辑时的用户 ID */
  userId?: string
  /** 编辑时传入的初始表单值 */
  initialValues?: UserFormValues
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const optionsLoading = ref(false)
const roleOptions = ref<RoleOption[]>([])
const departmentSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

const form = reactive<UserFormValues>({
  username: '',
  realName: '',
  password: '',
  departmentId: '',
  roleId: '',
  phone: '',
  status: 'enabled',
})

const roleSelectOptions = computed(() =>
  roleOptions.value.map((item) => ({
    label: item.roleName,
    value: item.roleId,
  })),
)

/** 重新生成 8 位初始密码 */
function regeneratePassword() {
  form.password = generateInitialPassword(8)
}

/** 拉取启用状态的角色下拉 */
async function loadRoleOptions() {
  optionsLoading.value = true
  try {
    const roleRes = await getEnabledRoleOptions()
    roleOptions.value = roleRes.data
  } finally {
    optionsLoading.value = false
  }
}

/** 编辑模式下预加载部门下拉，保证回填显示正确 */
async function prefetchDepartmentOptions() {
  if (!form.departmentId) {
    return
  }
  await departmentSelectRef.value?.prefetchOptions()
}

/** 将外部初始值同步到表单 */
function syncFormFromProps() {
  if (props.mode === 'create') {
    form.username = ''
    form.realName = ''
    form.password = generateInitialPassword(8)
    form.departmentId = ''
    form.roleId = ''
    form.phone = ''
    form.status = 'enabled'
    return
  }

  form.username = props.initialValues?.username ?? ''
  form.realName = props.initialValues?.realName ?? ''
  form.password = ''
  form.departmentId = props.initialValues?.departmentId ?? ''
  form.roleId = props.initialValues?.roleId ?? ''
  form.phone = props.initialValues?.phone ?? ''
  form.status = props.initialValues?.status ?? 'enabled'
}

watch(
  () => visible.value,
  async (open) => {
    if (open) {
      syncFormFromProps()
      departmentSelectRef.value?.resetOptions()
      await loadRoleOptions()
      await prefetchDepartmentOptions()
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

/** 校验后调用新增或更新 API */
async function handleOk() {
  const username = form.username.trim()
  const realName = form.realName.trim()
  const phone = form.phone.trim()

  if (!username) {
    message.warning('请输入用户名')
    return Promise.reject()
  }
  if (!isValidUsername(username)) {
    message.warning('用户名为 4-20 位字母或数字')
    return Promise.reject()
  }
  if (!realName) {
    message.warning('请输入姓名')
    return Promise.reject()
  }
  if (props.mode === 'create' && !form.password) {
    message.warning('初始密码不能为空')
    return Promise.reject()
  }
  if (!form.departmentId) {
    message.warning('请选择部门')
    return Promise.reject()
  }
  if (!form.roleId) {
    message.warning('请选择系统角色')
    return Promise.reject()
  }
  if (!isValidPhone(phone)) {
    message.warning('请输入正确的 11 位手机号')
    return Promise.reject()
  }

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await createUser({
        username,
        realName,
        password: form.password,
        departmentId: form.departmentId,
        roleId: form.roleId,
        phone,
        status: form.status,
      })
      message.success('用户已创建')
    } else {
      if (!props.userId) {
        message.error('缺少用户 ID')
        return Promise.reject()
      }
      await updateUser(props.userId, {
        realName,
        departmentId: form.departmentId,
        roleId: form.roleId,
        phone,
        status: form.status,
      })
      message.success('用户已更新')
    }
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.password-group {
  display: flex;
  width: 100%;
}

.password-input {
  flex: 1;
}

.user-form-select {
  width: 100%;
}
</style>
