<template>
  <div class="profile-panel">
    <a-checkbox-group v-model:value="checkedKeys" class="notify-list">
      <a-checkbox
        v-for="item in NOTIFY_PREFERENCE_OPTIONS"
        :key="item.key"
        :value="item.key"
      >
        {{ item.label }}
      </a-checkbox>
    </a-checkbox-group>

    <div class="profile-actions">
      <a-button type="primary" :loading="submitting" @click="handleSubmit">
        保存偏好
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { updateNotifyPreferences } from '@/api/profile'
import type { MessageNotifyPreferences } from '@/types/profile'
import { NOTIFY_PREFERENCE_OPTIONS } from '@/utils/profileDisplay'

const props = defineProps<{
  preferences: MessageNotifyPreferences
}>()

const emit = defineEmits<{
  updated: [preferences: MessageNotifyPreferences]
}>()

const submitting = ref(false)
const checkedKeys = ref<Array<keyof MessageNotifyPreferences>>([])

/** 将偏好对象转为 checkbox-group 选中键列表 */
function preferencesToCheckedKeys(preferences: MessageNotifyPreferences) {
  return NOTIFY_PREFERENCE_OPTIONS.filter((item) => preferences[item.key]).map(
    (item) => item.key,
  )
}

/** 将 checkbox 选中键还原为偏好对象 */
function checkedKeysToPreferences(
  keys: Array<keyof MessageNotifyPreferences>,
): MessageNotifyPreferences {
  const keySet = new Set(keys)
  return {
    taskComplete: keySet.has('taskComplete'),
    approvalReminder: keySet.has('approvalReminder'),
    alertSummary: keySet.has('alertSummary'),
    reportNotice: keySet.has('reportNotice'),
    systemAnnouncement: keySet.has('systemAnnouncement'),
  }
}

/** 提交消息偏好到后端 */
async function handleSubmit() {
  const payload = checkedKeysToPreferences(checkedKeys.value)
  submitting.value = true
  try {
    const res = await updateNotifyPreferences(payload)
    message.success('消息偏好已保存')
    emit('updated', res.data)
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.preferences,
  (value) => {
    checkedKeys.value = preferencesToCheckedKeys(value)
  },
  { immediate: true, deep: true },
)
</script>

<style scoped>
.profile-panel {
  max-width: 560px;
}

.notify-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-actions {
  margin-top: 24px;
}
</style>
