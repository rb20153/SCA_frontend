<template>
  <span class="action-cell">
    <router-link :to="directoryPath" class="list-table-link">项目目录</router-link>
    <a
      v-if="version.status === 'ready'"
      href="#"
      class="list-table-link"
      @click.prevent
    >
      更新说明
    </a>
    <a
      v-else-if="version.status === 'indexing'"
      href="#"
      class="list-table-link"
      @click.prevent
    >
      构建日志
    </a>
    <a
      v-else
      href="#"
      class="list-table-link"
      @click.prevent
    >
      恢复
    </a>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KbVersion } from '@/types/knowledge'

const props = defineProps<{
  version: KbVersion
}>()

/** 项目目录页路由 */
const directoryPath = computed(
  () => `/knowledge/${props.version.kbProjectId}/directory`,
)
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
