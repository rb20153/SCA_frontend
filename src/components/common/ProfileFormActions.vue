<template>
  <div class="profile-form-actions">
    <a-button type="primary" :loading="submitting" @click="emit('submit')">
      {{ submitText }}
    </a-button>
    <a-button :disabled="submitting" @click="emit('cancel')">{{ cancelText }}</a-button>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 提交按钮 loading */
    submitting?: boolean
    /** 主按钮文案 */
    submitText?: string
    /** 次按钮文案 */
    cancelText?: string
    /** 与左侧 label 列对齐时的左内边距 */
    labelOffset?: string
  }>(),
  {
    submitting: false,
    submitText: '更新基本信息',
    cancelText: '取消修改',
    labelOffset: '88px',
  },
)

const emit = defineEmits<{
  submit: []
  cancel: []
}>()
</script>

<style scoped>
.profile-form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  padding-left: v-bind(labelOffset);
}
</style>
