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
          <a-descriptions-item v-if="detail.sourceModule" label="来源模块">
            <DetailText :text="detail.sourceModule" />
          </a-descriptions-item>
          <a-descriptions-item label="时间">
            {{ formatAlertDateTime(detail.occurredAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="detail.status === 'pending' ? 'warning' : 'success'">
              {{ detail.status === 'pending' ? '未处理' : '已处理' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item v-if="detail.handlerName" label="处理人">
            <DetailText :text="detail.handlerName" />
          </a-descriptions-item>
          <a-descriptions-item v-if="detail.handledAt" label="处理时间">
            {{ formatAlertDateTime(detail.handledAt) }}
          </a-descriptions-item>
          <a-descriptions-item v-if="detail.triggerRule" label="触发规则">
            <DetailText :text="detail.triggerRule" />
          </a-descriptions-item>
          <a-descriptions-item v-if="detail.evidence" label="证据" :span="2">
            <DetailText :text="detail.evidence" />
          </a-descriptions-item>
          <a-descriptions-item v-if="showSuggestions" label="处理建议" :span="2">
            <ul v-if="detail.suggestions.length > 1" class="suggest-list">
              <li v-for="(item, index) in detail.suggestions" :key="index">
                <DetailText :text="item" />
              </li>
            </ul>
            <DetailText v-else :text="detail.suggestions[0]" />
          </a-descriptions-item>
          <a-descriptions-item v-if="detail.content" label="内容" :span="2">
            <DetailText :text="detail.content" />
          </a-descriptions-item>
          <a-descriptions-item v-if="showHandleNote" label="处理记录" :span="2">
            <DetailText :text="detail.handleNote" />
          </a-descriptions-item>
        </a-descriptions>

        <h4 class="section-title">关联任务</h4>
        <div class="section-body">
          <template v-if="hasRelatedTask">
            <router-link
              v-if="detail.relatedTask.taskId"
              :to="
                withFrom(
                  getAlertRelatedTaskRoute(detail.relatedTask.taskId, detail.relatedTask.taskType),
                )
              "
              class="list-table-link detail-link"
            >
              <DetailText :text="relatedTaskLabel" />
            </router-link>
            <DetailText v-else :text="relatedTaskLabel" />
          </template>
          <span v-else class="section-empty">暂无关联任务信息</span>
        </div>

        <h4 class="section-title">关联项目</h4>
        <div class="section-body section-body--last">
          <template v-if="hasRelatedProject">
            <router-link
              :to="withFrom(`/projects/${detail.relatedProject.projectId}`)"
              class="list-table-link detail-link"
            >
              <DetailText :text="relatedProjectLabel" />
            </router-link>
          </template>
          <span v-else class="section-empty">暂无关联项目</span>
        </div>
      </template>
    </PageLoading>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

/** 未处理告警：证据下方展示处理建议 */
const showSuggestions = computed(
  () => detail.value?.status === 'pending' && (detail.value.suggestions.length ?? 0) > 0,
)

/** 已处理告警：展示处理记录，不展示处理建议 */
const showHandleNote = computed(
  () => detail.value?.status === 'handled' && Boolean(detail.value.handleNote),
)

/** taskId、taskName 均为空时视为无关联任务 */
const hasRelatedTask = computed(() => {
  const task = detail.value?.relatedTask
  if (!task) {
    return false
  }
  return Boolean(task.taskId || task.taskName)
})

/** 关联任务展示文案：优先任务名，否则回退 taskId */
const relatedTaskLabel = computed(() => {
  const task = detail.value?.relatedTask
  if (!task) {
    return ''
  }
  return task.taskName || task.taskId
})

const hasRelatedProject = computed(() => Boolean(detail.value?.relatedProject.projectId))

/** 关联项目展示文案：优先项目名，否则回退 projectId */
const relatedProjectLabel = computed(() => {
  const project = detail.value?.relatedProject
  if (!project) {
    return ''
  }
  return project.projectName || project.projectId
})

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

.suggest-list {
  margin: 0;
  padding-left: 20px;
  color: rgba(0, 0, 0, 0.65);
}

.suggest-list li + li {
  margin-top: 8px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.section-body {
  margin-bottom: 20px;
  color: rgba(0, 0, 0, 0.65);
}

.section-body--last {
  margin-bottom: 0;
}

.section-empty {
  color: rgba(0, 0, 0, 0.45);
}
</style>
