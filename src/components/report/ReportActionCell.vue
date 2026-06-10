<template>
  <span class="action-cell">
    <template v-if="report.status === 'completed'">
      <a href="#" class="list-table-link" @click.prevent>查看</a>
      <a href="#" class="list-table-link" @click.prevent="handleDownload">下载</a>
    </template>

    <a
      v-if="report.status === 'failed'"
      href="#"
      class="list-table-link"
      @click.prevent="emit('failure-reason', report)"
    >
      失败原因
    </a>

    <a
      href="#"
      class="list-table-link list-table-link--danger"
      @click.prevent="emit('delete', report)"
    >
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { getReportDownloadUrl } from '@/api/report'
import type { Report } from '@/types/report'
import { triggerReportDownload } from '@/utils/reportDownload'

const props = defineProps<{
  report: Report
}>()

const emit = defineEmits<{
  delete: [report: Report]
  'failure-reason': [report: Report]
}>()

const downloading = ref(false)

/** 获取下载链接并触发浏览器下载 */
async function handleDownload() {
  if (downloading.value) return

  downloading.value = true
  try {
    const res = await getReportDownloadUrl(props.report.reportId)
    triggerReportDownload(res.data.url, res.data.fileName)
    message.success('已开始下载')
  } catch {
    message.error('获取下载链接失败')
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
}
</style>
