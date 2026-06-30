<template>

  <div class="page-container">

    <PageLoading :loading="projectLoading && !projectContext">

      <StatCardRow v-if="statItems.length > 0" :items="statItems" :columns="5" />

    </PageLoading>



    <KbProjectDirectoryQueryBar

      v-model="filterForm"

      :kb-project-id="kbProjectId"

      :default-version-label="defaultVersionLabel"

      @search="handleSearch"
      @reset="handleReset"
      @expand-all="handleExpandAll"
      @collapse-all="handleCollapseAll"
    />



    <div class="directory-layout">

      <a-card :bordered="false" class="directory-tree-card">

        <template #title>

          <div class="panel-head">

            <span class="panel-title">目录树</span>

            <span class="panel-hint">Linux 风格目录展开</span>

          </div>

        </template>

        <PageLoading :loading="treeLoading && treeNodes.length === 0">

          <LinuxStyleFileTree
            ref="directoryTreeRef"
            v-model:selected-file-id="selectedFileId"
            :nodes="treeNodes"
            :loading="treeLoading"
          />

        </PageLoading>

      </a-card>



      <a-card :bordered="false" class="directory-detail-card" title="文件详情">

        <template #extra>

          <a-button
            v-if="selectedFileId"
            type="primary"
            :loading="exporting"
            @click="handleExportMetadata"
          >
            导出元数据
          </a-button>

        </template>

        <div class="directory-detail-body">

          <a-empty v-if="!selectedFileId" description="请选择左侧文件" />

          <KbProjectFileDetailPanel
            v-else
            :kb-project-id="kbProjectId"
            :version-id="appliedQuery?.versionId"
            :file-node-id="selectedFileId"
          />

        </div>

      </a-card>

    </div>

  </div>

</template>



<script setup lang="ts">

import { computed, reactive, ref, watch } from 'vue'

import { message } from 'ant-design-vue'

import { useRoute } from 'vue-router'

import {

  exportKbProjectFileMetadata,

  getKbProjectDetail,

  getKbProjectDirectoryTree,

  getKbVersionOverview,

  getKbVersionSelectOptions,

} from '@/api/knowledge'

import LinuxStyleFileTree from '@/components/common/LinuxStyleFileTree.vue'

import PageLoading from '@/components/common/PageLoading.vue'

import StatCardRow from '@/components/common/StatCardRow.vue'

import KbProjectDirectoryQueryBar from '@/components/knowledge/KbProjectDirectoryQueryBar.vue'

import KbProjectFileDetailPanel from '@/components/knowledge/KbProjectFileDetailPanel.vue'

import type { StatCardItem } from '@/types/common'

import type { FileTreeNode } from '@/types/fileTree'

import type { KbProject, KbProjectDirectoryQueryParams, KbVersion } from '@/types/knowledge'

import {

  KB_COLLECT_MODE_LABEL,

  KB_PROJECT_CATEGORY_LABEL,

  formatKbProjectDateTime,

} from '@/utils/knowledgeDisplay'

import {

  createEmptyKbProjectDirectoryFilters,

  kbProjectDirectoryFiltersToQuery,

} from '@/utils/kbProjectDirectoryQuery'

import { triggerReportDownload } from '@/utils/reportDownload'



const route = useRoute()



const appliedQuery = ref<KbProjectDirectoryQueryParams | null>(null)

const projectLoading = ref(false)

const projectContext = ref<KbProject | null>(null)

const treeLoading = ref(false)

const treeNodes = ref<FileTreeNode[]>([])

const selectedFileId = ref<string>()
const directoryTreeRef = ref<InstanceType<typeof LinuxStyleFileTree> | null>(null)
const exporting = ref(false)



/** 路由参数中的知识库项目 ID */

const kbProjectId = computed(() => String(route.params.kbProjectId ?? ''))



/** 列表 / 版本管理跳转时通过 history.state 携带的项目信息（刷新后失效） */

const navigationProject = computed<KbProject | undefined>(() => {

  const state = history.state as { kbProject?: KbProject } | null

  if (state?.kbProject?.kbProjectId === kbProjectId.value) {

    return state.kbProject

  }

  return undefined

})



/** 版本管理列表跳转时携带的版本信息（刷新后失效） */

const navigationVersion = computed<KbVersion | undefined>(() => {

  const state = history.state as { kbVersion?: KbVersion } | null

  if (state?.kbVersion?.kbProjectId === kbProjectId.value) {

    return state.kbVersion

  }

  return undefined

})



/** 版本下拉默认展示号（跳转携带或项目 latestVersion 占位） */

const defaultVersionLabel = computed(

  () => navigationVersion.value?.versionNo ?? projectContext.value?.latestVersion,

)



/** 将 kbProject 映射为顶部 5 项统计卡片 */

function mapProjectToStatItems(project: KbProject): StatCardItem[] {

  return [

    { key: 'projectName', label: '项目名称', value: project.projectName },

    { key: 'latestVersion', label: '最新版本', value: project.latestVersion },

    {

      key: 'collectMode',

      label: '采集方式',

      value: KB_COLLECT_MODE_LABEL[project.collectMode],

    },

    {

      key: 'category',

      label: '分类',

      value: KB_PROJECT_CATEGORY_LABEL[project.category],

    },

    {

      key: 'updatedAt',

      label: '最近更新',

      value: formatKbProjectDateTime(project.updatedAt),

    },

  ]

}



