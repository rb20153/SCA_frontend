<template>
  <a-modal
    v-model:open="visible"
    title="失败原因"
    :confirm-loading="loading"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-spin :spinning="loading">
      <p class="failure-reason">{{ reason || '暂无失败原因' }}</p>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getReportFailureReason } from '@/api/report'

const props = defineProps<{
  reportId: string
}>()

const visible = defineModel<boolean>('open', { required: true })

const loading = ref(false)
const reason = ref('')

/** 弹窗打开时拉取失败原因 */
async function fetchReason() {
  loading.value = true
  reason.value = ''
  try {
    const res = await getReportFailureReason(props.reportId)
    reason.value = res.data.reason
  } finally {
    loading.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      fetchReason()
    }
  },
)

/** 关闭弹窗 */
function handleOk() {
  visible.value = false
}
</script>

<style scoped>
.failure-reason {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
