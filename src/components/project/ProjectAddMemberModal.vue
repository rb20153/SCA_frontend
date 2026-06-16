<template>
  <a-modal
    v-model:open="visible"
    title="添加成员"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    :ok-button-props="{ disabled: !selectedUser }"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical">
      <a-form-item label="选择用户" required>
        <UserSearchInput
          ref="userSearchRef"
          v-model="selectedUser"
          placeholder="请输入用户姓名"
          :search-users="searchProjectUsers"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { addProjectMember, searchProjectMemberCandidates } from '@/api/project'
import UserSearchInput from '@/components/common/UserSearchInput.vue'
import type { UserSearchCandidate } from '@/types/user'

const props = defineProps<{
  projectId: string
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)
const selectedUser = ref<UserSearchCandidate | null>(null)
const userSearchRef = ref<InstanceType<typeof UserSearchInput> | null>(null)

/** 搜索可添加成员（排除已在项目中的用户） */
async function searchProjectUsers(keyword: string) {
  const res = await searchProjectMemberCandidates(props.projectId, keyword)
  return res.data
}

/** 确认添加成员 */
async function handleOk() {
  if (!selectedUser.value) {
    message.warning('请从列表中选择用户')
    return Promise.reject()
  }

  submitting.value = true
  try {
    await addProjectMember(props.projectId, { userId: selectedUser.value.userId })
    message.success('添加成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (!open) {
      userSearchRef.value?.reset()
    }
  },
)
</script>
