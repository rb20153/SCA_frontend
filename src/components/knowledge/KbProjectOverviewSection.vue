<template>
  <a-row :gutter="[16, 16]" class="kb-project-overview-section">
    <a-col :xs="24" :lg="8" class="kb-project-overview-section__col">
      <KbProjectCategoryPiePanel ref="categoryPieRef" />
    </a-col>
    <a-col :xs="24" :lg="16" class="kb-project-overview-section__col">
      <KbIntakeTodoPanel ref="intakeTodoRef" />
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import KbIntakeTodoPanel from '@/components/knowledge/KbIntakeTodoPanel.vue'
import KbProjectCategoryPiePanel from '@/components/knowledge/KbProjectCategoryPiePanel.vue'

const categoryPieRef = ref<InstanceType<typeof KbProjectCategoryPiePanel> | null>(null)
const intakeTodoRef = ref<InstanceType<typeof KbIntakeTodoPanel> | null>(null)

/** 增删改项目后刷新顶部分类图与入库待办 */
async function refresh() {
  await Promise.all([
    categoryPieRef.value?.refresh(),
    intakeTodoRef.value?.refresh(),
  ])
}

defineExpose({ refresh })
</script>

<style scoped>
.kb-project-overview-section {
  margin-bottom: 16px;
}

.kb-project-overview-section__col {
  display: flex;
  min-width: 0;
}

.kb-project-overview-section__col > :deep(*) {
  width: 100%;
  min-width: 0;
}

.kb-project-overview-section__col > :deep(.ant-card) {
  flex: 1;
}
</style>
