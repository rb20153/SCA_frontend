<template>
  <a-drawer
    v-model:open="visible"
    title="告警详情"
    placement="right"
    :width="720"
    destroy-on-close
  >
    <PageLoading :loading="loading">
      <template v-if="detail">
        <a-descriptions :column="2" bordered size="small" class="alert-desc detail-desc">
          <a-descriptions-item label="级别">
            <a-tag :color="ALERT_LEVEL_COLOR[detail.level]">
              {{ ALERT_LEVEL_LABEL[detail.level] }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="标题">
            <DetailText :text="detail.title" />
          </a-descriptions-item>
          <a-descriptions-item label="触发规则">
            <DetailText :text="detail.triggerRule" />
          </a-descriptions-item>
          <a-descriptions-item label="时间">
            {{ formatAlertDateTime(detail.occurredAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="内容" :span="2">
            <DetailText :text="detail.content" />
          </a-descriptions-item>
          <a-descriptions-item v-if="detail.relatedTask" label="关联任务">
            <router-link
              :to="
                withFrom(
                  getAlertRelatedTaskRoute(detail.relatedTask.taskId, detail.relatedTask.taskType),
                )
              "
              class="list-table-link detail-link"
            >
              <DetailText :text="detail.relatedTask.taskName" />
            </router-link>
          </a-descriptions-item>
          <a-descriptions-item v-if="detail.relatedProject" label="关联项目">
            <router-link
              :to="withFrom(`/projects/${detail.relatedProject.projectId}`)"
              class="list-table-link detail-link"
            >
              <DetailText :text="detail.relatedProject.projectName" />
            </router-link>
          </a-descriptions-item>
        </a-descriptions>

        <a-card v-if="detail.suggestions.length > 0" :bordered="false" class="suggest-card">
          <h4 class="suggest-title">处理建议</h4>
          <ul class="suggest-list">
            <li v-for="(item, index) in detail.suggestions" :key="index">
              <DetailText :text="item" />
            </li>
          </ul>
        </a-card>
      </template>
    </PageLoading>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAlertDetail } from '@/api/system'
import { useRouteWithFrom } from '@/composables/useRouteWithFrom'
import DetailText from '@/components/common/DetailText.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { AlertDetail } from '@/types/system'
import {
  ALERT_LEVEL_COLOR,
  ALERT_LEVEL_LABEL,
  formatAlertDateTime,
  getAlertRelatedTaskRoute,
} from '@/utils/alertDisplay'

const props = defineProps<{
  alertId: string | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const { withFrom } = useRouteWithFrom()

const loading = ref(false)
const detail = ref<AlertDetail | null>(null)

/** 打开抽屉时按 ID 拉取详情 */
async function fetchDetail(alertId: string) {
  loading.value = true
  detail.value = null
  try {
    const res = await getAlertDetail(alertId)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => [visible.value, props.alertId] as const,
  ([open, alertId]) => {
    if (open && alertId) {
      fetchDetail(alertId)
    }
    if (!open) {
      detail.value = null
    }
  },
)
</script>

<style scoped>
.alert-desc {
  margin-bottom: 16px;
}

.detail-desc :deep(.ant-descriptions-item-content) {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.detail-link {
  display: inline-block;
  max-width: 100%;
}

.suggest-card {
  background: #fafafa;
}

.suggest-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.suggest-list {
  margin: 0;
  padding-left: 20px;
  color: rgba(0, 0, 0, 0.65);
}

.suggest-list li + li {
  margin-top: 8px;
}
</style>
