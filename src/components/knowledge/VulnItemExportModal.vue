<template>
  <a-modal
    v-model:open="visible"
    title="导出检索结果"
    :confirm-loading="submitting"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
  >
    <a-form layout="vertical">
      <a-form-item label="导出格式">
        <a-select
          v-model:value="formState.format"
          :options="VULN_ITEM_EXPORT_FORMAT_OPTIONS"
          class="vuln-item-export-select"
        />
      </a-form-item>

      <a-form-item label="导出范围">
        <a-select
          v-model:value="formState.scope"
          :options="VULN_ITEM_EXPORT_SCOPE_OPTIONS"
          class="vuln-item-export-select"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { exportVulnItems } from '@/api/knowledge'
import type {
  VulnItemExportFormat,
  VulnItemExportScope,
  VulnItemOverviewQueryParams,
} from '@/types/knowledge'
import {
  VULN_ITEM_EXPORT_FORMAT_OPTIONS,
  VULN_ITEM_EXPORT_SCOPE_OPTIONS,
} from '@/utils/vulnItemQuery'
import { triggerReportDownload } from '@/utils/reportDownload'

const props = defineProps<{
  /** 当前已生效的列表筛选条件 */
  exportQuery: VulnItemOverviewQueryParams
  currentPage: number
  pageSize: number
}>()

const visible = defineModel<boolean>('open', { required: true })

const submitting = ref(false)

const formState = reactive<{
  format: VulnItemExportFormat
  scope: VulnItemExportScope
}>({
  format: 'csv',
  scope: 'filtered',
})

/** 重置导出表单为默认值 */
function resetForm() {
  formState.format = 'csv'
  formState.scope = 'filtered'
}

/** 提交导出请求并触发浏览器下载 */
async function handleOk() {
  submitting.value = true
  try {
    const res = await exportVulnItems({
      ...props.exportQuery,
      format: formState.format,
      scope: formState.scope,
      ...(formState.scope === 'current_page'
        ? { page: props.currentPage, pageSize: props.pageSize }
        : {}),
    })
    triggerReportDownload(res.data.downloadUrl, res.data.fileName)
    message.success('导出文件已开始下载')
    visible.value = false
  } finally {
    submitting.value = false
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      resetForm()
    }
  },
)
</script>

<style scoped>
.vuln-item-export-select {
  width: 200px;
}
</style>
