<template>
  <a href="#" class="list-table-link" @click.prevent="handleView">查看</a>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { CoveragePendingItem } from '@/types/knowledge'

const props = defineProps<{
  item: CoveragePendingItem
}>()

const router = useRouter()

/** 跳转知识库管理并按项目名称筛选 */
function handleView() {
  router.push({
    path: '/knowledge',
    query: { projectName: props.item.projectName },
  })
}
</script>
