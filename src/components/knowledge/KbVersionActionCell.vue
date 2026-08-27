<template>
  <span class="action-cell">
    <router-link
      v-if="version.status !== 'indexing'"
      :to="directoryTo"
      class="list-table-link"
    >
      项目目录
    </router-link>

    <a
      v-if="version.status === 'ready'"
      href="#"
      class="list-table-link"
      @click.prevent="updateNotesVisible = true"
    >
      更新说明
    </a>

    <router-link
      v-else-if="version.status === 'indexing'"
      :to="buildLogPath"
      class="list-table-link"
    >
      构建日志
    </router-link>

    <a
      v-else-if="version.status === 'archived'"
      href="#"
      class="list-table-link"
      @click.prevent="restoreVisible = true"
    >
      恢复
    </a>

    <KbVersionUpdateNotesModal
      v-model:open="updateNotesVisible"
      :version="version"
    />

    <KbVersionRestoreModal
      v-model:open="restoreVisible"
      :version="version"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouteWithFrom } from '@/composables/useRouteWithFrom'
import KbVersionRestoreModal from '@/components/knowledge/KbVersionRestoreModal.vue'
import KbVersionUpdateNotesModal from '@/components/knowledge/KbVersionUpdateNotesModal.vue'
import type { KbProject, KbVersion } from '@/types/knowledge'
import { buildLogListTracePath } from '@/utils/knowledgeVersionDisplay'
import { createNavigationState } from '@/utils/navigation'

const props = defineProps<{
  version: KbVersion
  /** 版本管理页上下文项目，跳转目录时一并携带供顶部统计卡片展示 */
  kbProject?: KbProject | null
}>()

const { withFrom } = useRouteWithFrom()

const updateNotesVisible = ref(false)
const restoreVisible = ref(false)

/** 项目目录页路由（携带项目 + 版本上下文 + from 供顶栏返回） */
const directoryTo = computed(() =>
  withFrom({
    name: 'KbProjectDirectory',
    params: { kbProjectId: props.version.kbProjectId },
    query: { versionId: props.version.versionId },
    state: createNavigationState({
      kbProject: props.kbProject ?? undefined,
      kbVersion: props.version,
    }),
  }),
)

/** 构建日志跳转路径（日志页按 TraceID 自动查询） */
const buildLogPath = computed(() => {
  const traceId = props.version.indexBuildTraceId?.trim()
  if (!traceId) {
    return '/system/logs'
  }
  return buildLogListTracePath(traceId)
})
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
