<template>
  <div class="autonomy-evidence-section">
    <h4 class="section-title">
      {{ title }}
      <span v-if="count > 0" class="evidence-count">{{ count }}</span>
    </h4>

    <a-empty
      v-if="count === 0"
      class="evidence-empty"
      :description="emptyDescription"
    />

    <template v-else>
      <div class="evidence-list" :class="evidenceListClass">
        <a-card
          v-for="(item, index) in visibleItems"
          :key="item.evidenceId"
          :bordered="false"
          class="evidence-block"
        >
          <slot name="item" :item="item" :sequence="displaySequence(index)">
            <div class="evidence-block__placeholder">
              <span class="evidence-block__label">证据 {{ displaySequence(index) }}</span>
              <span class="evidence-block__hint">内容待实现</span>
            </div>
          </slot>
        </a-card>
      </div>

      <div v-if="usePagination" class="evidence-pagination-wrap">
        <a-pagination
          v-model:current="currentPage"
          :total="items.length"
          :page-size="itemsPerPage"
          size="small"
          :show-size-changer="false"
          :show-total="paginationShowTotal"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 区块标题，如「代码检测证据」 */
    title: string
    /** 证据条数，展示在标题旁 */
    count: number
    /** 证据条目（接口一次性返回全量，前端分页切片展示） */
    items: Array<{ evidenceId: string }>
    /**
     * 每页展示条数
     * - 代码检测证据：1
     * - 指纹检测证据：2
     */
    itemsPerPage?: number
    /**
     * 超过该条数时启用分页
     * - 代码：1（>1 即分页）
     * - 指纹：2（>2 即分页）
     */
    paginationThreshold: number
    /** 无证据时的空态文案 */
    emptyDescription?: string
    /** 证据种类：用于指纹区块高度变量与代码证据 min-height 联动 */
    evidenceVariant?: 'code' | 'fingerprint'
  }>(),
  {
    itemsPerPage: 1,
    evidenceVariant: 'code',
  },
)

const currentPage = ref(1)

/** 证据列表容器 class（指纹区块使用更紧凑的高度变量） */
const evidenceListClass = computed(() =>
  props.evidenceVariant === 'fingerprint' ? 'evidence-list--fingerprint' : undefined,
)

/** 是否启用底部分页（证据条数超过阈值） */
const usePagination = computed(() => props.items.length > props.paginationThreshold)

/** 当前页在完整列表中的起始下标 */
const pageStartIndex = computed(() => {
  if (!usePagination.value) {
    return 0
  }
  return (currentPage.value - 1) * props.itemsPerPage
})

/** 当前应展示的证据列表（客户端分页切片，不额外请求接口） */
const visibleItems = computed(() => {
  if (!usePagination.value) {
    return props.items
  }
  const start = pageStartIndex.value
  return props.items.slice(start, start + props.itemsPerPage)
})

/** 分页器「共 N 条」文案 */
function paginationShowTotal(total: number) {
  return `共 ${total} 条`
}

/** 卡片上展示的证据全局序号 */
function displaySequence(localIndex: number): number {
  return pageStartIndex.value + localIndex + 1
}

/** 切换文件或证据列表变化时回到第 1 页 */
watch(
  () => props.items.map((item) => item.evidenceId).join(','),
  () => {
    currentPage.value = 1
  },
)
</script>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.autonomy-evidence-section:first-child .section-title {
  margin-top: 0;
}

.evidence-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  font-size: 13px;
  font-weight: 500;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 11px;
}

.evidence-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* 指纹卡片约 meta + 描述 + 卡片 padding，供代码证据 min-height 计算 */
  --evidence-fp-item-height: 168px;
}

.evidence-list--fingerprint {
  --evidence-fp-item-height: 110px;
}

.evidence-block {
  background: #fafafa;
}

.evidence-block__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 120px;
  color: rgba(0, 0, 0, 0.45);
}

.evidence-block__label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
}

.evidence-block__hint {
  font-size: 13px;
}

.evidence-empty {
  margin: 8px 0 0;
}

.evidence-pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
