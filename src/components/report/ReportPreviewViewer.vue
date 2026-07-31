<template>
  <div class="report-preview-viewer">
    <PageLoading :loading="loading" class="report-preview-viewer__loading">
      <!-- 加载失败 -->
      <a-result
        v-if="error"
        status="error"
        title="报告预览加载失败"
        :sub-title="error"
      >
        <template #extra>
          <a-button type="primary" @click="loadPreview">重试</a-button>
        </template>
      </a-result>

      <!-- HTML 报告：iframe 沙箱内嵌 -->
      <iframe
        v-else-if="preview?.format === 'html'"
        :src="preview.url"
        class="report-preview-viewer__frame"
        sandbox="allow-same-origin"
        title="报告预览"
      />

      <!-- PDF 报告：使用浏览器内置 PDF viewer，零依赖嵌入预览 -->
      <iframe
        v-else-if="preview?.format === 'pdf'"
        :src="preview.url"
        class="report-preview-viewer__frame"
        title="PDF 报告预览"
      />
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

import { getReportPreview } from '@/api/report'
import PageLoading from '@/components/common/PageLoading.vue'
import type { ReportPreview } from '@/types/report'
import { resolveAuthenticatedPreviewUrl } from '@/utils/reportDownload'

const props = defineProps<{
  /** 报告 ID；为空时不加载 */
  reportId: string | null
  /** 抽屉是否打开，控制何时拉取预览 */
  active: boolean
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const preview = ref<ReportPreview | null>(null)

/** 当前 iframe 使用的 blob URL，卸载或重新加载时需释放 */
let objectUrlToRevoke: string | null = null

/** 释放上一次生成的 blob URL，避免内存泄漏 */
function revokePreviewObjectUrl() {
  if (objectUrlToRevoke) {
    URL.revokeObjectURL(objectUrlToRevoke)
    objectUrlToRevoke = null
  }
}

/**
 * 拉取报告预览；同源 /api 地址会先带 Token 拉成 blob URL 再给 iframe，
 * 避免 iframe 无法携带 Authorization 导致 401 白屏
 */
async function loadPreview() {
  if (!props.reportId) {
    preview.value = null
    return
  }
  loading.value = true
  error.value = null
  preview.value = null
  revokePreviewObjectUrl()
  try {
    const res = await getReportPreview(props.reportId)
    const resolvedUrl = await resolveAuthenticatedPreviewUrl(res.data.url)
    if (resolvedUrl.startsWith('blob:')) {
      objectUrlToRevoke = resolvedUrl
    }
    preview.value = {
      ...res.data,
      url: resolvedUrl,
    }
  } catch {
    error.value = '无法获取报告预览，请稍后重试'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.active, props.reportId] as const,
  ([active, reportId]) => {
    if (active && reportId) {
      void loadPreview()
    }
    if (!active) {
      preview.value = null
      error.value = null
      revokePreviewObjectUrl()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  revokePreviewObjectUrl()
})
</script>

<style scoped>
.report-preview-viewer {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.report-preview-viewer__loading {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.report-preview-viewer__loading :deep(.ant-spin-container),
.report-preview-viewer__loading :deep(.page-loading__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.report-preview-viewer__frame {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 220px);
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fff;
}
</style>
