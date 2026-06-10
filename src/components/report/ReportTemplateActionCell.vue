<template>
  <span v-if="template.isSystem" class="system-hint">系统默认模版不可操作</span>

  <span v-else class="action-cell">
    <router-link :to="editorPath" class="list-table-link">编辑</router-link>

    <a
      v-if="template.status === 'draft'"
      href="#"
      class="list-table-link"
      @click.prevent="emit('publish', template)"
    >
      发布模板
    </a>

    <a
      v-if="template.status === 'published'"
      href="#"
      class="list-table-link"
      @click.prevent="emit('unpublish', template)"
    >
      取消发布
    </a>

    <a
      v-if="template.status === 'publish_failed'"
      href="#"
      class="list-table-link"
      @click.prevent="emit('failure-reason', template)"
    >
      失败原因
    </a>

    <a
      href="#"
      class="list-table-link list-table-link--danger"
      @click.prevent="emit('delete', template)"
    >
      删除
    </a>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReportTemplate } from '@/types/reportTemplate'

const props = defineProps<{
  template: ReportTemplate
}>()

const emit = defineEmits<{
  delete: [template: ReportTemplate]
  publish: [template: ReportTemplate]
  unpublish: [template: ReportTemplate]
  'failure-reason': [template: ReportTemplate]
}>()

/** 模板编辑器路由 */
const editorPath = computed(() => `/reports/templates/${props.template.templateId}/edit`)
</script>

<style scoped>
.action-cell {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
}

.system-hint {
  color: rgba(0, 0, 0, 0.25);
  font-size: 14px;
}
</style>
