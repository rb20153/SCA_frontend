<template>
  <div class="page-container">
    <PageLoading :loading="loading">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" />
    </PageLoading>

    <a-result
      class="page-placeholder"
      status="info"
      title="更多内容开发中"
      sub-title="分类覆盖、采集方式分布等图表与表格待实现"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getKnowledgeCoverageOverview } from '@/api/knowledge'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import type { StatCardItem } from '@/types/common'
import { mapKnowledgeCoverageToStatCards } from '@/utils/statCard'

const loading = ref(false)
const statCards = ref<StatCardItem[]>([])

/** 拉取覆盖统计页顶部卡片数据 */
async function fetchOverview() {
  loading.value = true
  try {
    const res = await getKnowledgeCoverageOverview()
    statCards.value = mapKnowledgeCoverageToStatCards(res.data)
  } finally {
    loading.value = false
  }
}

onMounted(fetchOverview)
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.page-placeholder {
  margin-top: 24px;
}
</style>
