<template>
  <a-drawer
    v-model:open="visible"
    title="全链路日志详情"
    placement="right"
    :width="720"
    destroy-on-close
  >
    <PageLoading :loading="loading">
      <template v-if="detail">
        <a-descriptions :column="2" bordered size="small" class="log-desc detail-desc">
          <a-descriptions-item label="TraceID" :span="2">
            <DetailText :text="detail.traceId" />
          </a-descriptions-item>
          <a-descriptions-item label="用户">
            <DetailText :text="detail.username" />
          </a-descriptions-item>
          <a-descriptions-item label="结果">
            <a-tag :color="LOG_RESULT_COLOR[detail.result]">
              {{ LOG_RESULT_LABEL[detail.result] }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="来源 IP" :span="2">
            <DetailText :text="detail.sourceIp" />
          </a-descriptions-item>
          <a-descriptions-item label="审计结论" :span="2">
            <DetailText :text="detail.auditConclusion" />
          </a-descriptions-item>
        </a-descriptions>

        <h4 class="section-title">链路时间线</h4>
        <a-card :bordered="false" class="timeline-card">
          <a-timeline>
            <a-timeline-item v-for="(item, index) in detail.timeline" :key="index">
              <span class="timeline-time">{{ item.time }}</span>
              <DetailText :text="item.message" />
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <h4 class="section-title">原始日志（节选）</h4>
        <pre class="raw-log-block">{{ detail.rawLogExcerpt }}</pre>
      </template>
    </PageLoading>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getLogDetail } from '@/api/system'
import DetailText from '@/components/common/DetailText.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { LogDetail } from '@/types/system'
import { LOG_RESULT_COLOR, LOG_RESULT_LABEL } from '@/utils/logDisplay'

const props = defineProps<{
  logId: string | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const loading = ref(false)
const detail = ref<LogDetail | null>(null)

/** 打开抽屉时按 ID 拉取全链路日志详情 */
async function fetchDetail(logId: string) {
  loading.value = true
  detail.value = null
  try {
    const res = await getLogDetail(logId)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => [visible.value, props.logId] as const,
  ([open, logId]) => {
    if (open && logId) {
      fetchDetail(logId)
    }
    if (!open) {
      detail.value = null
    }
  },
)
</script>

<style scoped>
.log-desc {
  margin-bottom: 16px;
}

.detail-desc :deep(.ant-descriptions-item-content) {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.section-title + .timeline-card {
  margin-bottom: 20px;
}

.timeline-card {
  background: #fafafa;
}

.timeline-time {
  display: inline-block;
  min-width: 72px;
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.45);
  font-family: Consolas, Monaco, monospace;
}

.raw-log-block {
  margin: 0;
  padding: 12px 14px;
  background: #1e1e1e;
  border: 1px solid #2d2d2d;
  border-radius: 6px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  color: #d4d4d4;
}
</style>
