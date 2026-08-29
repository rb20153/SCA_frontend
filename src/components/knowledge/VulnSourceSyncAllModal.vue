<template>
  <a-modal
    v-model:open="visible"
    title="全库同步"
    :confirm-loading="submitting"
    :ok-button-props="{ disabled: !preview || submitting }"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-spin :spinning="loading">
      <p v-if="preview" class="sync-all-tip">
        将对 {{ preview.sourceNames.join('、') }} 执行增量同步，预计需要
        {{ preview.estimatedMinutes }} 分钟。
      </p>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getVulnSyncAllPreview, syncAllVulnSources } from '@/api/knowledge'
import type { VulnSyncAllPreview } from '@/types/knowledge'
import { usePagePermission } from '@/composables/usePagePermission'

const visible = defineModel<boolean>('open', { required: true })
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  success: []
}>()

const loading = ref(false)
const submitting = ref(false)
const preview = ref<VulnSyncAllPreview | null>(null)

/** 打开弹窗时拉取全库同步预览 */
async function fetchPreview() {
  loading.value = true
  preview.value = null
  try {
    const res = await getVulnSyncAllPreview()
    preview.value = res.data
  } finally {
    loading.value = false
  }
}

/** 提交全库同步请求 */
async function handleOk() {
  if (!canWrite('/knowledge/vulnerabilities')) return
  // 防止鼠标双击或键盘重复触发 @ok，确保一次弹窗只提交一个同步任务
  if (submitting.value || !preview.value) return

  submitting.value = true
  try {
    await syncAllVulnSources()
    message.success('全库同步任务已提交')
    visible.value = false
    emit('success')
  } catch {
    // 请求层已展示错误信息，组件仅拦截异常以避免 @ok 产生未处理 Promise。
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      fetchPreview()
    } else {
      preview.value = null
    }
  },
)
</script>

<style scoped>
.sync-all-tip {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.6;
}
</style>
