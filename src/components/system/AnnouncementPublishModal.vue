<template>
  <a-modal
    v-if="authStore.isAdmin"
    v-model:open="visible"
    title="发布公告"
    ok-text="发布"
    :confirm-loading="submitting"
    destroy-on-close
    @ok="submit"
  >
    <a-spin :spinning="optionsLoading">
      <a-form layout="vertical">
        <a-form-item label="公告标题" required>
          <a-input v-model:value="title" :maxlength="50" />
        </a-form-item>
        <a-form-item label="公告正文" required>
          <a-textarea v-model:value="content" :rows="5" :maxlength="1000" show-count />
        </a-form-item>
        <a-form-item label="接收范围" required>
          <a-select v-model:value="audienceType" :options="audienceOptions" />
        </a-form-item>
        <a-form-item v-if="audienceType === 'role'" label="选择角色" required>
          <a-select
            v-model:value="audienceIds"
            mode="multiple"
            placeholder="请选择角色"
            :options="roleOptions"
            allow-clear
          />
        </a-form-item>
        <a-form-item v-if="audienceType === 'department'" label="选择部门" required>
          <a-select
            v-model:value="audienceIds"
            mode="multiple"
            placeholder="请选择部门"
            :options="departmentOptions"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getEnabledDepartmentOptions, getEnabledRoleOptions } from '@/api/user'
import { publishSystemAnnouncement } from '@/api/siteMessage'
import { useAuthStore } from '@/stores/auth'

const visible = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ success: [] }>()
const authStore = useAuthStore()
const title = ref('')
const content = ref('')
const audienceType = ref<'all' | 'role' | 'department'>('all')
const audienceIds = ref<string[]>([])
const submitting = ref(false)
const optionsLoading = ref(false)
const roleOptions = ref<Array<{ label: string; value: string }>>([])
const departmentOptions = ref<Array<{ label: string; value: string }>>([])
const audienceOptions = [
  { value: 'all', label: '全体用户' },
  { value: 'role', label: '指定角色' },
  { value: 'department', label: '指定部门' },
]
const requiresAudienceSelection = computed(() => audienceType.value !== 'all')

async function loadAudienceOptions() {
  optionsLoading.value = true
  try {
    const [roleRes, departmentRes] = await Promise.all([
      getEnabledRoleOptions(),
      getEnabledDepartmentOptions(),
    ])
    roleOptions.value = roleRes.data.map((item) => ({ label: item.roleName, value: item.roleId }))
    departmentOptions.value = departmentRes.data.map((item) => ({
      label: item.departmentName,
      value: item.departmentId,
    }))
  } finally {
    optionsLoading.value = false
  }
}

async function submit() {
  if (!authStore.isAdmin) return Promise.reject()
  if (!title.value.trim() || !content.value.trim()) {
    message.warning('请填写公告标题和正文')
    return Promise.reject()
  }
  if (requiresAudienceSelection.value && audienceIds.value.length === 0) {
    message.warning(audienceType.value === 'role' ? '请选择角色' : '请选择部门')
    return Promise.reject()
  }
  submitting.value = true
  try {
    await publishSystemAnnouncement({
      title: title.value.trim(),
      content: content.value.trim(),
      audienceType: audienceType.value,
      audienceIds: [...audienceIds.value],
    })
    message.success('公告已发布')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (!open) return
    if (!authStore.isAdmin) {
      visible.value = false
      return
    }
    title.value = ''
    content.value = ''
    audienceType.value = 'all'
    audienceIds.value = []
    void loadAudienceOptions()
  },
)

watch(audienceType, () => { audienceIds.value = [] })
</script>
