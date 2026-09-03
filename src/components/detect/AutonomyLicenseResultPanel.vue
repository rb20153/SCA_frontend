<template>
  <PageLoading :loading="loading && !result">
    <a-alert v-if="error" type="error" show-icon message="许可证取证结果加载失败" class="provenance-alert">
      <template #description>
        <a-button size="small" @click="fetchResult">重新加载</a-button>
      </template>
    </a-alert>

    <a-empty v-if="!loading && !result && !error" description="暂无许可证取证结果" />

    <template v-else-if="result">
      <div class="license-summary-grid">
        <a-card size="small"><a-statistic title="项目声明来源" :value="displayCount(result.summary.projectDeclaredCount)" /></a-card>
        <a-card size="small"><a-statistic title="匹配来源许可证" :value="displayCount(result.summary.matchedSourceCount)" /></a-card>
        <a-card size="small"><a-statistic title="项目许可证种类" :value="result.summary.projectLicenseIds.length" /></a-card>
        <a-card size="small"><a-statistic title="来源许可证种类" :value="result.summary.sourceLicenseIds.length" /></a-card>
        <a-card size="small"><a-statistic title="未知项目来源" :value="displayCount(result.summary.unknownProjectSourceCount)" /></a-card>
        <a-card size="small"><a-statistic title="未知匹配来源" :value="displayCount(result.summary.unknownMatchedSourceCount)" /></a-card>
      </div>

      <section v-if="licenseLimitations.length" class="license-section license-section--limitations">
        <h3>许可证取证说明</h3>
        <a-card :bordered="false" class="conflicts-card">
          <ul class="conflicts-list">
            <li v-for="item in licenseLimitations" :key="item">{{ item }}</li>
          </ul>
        </a-card>
      </section>

      <section class="license-section">
        <h3>项目交付物声明</h3>
        <a-table
          v-if="result.projectDeclared.length"
          :columns="declaredColumns"
          :data-source="result.projectDeclared"
          :pagination="false"
          :scroll="{ x: 1280 }"
          row-key="id"
          size="small"
        />
        <a-empty v-else description="暂无项目自身许可证声明" />
      </section>

      <section class="license-section">
        <h3>相似来源库许可证</h3>
        <a-table
          v-if="result.matchedSources.length"
          :columns="matchedColumns"
          :data-source="result.matchedSources"
          :pagination="false"
          :scroll="{ x: 1000 }"
          row-key="repoId"
          size="small"
        />
        <a-empty v-else description="暂无相似来源库匹配记录" />
      </section>

    </template>
  </PageLoading>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { TableColumnsType } from 'ant-design-vue'
import { getAutonomyDetectLicenseResult } from '@/api/detect'
import type { AutonomyLicenseResult } from '@/types/detect'
import PageLoading from '@/components/common/PageLoading.vue'

const props = defineProps<{ taskId: string }>()
const loading = ref(false)
const result = ref<AutonomyLicenseResult | null>(null)
const error = ref(false)

const declaredColumns: TableColumnsType<AutonomyLicenseResult['projectDeclared'][number]> = [
  { title: '许可证', dataIndex: 'licenseId', key: 'licenseId', width: 150 },
  { title: '证据文件', dataIndex: 'filePath', key: 'filePath', width: 180, ellipsis: true },
  { title: '交付物', dataIndex: 'artifactId', key: 'artifactId', width: 240, ellipsis: true },
  { title: '来源类型', dataIndex: 'sourceType', key: 'sourceType', width: 120 },
  { title: '组件', key: 'component', width: 280, customRender: ({ record }) => `${record.component.name || '—'}${record.component.version ? `@${record.component.version}` : ''}` },
  { title: '依赖范围', dataIndex: 'dependencyScope', key: 'dependencyScope', width: 120 },
  { title: '依赖层级', key: 'dependencyDepth', width: 110, customRender: ({ record }) => record.dependencyDepth == null ? '未知' : record.dependencyDepth },
  { title: '证据', key: 'evidence', width: 220, customRender: ({ record }) => record.evidence ? `${record.evidence.jsonPointer || '无指针'} · ${record.evidence.contentAvailable ? '已读取' : '未读取'}` : '—' },
]
const matchedColumns: TableColumnsType<AutonomyLicenseResult['matchedSources'][number]> = [
  { title: '许可证', dataIndex: 'licenseId', key: 'licenseId', width: 150 },
  { title: '来源库', dataIndex: 'repoId', key: 'repoId', ellipsis: true },
  { title: '来源文件', dataIndex: 'sourceFile', key: 'sourceFile', ellipsis: true },
  { title: '组件', key: 'component', width: 220, customRender: ({ record }) => `${record.componentName || '—'}${record.componentVersion ? `@${record.componentVersion}` : ''}` },
  { title: '复核状态', dataIndex: 'reviewStatus', key: 'reviewStatus', width: 120 },
]

const licenseLimitations = computed(() => {
  if (!result.value) return []
  const artifactLimitations = result.value.artifacts
    .filter((item) => item.limitationReason || item.status !== 'completed')
    .map((item) => `${item.filePath || '未知交付物'}：${item.limitationReason || item.status || '状态未知'}`)
  return [...new Set([...result.value.limitations, ...artifactLimitations])]
})

function displayCount(value: number | null): string | number {
  return value == null ? '未知' : value
}

async function fetchResult() {
  loading.value = true
  error.value = false
  try {
    const response = await getAutonomyDetectLicenseResult(props.taskId)
    result.value = response.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchResult)
</script>

<style scoped>
.provenance-alert { margin-bottom: 16px; }
.license-summary-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
.license-section { margin-top: 20px; }
.license-section--limitations { margin-top: 0; }
.license-section h3 { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
.conflicts-card { background: #fafafa; }
.conflicts-list { margin: 0; padding-left: 20px; color: rgba(0, 0, 0, 0.65); font-size: 14px; line-height: 1.8; }
@media (max-width: 1200px) { .license-summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 768px) { .license-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
