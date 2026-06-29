<template>
  <div class="page-container">
    <PolicyCreateBar @add="openEntryWizard()" />

    <PolicyQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && policyList.length === 0">
        <ListEmptyGuide
          v-if="!loading && policyList.length === 0"
          title="暂无策略"
          description="点击上方「添加策略」创建第一个检测策略"
        />
        <PolicyTable
          v-else
          :policies="policyList"
          :loading="loading"
          :pagination="pagination"
          @edit="openEntryWizard"
          @delete="openDeleteModal"
        />
      </PageLoading>
    </a-card>

    <PolicyEntryWizardModal
      v-model:open="entryWizardVisible"
      :context-policy="entryContextPolicy"
    />

    <PolicyDeleteModal
      v-if="deletingPolicy"
      v-model:open="deleteVisible"
      :policy="deletingPolicy"
      @success="onDeleteSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { getPolicyList } from '@/api/policy'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import PolicyCreateBar from '@/components/policy/PolicyCreateBar.vue'
import PolicyDeleteModal from '@/components/policy/PolicyDeleteModal.vue'
import PolicyEntryWizardModal from '@/components/policy/PolicyEntryWizardModal.vue'
import PolicyQueryBar from '@/components/policy/PolicyQueryBar.vue'
import PolicyTable from '@/components/policy/PolicyTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import type { Policy } from '@/types/policy'
import {
  createEmptyPolicyListFilters,
  policyListFiltersToQuery,
} from '@/utils/policyQuery'

const deleteVisible = ref(false)
const deletingPolicy = ref<Policy | null>(null)
const entryWizardVisible = ref(false)
const entryContextPolicy = ref<Policy | null>(null)

const {
  filterForm,
  loading,
  list: policyList,
  pagination,
  loadPage,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<Policy, ReturnType<typeof createEmptyPolicyListFilters>>(
  async (params) => (await getPolicyList(params)).data,
  {
    createEmptyFilters: createEmptyPolicyListFilters,
    filtersToQuery: policyListFiltersToQuery,
    pageSize: 10,
  },
)

/** 打开添加/编辑策略入口向导 */
function openEntryWizard(policy?: Policy) {
  entryContextPolicy.value = policy ?? null
  entryWizardVisible.value = true
}

/** 打开删除确认弹窗 */
function openDeleteModal(policy: Policy) {
  deletingPolicy.value = policy
  deleteVisible.value = true
}

/** 删除成功后更新列表；若当前页删空且非第一页则回退一页 */
async function onDeleteSuccess() {
  const deletedId = deletingPolicy.value?.policyId
  deletingPolicy.value = null
  message.success('删除成功')

  if (!deletedId) {
    await loadPage()
    return
  }

  policyList.value = policyList.value.filter((item) => item.policyId !== deletedId)
  if (typeof pagination.total === 'number' && pagination.total > 0) {
    pagination.total -= 1
  }

  if (policyList.value.length === 0 && (pagination.current ?? 1) > 1) {
    pagination.current = (pagination.current ?? 1) - 1
    await loadPage()
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100%;
}
</style>
