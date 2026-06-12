<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    destroy-on-close
    @cancel="handleCancel"
  >
    <a-spin :spinning="checking">
      <p class="delete-message">{{ messageText }}</p>
    </a-spin>

    <template #footer>
      <a-button @click="handleCancel">{{ cancelText }}</a-button>
      <a-button
        v-if="hasMembers !== true"
        type="primary"
        danger
        :loading="submitting"
        :disabled="checking || hasMembers === null"
        @click="handleOk"
      >
        确定
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { checkDepartmentMembers, deleteDepartment } from '@/api/system'
import type { Department } from '@/types/system'

const props = defineProps<{
  /** 待删除部门 */
  department: Department
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  success: []
}>()

const checking = ref(false)
const submitting = ref(false)
const hasMembers = ref<boolean | null>(null)
const memberCount = ref(0)

const modalTitle = computed(() => {
  if (hasMembers.value === true) {
    return '无法删除'
  }
  return '删除部门'
})

const cancelText = computed(() => (hasMembers.value === true ? '关闭' : '取消'))

const messageText = computed(() => {
  if (checking.value) {
    return '正在检查部门成员绑定…'
  }
  if (hasMembers.value === true) {
    return '该部门下有成员绑定，请移除全部成员再操作。'
  }
  return '一旦删除不可恢复，是否确认删除？'
})

/** 打开弹窗时向后端查询成员绑定情况 */
async function loadMemberCheck() {
  checking.value = true
  hasMembers.value = null
  memberCount.value = 0
  try {
    const res = await checkDepartmentMembers(props.department.departmentId)
    hasMembers.value = res.data.hasMembers
    memberCount.value = res.data.memberCount
  } finally {
    checking.value = false
  }
}

watch(
  () => [visible.value, props.department.departmentId] as const,
  ([open]) => {
    if (open) {
      loadMemberCheck()
    } else {
      hasMembers.value = null
      memberCount.value = 0
    }
  },
  { immediate: true },
)

/** 关闭弹窗 */
function handleCancel() {
  visible.value = false
}

/** 无成员时确认删除 */
async function handleOk() {
  if (hasMembers.value !== false) {
    return
  }

  submitting.value = true
  try {
    await deleteDepartment(props.department.departmentId)
    message.success('删除成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.delete-message {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.6;
}
</style>
