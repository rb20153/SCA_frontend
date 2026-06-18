<template>
  <div class="page-container">
    <div class="policy-name-stat">
      <StatCard label="策略" :value="policyName" />
    </div>

    <PolicyRuleHitQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && hitList.length === 0">
        <ListEmptyGuide
          v-if="!loading && hitList.length === 0"
          title="暂无命中记录"
          description="当前筛选条件下没有规则命中追溯记录"
        />
        <PolicyRuleHitTable
          v-else
          :hits="hitList"
          :loading="loading"
          :pagination="pagination"
          @detail="openDetailDrawer"
        />
      </PageLoading>
    </a-card>

    <PolicyRuleHitDetailDrawer
      v-model:open="detailVisible"
      :hit-id="viewingHitId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getPolicyById, getPolicyRuleHitList } from '@/api/policy'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCard from '@/components/common/StatCard.vue'
import PolicyRuleHitDetailDrawer from '@/components/policy/PolicyRuleHitDetailDrawer.vue'
import PolicyRuleHitQueryBar from '@/components/policy/PolicyRuleHitQueryBar.vue'
import PolicyRuleHitTable from '@/components/policy/PolicyRuleHitTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { Policy, PolicyRuleHitListItem } from '@/types/policy'
import {
  createEmptyPolicyRuleHitListFilters,
  policyRuleHitListFiltersToQuery,
} from '@/utils/policyRuleHitQuery'

const route = useRoute()

const policyName = ref('—')
const detailVisible = ref(false)
const viewingHitId = ref<string | null>(null)

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
  filterForm,
  loading,
  list: hitList,
  pagination,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<
  PolicyRuleHitListItem,
  ReturnType<typeof createEmptyPolicyRuleHitListFilters>
>(
  async (params) =>
    (await getPolicyRuleHitList({ ...params, policyId: policyId.value })).data,
  {
    createEmptyFilters: createEmptyPolicyRuleHitListFilters,
    filtersToQuery: policyRuleHitListFiltersToQuery,
    pageSize: 10,
    immediate: false,
  },
)

/** 解析顶部策略名：优先路由 state，刷新后 API 兜底 */
async function resolvePolicyName() {
  if (navigationPolicy.value) {
    policyName.value = navigationPolicy.value.policyName
    return
  }

  const res = await getPolicyById(policyId.value)
  policyName.value = res.data?.policyName ?? '—'
}

/** 打开命中追溯详情抽屉 */
function openDetailDrawer(hit: PolicyRuleHitListItem) {
  viewingHitId.value = hit.hitId
  detailVisible.value = true
}

onMounted(async () => {
  await resolvePolicyName()
  await handleSearch()
})
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.policy-name-stat {
  max-width: 320px;
  margin-bottom: 16px;
}

.table-card {
  margin-top: 0;
}
</style>
