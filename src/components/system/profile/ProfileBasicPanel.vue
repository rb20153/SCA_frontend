<template>
  <div class="profile-panel">
    <a-spin :spinning="submitting">
      <div class="profile-form-row">
        <label>姓名</label>
        <div class="profile-form-control">
          <a-input v-model:value="form.realName" placeholder="请输入姓名" allow-clear />
        </div>
      </div>

      <div class="profile-form-row">
        <label>用户名</label>
        <div class="profile-form-control">
          <a-input :value="profile.username" disabled />
        </div>
      </div>

      <div class="profile-form-row">
        <label>手机号</label>
        <div class="profile-form-control">
          <a-input
            v-model:value="form.phone"
            placeholder="11 位手机号"
            allow-clear
            maxlength="11"
          />
        </div>
      </div>

      <div class="profile-form-row">
        <label>部门</label>
        <div class="profile-form-control">
          <AsyncOptionsSelect
            ref="departmentSelectRef"
            v-model="form.departmentId"
            placeholder="请选择部门"
            select-class="profile-department-select"
            :load-options="loadProfileDepartmentSelectOptions"
          />
        </div>
      </div>

      <div class="profile-form-row">
        <label>角色</label>
        <div class="profile-form-control profile-role-readonly">
          <a-tag color="blue">{{ profile.roleName }}</a-tag>
          <span class="role-hint">系统角色由管理员分配，个人不可修改</span>
        </div>
      </div>

      <div class="profile-actions">
        <a-button type="primary" :loading="submitting" @click="handleSubmit">
          更新基本信息
        </a-button>
        <a-button :disabled="submitting" @click="handleCancel">取消修改</a-button>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { updateUserProfile } from '@/api/profile'
import AsyncOptionsSelect from '@/components/common/AsyncOptionsSelect.vue'
import type { UserProfile } from '@/types/profile'
import { loadProfileDepartmentSelectOptions } from '@/utils/remoteSelectLoaders'
import { isValidPhone } from '@/utils/userValidation'

const props = defineProps<{
  profile: UserProfile
}>()

const emit = defineEmits<{
  updated: [profile: UserProfile]
  cancel: []
}>()

const submitting = ref(false)
const departmentSelectRef = ref<InstanceType<typeof AsyncOptionsSelect> | null>(null)

const form = reactive({
  realName: '',
  phone: '',
  departmentId: undefined as string | undefined,
})

/** 将父级 profile 同步到表单 */
function syncFormFromProfile() {
  form.realName = props.profile.realName
  form.phone = props.profile.phone
  form.departmentId = props.profile.departmentId
}

/** 预加载部门下拉，保证编辑态能正确展示当前部门名称 */
async function prefetchDepartmentOptions() {
  if (!form.departmentId) {
    return
  }
  await departmentSelectRef.value?.prefetchOptions()
}

/** 校验并提交基本信息更新 */
async function handleSubmit() {
  const realName = form.realName.trim()
  if (!realName) {
    message.warning('请输入姓名')
    return
  }
  if (realName.length < 2 || realName.length > 20) {
    message.warning('姓名长度为 2-20 个字符')
    return
  }
  if (!isValidPhone(form.phone)) {
    message.warning('请输入正确的 11 位手机号')
    return
  }
  if (!form.departmentId) {
    message.warning('请选择部门')
    return
  }

  submitting.value = true
  try {
    const res = await updateUserProfile({
      realName,
      phone: form.phone.trim(),
      departmentId: form.departmentId,
    })
    message.success('基本信息已更新')
    emit('updated', res.data)
  } catch (error) {
    const msg = error instanceof Error ? error.message : '更新失败'
    message.error(msg)
  } finally {
    submitting.value = false
  }
}

/** 取消修改，恢复为进入页面时的资料 */
function handleCancel() {
  syncFormFromProfile()
  emit('cancel')
}

watch(
  () => props.profile,
  () => {
    syncFormFromProfile()
    prefetchDepartmentOptions()
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  prefetchDepartmentOptions()
})
</script>

<style scoped>
.profile-panel {
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

.profile-department-select {
  width: 100%;
}

.profile-role-readonly {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 4px;
}

.role-hint {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.profile-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  padding-left: 88px;
}
</style>
