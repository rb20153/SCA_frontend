<template>
  <a-modal
    v-model:open="visible"
    title="移除成员"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    ok-type="danger"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="confirm-text">
      是否确认从「{{ projectName }}」项目中移除「{{ member?.realName }}」？
    </p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { removeProjectMember } from '@/api/project'
import type { ProjectMember } from '@/types/project'

const props = defineProps<{
  projectId: string
  projectName: string
  member: ProjectMember | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

/** 确认移除项目成员 */
async function handleOk() {
  if (!props.member) {
    return Promise.reject()
  }

  submitting.value = true
  try {
    await removeProjectMember(props.projectId, props.member.userId)
    message.success('成员已移除')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.confirm-text {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
}
</style>
