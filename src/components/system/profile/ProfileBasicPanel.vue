<template>
  <div class="profile-panel">
    <a-spin :spinning="optionsLoading">
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
          <a-select
            v-model:value="form.departmentId"
            placeholder="请选择部门"
            :options="departmentSelectOptions"
            allow-clear
            show-search
            option-filter-prop="label"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getProfileDepartmentOptions, updateUserProfile } from '@/api/profile'
import type { ProfileDepartmentOption, UserProfile } from '@/types/profile'
import { isValidPhone } from '@/utils/userValidation'

const props = defineProps<{
  profile: UserProfile
}>()

const emit = defineEmits<{
  updated: [profile: UserProfile]
  cancel: []
}>()

const optionsLoading = ref(false)
const submitting = ref(false)
const departmentOptions = ref<ProfileDepartmentOption[]>([])

const form = reactive({
  realName: '',
  phone: '',
  departmentId: '',
})

const departmentSelectOptions = computed(() =>
  departmentOptions.value.map((item) => ({
    label: item.departmentName,
    value: item.departmentId,
  })),
)

/** 将父级 profile 同步到表单 */
function syncFormFromProfile() {
  form.realName = props.profile.realName
  form.phone = props.profile.phone
  form.departmentId = props.profile.departmentId
}

/** 拉取全部部门下拉 */
async function loadDepartmentOptions() {
  optionsLoading.value = true
  try {
    const res = await getProfileDepartmentOptions()
    departmentOptions.value = res.data
  } finally {
    optionsLoading.value = false
  }
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
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  loadDepartmentOptions()
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
