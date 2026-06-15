<template>
  <a-modal
    v-model:open="visible"
    title="更换负责人"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="confirm-text">
      是否将项目负责人更换为「{{ member?.realName }}」？原负责人将变为普通成员。
    </p>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { transferProjectOwner } from '@/api/project'
import type { ProjectMember } from '@/types/project'

const props = defineProps<{
  projectId: string
  member: ProjectMember | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: [ownerName: string]
}>()

const submitting = ref(false)

/** 确认更换负责人 */
async function handleOk() {
  if (!props.member) {
    return Promise.reject()
  }

  submitting.value = true
  try {
    await transferProjectOwner(props.projectId, { userId: props.member.userId })
    message.success('负责人已更换')
    visible.value = false
    emit('success', props.member.realName)
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
