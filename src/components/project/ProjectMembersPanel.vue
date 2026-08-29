<template>
  <div class="members-panel">
    <div v-if="canWrite('/projects')" class="create-bar">
      <a-button type="primary" @click="addModalVisible = true">
        <template #icon>
          <PlusOutlined />
        </template>
        添加成员
      </a-button>
    </div>

    <PageLoading :loading="loading && memberList.length === 0">
      <ListEmptyGuide
        v-if="!loading && memberList.length === 0"
        title="暂无项目成员"
        description="点击上方「添加成员」邀请用户加入项目"
      />
      <ProjectMemberTable
        v-else
        :members="memberList"
        :loading="loading"
        :pagination="pagination"
        @transfer-owner="openTransferModal"
        @remove="openRemoveModal"
      />
    </PageLoading>

    <ProjectAddMemberModal
      v-model:open="addModalVisible"
      :project-id="project.projectId"
      @success="refresh"
    />

    <ProjectTransferOwnerModal
      v-model:open="transferVisible"
      :project-id="project.projectId"
      :member="transferringMember"
      @success="onOwnerTransferred"
    />

    <ProjectRemoveMemberModal
      v-model:open="removeVisible"
      :project-id="project.projectId"
      :project-name="project.projectName"
      :member="removingMember"
      @success="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getProjectMemberList } from '@/api/project'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import ProjectAddMemberModal from '@/components/project/ProjectAddMemberModal.vue'
import ProjectMemberTable from '@/components/project/ProjectMemberTable.vue'
import ProjectRemoveMemberModal from '@/components/project/ProjectRemoveMemberModal.vue'
import ProjectTransferOwnerModal from '@/components/project/ProjectTransferOwnerModal.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import type { Project, ProjectMember } from '@/types/project'
import { usePagePermission } from '@/composables/usePagePermission'

const props = defineProps<{
  project: Project
  visible: boolean
}>()

const emit = defineEmits<{
  'owner-updated': [ownerName: string]
}>()
const { canWrite } = usePagePermission()

const addModalVisible = ref(false)
const transferVisible = ref(false)
const removeVisible = ref(false)
const transferringMember = ref<ProjectMember | null>(null)
const removingMember = ref<ProjectMember | null>(null)

const {
  loading,
  list: memberList,
  pagination,
  loadPage,
  refresh,
} = usePaginatedList<ProjectMember>(
  async (params) =>
    (await getProjectMemberList({ ...params, projectId: props.project.projectId })).data,
  { pageSize: 10, immediate: false },
)

/** 打开设为负责人确认弹窗 */
function openTransferModal(member: ProjectMember) {
  if (!canWrite('/projects')) return
  transferringMember.value = member
  transferVisible.value = true
}

/** 打开移除成员确认弹窗 */
function openRemoveModal(member: ProjectMember) {
  if (!canWrite('/projects')) return
  removingMember.value = member
  removeVisible.value = true
}

/** 负责人更换后刷新列表并同步顶部摘要 */
function onOwnerTransferred(ownerName: string) {
  refresh()
  emit('owner-updated', ownerName)
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      loadPage()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.members-panel {
  min-height: 200px;
}

.create-bar {
  margin-bottom: 16px;
}
</style>
