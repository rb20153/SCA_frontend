<template>
  <a-drawer
    v-model:open="visible"
    title="漏洞条目详情"
    placement="right"
    :width="720"
    destroy-on-close
    :footer="null"
  >
    <PageLoading :loading="loading">
      <template v-if="detail">
        <a-descriptions :column="2" bordered size="small" class="vuln-item-desc detail-desc">
          <a-descriptions-item label="编号">
            <DetailText :text="detail.identifier" />
          </a-descriptions-item>
          <a-descriptions-item label="来源">
            <DetailText :text="detail.sourceName" />
          </a-descriptions-item>
          <a-descriptions-item label="等级">
            <a-tag :color="VULN_ITEM_LEVEL_COLOR[detail.level]">
              {{ VULN_ITEM_LEVEL_LABEL[detail.level] }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="CVSS">
            {{ detail.cvssScore }}
          </a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">
            <DetailText :text="detail.description" />
          </a-descriptions-item>
          <a-descriptions-item label="受影响组件">
            <DetailText :text="detail.affectedComponent" />
          </a-descriptions-item>
          <a-descriptions-item label="修复版本">
            <DetailText :text="detail.fixedVersion" />
          </a-descriptions-item>
        </a-descriptions>

        <section class="reference-links-section">
          <h3 class="reference-links-title">参考链接</h3>
          <a-empty v-if="detail.referenceLinks.length === 0" description="暂无参考链接" :image="false" />
          <div v-else class="reference-links-list">
            <div v-for="link in detail.referenceLinks" :key="`${link.type}-${link.url}`" class="reference-link-row">
              <a :href="link.url" target="_blank" rel="noopener noreferrer" class="reference-link-url">
                {{ link.url }}
              </a>
              <span class="reference-link-type">{{ link.type }}</span>
            </div>
          </div>
        </section>
      </template>
    </PageLoading>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getVulnItemDetail } from '@/api/knowledge'
import DetailText from '@/components/common/DetailText.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { VulnItemDetail } from '@/types/knowledge'
import { VULN_ITEM_LEVEL_COLOR, VULN_ITEM_LEVEL_LABEL } from '@/utils/vulnItemDisplay'

const props = defineProps<{
  itemId: string | null
}>()

const visible = defineModel<boolean>('open', { required: true })

const loading = ref(false)
const detail = ref<VulnItemDetail | null>(null)

/** 打开抽屉时按 ID 拉取条目详情 */
async function fetchDetail(itemId: string) {
  loading.value = true
  detail.value = null
  try {
    const res = await getVulnItemDetail(itemId)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

watch(
  () => [visible.value, props.itemId] as const,
  ([open, itemId]) => {
    if (open && itemId) {
      fetchDetail(itemId)
    }
    if (!open) {
      detail.value = null
    }
  },
)
</script>

<style scoped>
.vuln-item-desc {
  margin-bottom: 0;
}

.detail-desc :deep(.ant-descriptions-item-content) {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.reference-links-section {
  margin-top: 16px;
}

.reference-links-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.reference-links-list {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--ant-color-border-secondary);
}

.reference-link-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  padding: 8px 12px;
  border-bottom: 1px solid var(--ant-color-border-secondary);
}

.reference-link-row:last-child {
  border-bottom: 0;
}

.reference-link-url {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.reference-link-type {
  flex: 0 0 112px;
  color: var(--ant-color-text-secondary);
  overflow-wrap: anywhere;
}
</style>
