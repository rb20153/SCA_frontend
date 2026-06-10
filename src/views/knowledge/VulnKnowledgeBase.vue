<template>
  <div class="page-container">
    <PageLoading :loading="loading">
      <StatCardRow v-if="statCards.length > 0" :items="statCards" />
    </PageLoading>

    <a-result
      class="page-placeholder"
      status="info"
      title="更多内容开发中"
      sub-title="漏洞来源列表、同步操作等待实现"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getVulnKnowledgeOverview } from '@/api/knowledge'
import PageLoading from '@/components/common/PageLoading.vue'
import StatCardRow from '@/components/common/StatCardRow.vue'
import type { StatCardItem } from '@/types/common'
import { mapVulnKnowledgeToStatCards } from '@/utils/statCard'

const loading = ref(false)
const statCards = ref<StatCardItem[]>([])

/** 拉取漏洞知识库页顶部卡片数据 */
async function fetchOverview() {
  loading.value = true
  try {
    const res = await getVulnKnowledgeOverview()
    statCards.value = mapVulnKnowledgeToStatCards(res.data)
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
