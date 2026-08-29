<template>
  <a-modal
    v-model:open="visible"
    title="删除策略"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    :ok-type="canDelete ? 'danger' : 'primary'"
    destroy-on-close
    @ok="handleOk"
  >
    <p class="delete-hint">
      {{ canDelete ? '是否删除？' : '删除策略前需先解绑项目' }}
    </p>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { deletePolicy } from '@/api/policy'
import type { Policy } from '@/types/policy'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  policy: Policy
}>()

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  success: []
}>()

const submitting = ref(false)

/** 引用项目数为 0 时才允许删除 */
const canDelete = computed(() => props.policy.referencedProjectCount === 0)

/** 可删除时调 API；被引用时仅关闭弹窗 */
async function handleOk() {
  if (!canWrite('/policies')) return
  if (!canDelete.value) {
    visible.value = false
    return
  }

  submitting.value = true
  try {
    await deletePolicy(props.policy.policyId)
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.delete-hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
}
</style>
