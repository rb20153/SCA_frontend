<template>
  <span class="action-cell">
    <router-link :to="itemsTo" class="list-table-link">查看条目</router-link>
    <a
      v-if="isBuiltinVulnSource(source) && canWrite('/knowledge/vulnerabilities')"
      href="#"
      class="list-table-link"
      @click.prevent="emit('sync', source)"
    >
      立即同步
    </a>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { VulnSource } from '@/types/knowledge'
import { isBuiltinVulnSource } from '@/utils/vulnKnowledgeDisplay'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  source: VulnSource
}>()
const { canWrite } = usePagePermission()

const emit = defineEmits<{
  sync: [source: VulnSource]
}>()

/** 漏洞条目页路由（query 携带 sourceId，刷新后仍可筛选） */
const itemsTo = computed(() => ({
  name: 'VulnItemList',
  query: { sourceId: props.source.sourceId },
}))
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
}
</style>
