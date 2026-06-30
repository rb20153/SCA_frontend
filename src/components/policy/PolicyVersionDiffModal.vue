<template>
  <a-modal
    v-model:open="visible"
    title="策略差异对比"
    width="960px"
    destroy-on-close
    :footer="null"
    @cancel="handleClose"
  >
    <PageLoading :loading="loading">
      <PolicyVersionDiffPanels :diff-data="diffData" :load-failed="loadFailed" />

      <div v-if="diffData" class="policy-diff-actions">
        <a-button :loading="exporting" @click="handleExportDiffReport">
          导出差异报告
        </a-button>
      </div>
    </PageLoading>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { exportPolicyVersionDiffReport, getPolicyVersionDiff } from '@/api/policy'
import PageLoading from '@/components/common/PageLoading.vue'
import PolicyVersionDiffPanels from '@/components/policy/PolicyVersionDiffPanels.vue'
import type { PolicyVersionDiffResult, PolicyVersionListItem } from '@/types/policy'
import { triggerReportDownload } from '@/utils/reportDownload'

const props = defineProps<{
  /** 策略 ID */
  policyId: string
  /** 触发对比的版本行；为空时不请求 */
  version: PolicyVersionListItem | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const loading = ref(false)
const loadFailed = ref(false)
const exporting = ref(false)
const diffData = ref<PolicyVersionDiffResult | null>(null)

/** 关闭弹窗时清空已加载的差异数据 */
function handleClose() {
  diffData.value = null
  loadFailed.value = false
}

/** 按当前版本行拉取左右差异摘要 */
async function fetchDiffData() {
  if (!props.version) {
    return
  }

  loading.value = true
  loadFailed.value = false
  diffData.value = null

  try {
    const res = await getPolicyVersionDiff(props.policyId, props.version.versionId)
    if (!res.data) {
      loadFailed.value = true
      return
    }
    diffData.value = res.data
  } finally {
    loading.value = false
  }
}

/** 请求后端导出差异报告并触发下载 */
async function handleExportDiffReport() {
  if (!props.version || !diffData.value) {
    return
  }

  exporting.value = true
  try {
    const res = await exportPolicyVersionDiffReport(
      props.policyId,
      props.version.versionId,
    )
    if (!res.data?.downloadUrl) {
      message.warning('暂无法导出差异报告')
      return
    }
    triggerReportDownload(res.data.downloadUrl, res.data.fileName)
    message.success('差异报告已开始下载')
  } finally {
    exporting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      void fetchDiffData()
      return
    }
    handleClose()
  },
)

watch(
  () => props.version?.versionId,
  () => {
    if (visible.value && props.version) {
      void fetchDiffData()
    }
  },
)
</script>

<style scoped>
.policy-diff-actions {
  margin-top: 16px;
}
</style>