/** 顶部统计卡片：优先 navigation state，否则使用 API 兜底数据 */

const statItems = computed<StatCardItem[]>(() => {

  if (!projectContext.value) {

    return []

  }

  return mapProjectToStatItems(projectContext.value)

})



const filterForm = reactive(createEmptyKbProjectDirectoryFilters())



/**

 * 解析默认版本 ID：优先跳转携带，其次当前基线，再次列表 latestVersion

 */

async function resolveDefaultVersionId(): Promise<string> {

  const navVersion = navigationVersion.value

  if (navVersion) {

    return navVersion.versionId

  }



  const queryVersionId = route.query.versionId

  if (typeof queryVersionId === 'string' && queryVersionId) {

    return queryVersionId

  }



  const [optionsRes, overviewRes] = await Promise.all([

    getKbVersionSelectOptions(kbProjectId.value),

    getKbVersionOverview(kbProjectId.value),

  ])



  const baselineMatch = optionsRes.data.find(

    (item) => item.versionNo === overviewRes.data.currentBaseline,

  )

  if (baselineMatch) {

    return baselineMatch.versionId

  }



  const navProject = projectContext.value

  if (navProject?.latestVersion) {

    const latestMatch = optionsRes.data.find(

      (item) => item.versionNo === navProject.latestVersion,

    )

    if (latestMatch) {

      return latestMatch.versionId

    }

  }



  return optionsRes.data[0]?.versionId ?? ''

}



/** 解析项目上下文：优先上一页 state，缺失时调 getKbProjectDetail 兜底 */

async function resolveProjectContext() {

  const nav = navigationProject.value

  if (nav) {

    projectContext.value = nav

    return

  }



  projectLoading.value = true

  try {

    const res = await getKbProjectDetail(kbProjectId.value)

    projectContext.value = res.data

  } catch {

    projectContext.value = null

  } finally {

    projectLoading.value = false

  }

}



/** 拉取目录树（依赖 appliedQuery 中的版本与关键字） */

async function fetchDirectoryTree() {

  const query = appliedQuery.value

  if (!query?.versionId) {

    treeNodes.value = []

    selectedFileId.value = undefined

    return

  }



  treeLoading.value = true

  try {

    const res = await getKbProjectDirectoryTree(query)

    treeNodes.value = res.data.nodes

  } finally {

    treeLoading.value = false

  }

}



/** 按路由与跳转上下文初始化页面数据 */

async function initPage() {

  if (!kbProjectId.value) {

    return

  }



  projectContext.value = null

  await resolveProjectContext()

  await initFilters()

}



/** 按路由与跳转上下文初始化筛选表单 */

async function initFilters() {

  if (!kbProjectId.value) {

    return

  }



  filterForm.keyword = ''

  filterForm.versionId = await resolveDefaultVersionId()

  appliedQuery.value = kbProjectDirectoryFiltersToQuery(filterForm, kbProjectId.value)

}



/** 提交查询并刷新目录树 */

function handleSearch() {

  appliedQuery.value = kbProjectDirectoryFiltersToQuery(filterForm, kbProjectId.value)

}



/** 重置关键字与版本并刷新目录树 */

async function handleReset() {

  filterForm.keyword = ''

  filterForm.versionId = await resolveDefaultVersionId()

  appliedQuery.value = kbProjectDirectoryFiltersToQuery(filterForm, kbProjectId.value)

}

/** 展开目录树全部子级 */
function handleExpandAll() {
  directoryTreeRef.value?.expandAll()
}

/** 折叠目录树至第一级（仅根目录展开） */
function handleCollapseAll() {
  directoryTreeRef.value?.collapseToFirstLevel()
}

/** 请求后端导出当前选中文件元数据并触发下载 */
async function handleExportMetadata() {
  const versionId = appliedQuery.value?.versionId
  const fileNodeId = selectedFileId.value
  if (!kbProjectId.value || !versionId || !fileNodeId) {
    return
  }

  exporting.value = true
  try {
    const res = await exportKbProjectFileMetadata({
      kbProjectId: kbProjectId.value,
      versionId,
      fileNodeId,
    })
    triggerReportDownload(res.data.downloadUrl, res.data.fileName)
    message.success('元数据导出已开始下载')
  } finally {
    exporting.value = false
  }
}

watch(kbProjectId, () => {

  void initPage()

}, { immediate: true })



watch(appliedQuery, () => {

  void fetchDirectoryTree()

}, { deep: true })

</script>



<style scoped>

.page-container {

  min-height: 100%;

}



.directory-layout {

  display: grid;

  grid-template-columns: minmax(240px, 1fr) minmax(0, 3fr);

  gap: 16px;

  align-items: stretch;

}



.directory-tree-card,

.directory-detail-card {

  min-height: 360px;

  display: flex;

  flex-direction: column;

}



.directory-tree-card :deep(.ant-card-body),

.directory-detail-card :deep(.ant-card-body) {

  flex: 1;

  min-height: 0;

}



.panel-head {

  display: flex;

  flex-wrap: wrap;

  align-items: baseline;

  gap: 8px 12px;

}



.panel-title {

  font-weight: 600;

}



.panel-hint {

  font-size: 13px;

  font-weight: normal;

  color: rgba(0, 0, 0, 0.45);

}



.directory-detail-body {

  min-height: 280px;

}



@media (max-width: 992px) {

  .directory-layout {

    grid-template-columns: 1fr;

  }

}

</style>


