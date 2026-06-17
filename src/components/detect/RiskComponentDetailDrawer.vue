<template>
  <a-drawer
    v-model:open="visible"
    title="组件详情"
    placement="right"
    :width="560"
    destroy-on-close
    :footer="null"
  >
    <PageLoading :loading="loading">
      <template v-if="detail">
        <a-descriptions :column="1" bordered size="small" class="component-detail-desc">
          <a-descriptions-item label="组件">
            {{ detail.componentName }}@{{ detail.version }}
          </a-descriptions-item>
          <a-descriptions-item label="许可证">
            <DetailText :text="detail.license" />
          </a-descriptions-item>
          <a-descriptions-item label="来源">
            {{ TASK_SOURCE_MODE_LABEL[detail.sourceMode] }}
          </a-descriptions-item>
          <a-descriptions-item label="识别依据">
            <DetailText :text="detail.identifyBasisDetail" />
          </a-descriptions-item>
          <a-descriptions-item label="关联漏洞">
            <span>{{ detail.relatedVulnerabilityCount }} 条</span>
            <template v-if="detail.relatedVulnerabilityCount > 0">
              <span class="related-vuln-divider">·</span>
              <a href="#" class="list-table-link" @click.prevent="handleViewVulnerabilities">
                查看漏洞
              </a>
            </template>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </PageLoading>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getOpenSourceRiskComponentDetail } from '@/api/detect'
import DetailText from '@/components/common/DetailText.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { OpenSourceRiskComponentDetail } from '@/types/detect'
import { TASK_SOURCE_MODE_LABEL } from '@/utils/taskDisplay'

const props = defineProps<{
  /** 当前任务 ID */
  taskId: string
  /** 要查看的组件 ID；为空时不请求 */
  componentId: string | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  /** 跳转漏洞风险 Tab 并按组件名筛选 */
  'view-vulnerabilities': [componentName: string]
}>()

const loading = ref(false)
const detail = ref<OpenSourceRiskComponentDetail | null>(null)

/** 打开抽屉时拉取组件详情 */
async function fetchDetail() {
  if (!props.componentId) {
    detail.value = null
    return
  }

  loading.value = true
  detail.value = null
  try {
    const res = await getOpenSourceRiskComponentDetail(props.taskId, props.componentId)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

/** 关闭抽屉并通知父级跳转漏洞 Tab */
function handleViewVulnerabilities() {
  if (!detail.value) {
    return
  }
  const componentName = detail.value.componentName
  visible.value = false
  emit('view-vulnerabilities', componentName)
}

watch(
  () => [visible.value, props.componentId, props.taskId] as const,
  ([open, componentId]) => {
    if (open && componentId) {
      void fetchDetail()
    }
    if (!open) {
      detail.value = null
    }
  },
)
</script>

<style scoped>
.component-detail-desc {
  margin-bottom: 0;
}

.component-detail-desc :deep(.ant-descriptions-item-content) {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.related-vuln-divider {
  margin: 0 8px;
  color: rgba(0, 0, 0, 0.25);
}
</style>
