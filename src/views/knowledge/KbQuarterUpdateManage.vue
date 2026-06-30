<template>
  <div class="page-container">
    <PageLoading :loading="overviewLoading && statCards.length === 0">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" :columns="4" />
    </PageLoading>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getKbQuarterUpdateOverview } from '@/api/knowledge'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import type { StatCardItem } from '@/types/common'
import { mapKbQuarterUpdateToStatCards } from '@/utils/statCard'

const overviewLoading = ref(false)
const statCards = ref<StatCardItem[]>([])

/** 拉取季度更新管理页顶部统计卡片 */
async function fetchOverview() {
  overviewLoading.value = true
  try {
    const res = await getKbQuarterUpdateOverview()
    statCards.value = mapKbQuarterUpdateToStatCards(res.data)
  } finally {
    overviewLoading.value = false
  }
}

onMounted(() => {
  void fetchOverview()
})
</script>

<style scoped>
.page-container {
  padding: 0;
}
</style>
