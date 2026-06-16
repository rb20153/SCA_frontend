<template>
  <span class="action-cell">
    <router-link :to="directoryTo" class="list-table-link">项目目录</router-link>
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
import { useRouteWithFrom } from '@/composables/useRouteWithFrom'
import type { KbProject, KbVersion } from '@/types/knowledge'

const props = defineProps<{
  version: KbVersion
  /** 版本管理页上下文项目，跳转目录时一并携带供顶部统计卡片展示 */
  kbProject?: KbProject | null
}>()

const { withFrom } = useRouteWithFrom()

/** 项目目录页路由（携带项目 + 版本上下文 + from 供顶栏返回） */
const directoryTo = computed(() =>
  withFrom({
    name: 'KbProjectDirectory',
    params: { kbProjectId: props.version.kbProjectId },
    query: { versionId: props.version.versionId },
    state: {
      kbProject: props.kbProject ?? undefined,
      kbVersion: props.version,
    },
  }),
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
