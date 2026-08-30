<template>
  <div class="page-container">
    <PageLoading :loading="overviewLoading && !overview">
      <StatCardRow v-if="statItems.length > 0" :items="statItems" />
    </PageLoading>

    <div class="page-actions">
      <a-button v-if="canWrite('/policies')" type="primary" @click="openEntryWizard">更新策略</a-button>
    </div>

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && versionList.length === 0">
        <ListEmptyGuide
          v-if="!loading && versionList.length === 0"
          title="暂无版本"
          description="提交发布申请后将在此展示版本记录"
        />
        <PolicyVersionTable
          v-else
          :versions="versionList"
          :loading="loading"
          :pagination="pagination"
          @diff="openDiffModal"
          @approve="openApprovalDrawer"
          @export="openExportModal"
          @rollback="openRollbackModal"
        />
      </PageLoading>
    </a-card>

    <PolicyEntryWizardModal
      v-model:open="entryWizardVisible"
      :context-policy="contextPolicy"
    />

    <PolicyVersionDiffModal
      v-model:open="diffModalVisible"
      :policy-id="policyId"
      :version="diffTargetVersion"
    />

    <PolicyVersionApprovalDrawer
      v-model:open="approvalDrawerVisible"
      :policy-id="policyId"
      :version="approvalTargetVersion"
      @success="handleVersionListRefresh"
    />

    <PolicyVersionExportModal
      v-model:open="exportModalVisible"
      :policy-id="policyId"
      :version="exportTargetVersion"
    />

    <PolicyVersionRollbackModal
      v-model:open="rollbackModalVisible"
      :policy-id="policyId"
      :version="rollbackTargetVersion"
      @success="handleVersionListRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import { getPolicyById, getPolicyGovernanceOverview, getPolicyVersionList } from '@/api/policy'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import PolicyEntryWizardModal from '@/components/policy/PolicyEntryWizardModal.vue'
import PolicyVersionApprovalDrawer from '@/components/policy/PolicyVersionApprovalDrawer.vue'
import PolicyVersionDiffModal from '@/components/policy/PolicyVersionDiffModal.vue'
import PolicyVersionExportModal from '@/components/policy/PolicyVersionExportModal.vue'
import PolicyVersionRollbackModal from '@/components/policy/PolicyVersionRollbackModal.vue'
import PolicyVersionTable from '@/components/policy/PolicyVersionTable.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { usePagePermission } from '@/composables/usePagePermission'
import type { StatCardItem } from '@/types/common'
import type { Policy, PolicyGovernanceOverview, PolicyVersionListItem } from '@/types/policy'
import { mapPolicyGovernanceToStatCards } from '@/utils/policyVersionDisplay'

const route = useRoute()
const { canApprovePolicy, canWrite } = usePagePermission()

const overviewLoading = ref(false)
const overview = ref<PolicyGovernanceOverview | null>(null)
const contextPolicy = ref<Policy | null>(null)
const entryWizardVisible = ref(false)
const diffModalVisible = ref(false)
const diffTargetVersion = ref<PolicyVersionListItem | null>(null)
const approvalDrawerVisible = ref(false)
const approvalTargetVersion = ref<PolicyVersionListItem | null>(null)
const exportModalVisible = ref(false)
const exportTargetVersion = ref<PolicyVersionListItem | null>(null)
const rollbackModalVisible = ref(false)
const rollbackTargetVersion = ref<PolicyVersionListItem | null>(null)

/** 路由参数中的策略 ID */
const policyId = computed(() => String(route.params.policyId ?? ''))

/** 列表跳转时通过 history.state 携带的策略信息（刷新后失效） */
const navigationPolicy = computed<Policy | undefined>(() => {
  const state = history.state as { policy?: Policy } | null
  if (state?.policy?.policyId === policyId.value) {
    return state.policy
  }
  return undefined
})

