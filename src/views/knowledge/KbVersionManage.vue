<template>
  <div class="page-container">
    <KbVersionUpdateBar :kb-project-id="kbProjectId" />

    <PageLoading :loading="overviewLoading && !overview">
      <StatCardRow v-if="statItems.length > 0" :items="statItems" :columns="5" />
    </PageLoading>

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && versionList.length === 0">
        <ListEmptyGuide
          v-if="!loading && versionList.length === 0"
          title="暂无版本"
          description="该项目还没有可管理的版本快照"
        />
        <KbVersionTable
          v-else
          :versions="versionList"
          :loading="loading"
          :pagination="pagination"
        />
      </PageLoading>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getKbVersionList, getKbVersionOverview } from '@/api/knowledge'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import KbVersionTable from '@/components/knowledge/KbVersionTable.vue'
import KbVersionUpdateBar from '@/components/knowledge/KbVersionUpdateBar.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import type { StatCardItem } from '@/types/common'
import type { KbProject, KbVersionOverview } from '@/types/knowledge'
import { formatKbVersionDate } from '@/utils/knowledgeVersionDisplay'

const route = useRoute()

const overviewLoading = ref(false)
const overview = ref<KbVersionOverview | null>(null)

/** 路由参数中的知识库项目 ID */
const kbProjectId = computed(() => String(route.params.kbProjectId ?? ''))

/** 列表跳转时通过 history.state 携带的项目信息（刷新后失效） */
const navigationProject = computed<KbProject | undefined>(() => {
  const state = history.state as { kbProject?: KbProject } | null
  if (state?.kbProject?.kbProjectId === kbProjectId.value) {
    return state.kbProject
  }
  return undefined
})

const {
  loading,
  list: versionList,
  pagination,
  refresh,
} = usePaginatedList(
  async (params) => (await getKbVersionList(kbProjectId.value, params)).data,
  { pageSize: 10, immediate: false },
)

/** 顶部 5 项统计卡片数据 */
const statItems = computed<StatCardItem[]>(() => {
  if (!overview.value) return []

  return [
    { key: 'projectName', label: '项目名称', value: overview.value.projectName },
    { key: 'baseline', label: '当前基线', value: overview.value.currentBaseline },
    {
      key: 'managedCount',
      label: '已管理版本',
      value: String(overview.value.managedVersionCount),
    },
    {
      key: 'referencedCount',
      label: '项目数',
      value: String(overview.value.referencedProjectCount),
    },
    {
      key: 'lastFetched',
      label: '最近获取',
      value: formatKbVersionDate(overview.value.lastFetchedAt),
    },
  ]
})

/** 用列表跳转携带的 state 做首屏占位，减少卡片空白 */
function applyNavigationPlaceholder() {
  const nav = navigationProject.value
  if (!nav) return

  overview.value = {
    kbProjectId: nav.kbProjectId,
    projectName: nav.projectName,
    currentBaseline: nav.latestVersion,
    managedVersionCount: nav.versionCount,
    referencedProjectCount: nav.referencedProjectCount,
    lastFetchedAt: nav.updatedAt,
  }
}

/** 拉取版本管理页概览统计 */
async function fetchOverview() {
  overviewLoading.value = true
  try {
    const res = await getKbVersionOverview(kbProjectId.value)
    overview.value = res.data
  } finally {
    overviewLoading.value = false
  }
}

/** 项目 ID 变化时重新拉取概览与版本列表 */
watch(
  kbProjectId,
  async (id) => {
    if (!id) return
    overview.value = null
    applyNavigationPlaceholder()
    await Promise.all([fetchOverview(), refresh()])
  },
  { immediate: true },
)
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.table-card {
  margin-top: 0;
}
</style>
