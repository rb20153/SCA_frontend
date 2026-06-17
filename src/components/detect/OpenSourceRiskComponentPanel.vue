<template>
  <div class="risk-component-panel">
    <RiskComponentGraph :graph="graphData" @select="handleGraphSelect" />

    <RiskComponentQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && components.length === 0">
        <ListEmptyGuide
          v-if="!loading && components.length === 0"
          title="暂无组件"
          description="当前筛选条件下没有匹配的组件记录"
        />
        <RiskComponentTable
          v-else
          :components="components"
          :loading="loading"
          :pagination="pagination"
          @detail="openDetailDrawer"
          @ignore="openIgnoreModal"
          @revoke-ignore="openRevokeIgnoreModal"
        />
      </PageLoading>
    </a-card>

    <RiskComponentDetailDrawer
      v-model:open="detailDrawerVisible"
      :task-id="taskId"
      :component-id="selectedComponentId"
      @view-vulnerabilities="emit('view-vulnerabilities', $event)"
    />

    <RiskComponentIgnoreModal
      v-model:open="ignoreModalVisible"
      :task-id="taskId"
      :component="actionComponent"
      @success="handleIgnoreSuccess"
    />

    <RiskComponentRevokeIgnoreModal
      v-model:open="revokeIgnoreModalVisible"
      :task-id="taskId"
      :component="actionComponent"
      @success="handleRevokeIgnoreSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getOpenSourceRiskComponentList, getRiskComponentGraph } from '@/api/detect'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import RiskComponentDetailDrawer from '@/components/detect/RiskComponentDetailDrawer.vue'
import RiskComponentGraph from '@/components/detect/RiskComponentGraph.vue'
import RiskComponentIgnoreModal from '@/components/detect/RiskComponentIgnoreModal.vue'
import RiskComponentQueryBar from '@/components/detect/RiskComponentQueryBar.vue'
import RiskComponentRevokeIgnoreModal from '@/components/detect/RiskComponentRevokeIgnoreModal.vue'
import RiskComponentTable from '@/components/detect/RiskComponentTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { OpenSourceRiskComponent, RiskComponentGraph as RiskComponentGraphData } from '@/types/detect'
import {
  createEmptyRiskComponentListFilters,
  riskComponentListFiltersToQuery,
} from '@/utils/openSourceRiskComponentQuery'

const props = defineProps<{
  /** 当前检测任务 ID */
  taskId: string
  /** 组件清单 Tab 是否可见 */
  visible: boolean
}>()

const emit = defineEmits<{
  /** 从抽屉跳转漏洞风险 Tab 并筛选组件 */
  'view-vulnerabilities': [componentName: string]
  /** 忽略/撤销忽略后刷新顶部统计卡片 */
  'summary-changed': []
}>()

const detailDrawerVisible = ref(false)
const ignoreModalVisible = ref(false)
const revokeIgnoreModalVisible = ref(false)
const selectedComponentId = ref<string | null>(null)
const actionComponent = ref<OpenSourceRiskComponent | null>(null)
const graphData = ref<RiskComponentGraphData | null>(null)

/** 打开组件详情抽屉 */
function openDetailDrawer(component: OpenSourceRiskComponent) {
  selectedComponentId.value = component.componentId
  detailDrawerVisible.value = true
}

/** 点击依赖图节点：按 componentId 打开详情抽屉 */
function handleGraphSelect(componentId: string) {
  selectedComponentId.value = componentId
  detailDrawerVisible.value = true
}

/** 拉取组件依赖关系图数据（错误由 axios 拦截器统一处理） */
async function fetchGraph() {
  graphData.value = (await getRiskComponentGraph(props.taskId)).data
}

/** 打开忽略确认弹窗 */
function openIgnoreModal(component: OpenSourceRiskComponent) {
  actionComponent.value = component
  ignoreModalVisible.value = true
}

/** 打开撤销忽略确认弹窗 */
function openRevokeIgnoreModal(component: OpenSourceRiskComponent) {
  actionComponent.value = component
  revokeIgnoreModalVisible.value = true
}

/** 忽略成功后刷新列表并通知父级更新统计 */
async function handleIgnoreSuccess() {
  await loadPage()
  emit('summary-changed')
}

/** 撤销忽略成功后刷新列表并通知父级更新统计 */
async function handleRevokeIgnoreSuccess() {
  await loadPage()
  emit('summary-changed')
}

const {
  filterForm,
  loading,
  list: components,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<
  OpenSourceRiskComponent,
  ReturnType<typeof createEmptyRiskComponentListFilters>
>(
  async (params) =>
    (await getOpenSourceRiskComponentList(props.taskId, params)).data,
  {
    createEmptyFilters: createEmptyRiskComponentListFilters,
    filtersToQuery: riskComponentListFiltersToQuery,
    pageSize: 10,
    immediate: false,
  },
)

watch(
  () => [props.visible, props.taskId] as const,
  ([visible, taskId]) => {
    if (visible && taskId) {
      void loadPage()
      void fetchGraph()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.risk-component-panel {
  min-height: 240px;
}

.table-card {
  margin-bottom: 0;
}
</style>