const {
  loading,
  list: versionList,
  pagination,
  loadPage,
} = usePaginatedList(
  async (params) => (await getPolicyVersionList(policyId.value, params)).data,
  { pageSize: 10, immediate: false },
)

/** 顶部统计卡片数据 */
const statItems = computed<StatCardItem[]>(() => {
  if (!overview.value) {
    return []
  }
  return mapPolicyGovernanceToStatCards(overview.value)
})

/** 用列表跳转 state 做概览首屏占位，减少卡片空白 */
function applyNavigationPlaceholder() {
  const nav = navigationPolicy.value
  if (!nav) {
    return
  }

  contextPolicy.value = nav
  overview.value = {
    policyId: nav.policyId,
    policyName: nav.policyName,
    currentVersion: '—',
    pendingCount: 0,
    lastChangedAt: nav.updatedAt,
  }
}

/** 拉取版本与审批页概览统计 */
async function fetchOverview() {
  overviewLoading.value = true
  try {
    const res = await getPolicyGovernanceOverview(policyId.value)
    overview.value = res.data
  } finally {
    overviewLoading.value = false
  }
}

/** 刷新后无 state 时兜底策略摘要（供统计卡片与更新策略入口使用） */
async function ensureContextPolicy() {
  if (contextPolicy.value?.policyId === policyId.value) {
    return
  }

  const res = await getPolicyById(policyId.value)
  if (!res.data) {
    return
  }

  contextPolicy.value = res.data

  if (overview.value && overview.value.policyName === '—') {
    overview.value = {
      ...overview.value,
      policyName: res.data.policyName,
    }
  }
}

/** 打开更新策略入口向导（策略编辑器 / 导入策略） */
function openEntryWizard() {
  if (!canWrite('/policies')) return
  if (!contextPolicy.value) {
    message.warning('策略信息加载中，请稍后重试')
    return
  }

  entryWizardVisible.value = true
}

/** 打开策略版本差异对比弹窗 */
function openDiffModal(version: PolicyVersionListItem) {
  diffTargetVersion.value = version
  diffModalVisible.value = true
}

/** 打开待审批版本的发布审批抽屉 */
function openApprovalDrawer(version: PolicyVersionListItem) {
  if (!canApprovePolicy()) return
  approvalTargetVersion.value = version
  approvalDrawerVisible.value = true
}

/** 打开策略版本导出弹窗 */
function openExportModal(version: PolicyVersionListItem) {
  exportTargetVersion.value = version
  exportModalVisible.value = true
}

/** 打开策略版本回滚确认弹窗 */
function openRollbackModal(version: PolicyVersionListItem) {
  if (!canWrite('/policies')) return
  if (version.status !== 'history') {
    message.warning('仅历史版本可回滚')
    return
  }
  rollbackTargetVersion.value = version
  rollbackModalVisible.value = true
}

/** 审批或回滚成功后刷新概览与当前页版本列表 */
async function handleVersionListRefresh() {
  approvalTargetVersion.value = null
  rollbackTargetVersion.value = null
  await Promise.all([fetchOverview(), loadPage()])
}

/** 策略 ID 变化时重新加载概览与版本列表 */
async function reloadPageData() {
  contextPolicy.value = null
  applyNavigationPlaceholder()
  pagination.current = 1
  await Promise.all([fetchOverview(), loadPage()])
  await ensureContextPolicy()
  const approvalVersionId = route.query.approvalVersionId
  if (typeof approvalVersionId === 'string' && approvalVersionId) {
    const target = versionList.value.find((item) => item.versionId === approvalVersionId)
    if (target?.status === 'pending' && canApprovePolicy()) {
      approvalTargetVersion.value = target
      approvalDrawerVisible.value = true
    }
  }
}

watch(
  policyId,
  () => {
    void reloadPageData()
  },
  { immediate: true },
)
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.page-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.table-card {
  margin-top: 0;
}
</style>
