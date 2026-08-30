<template>
  <div class="page-container">
    <div class="page-actions"><SiteMessageActionBar :loading="markAllLoading" @mark-all-read="handleMarkAllRead" /><a-button v-if="authStore.isAdmin" type="primary" @click="publishVisible = true">发布公告</a-button></div>

    <SiteMessageQueryBar
      v-model="filterForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <a-card :bordered="false" class="table-card">
      <PageLoading :loading="loading && messageList.length === 0">
        <ListEmptyGuide
          v-if="!loading && messageList.length === 0"
          title="暂无消息"
          description="当前筛选条件下没有站内消息"
        />
        <SiteMessageTable
          v-else
          :messages="messageList"
          :loading="loading"
          :pagination="pagination"
          @action-click="handleActionClick"
          @toggle-read="handleToggleRead"
        />
      </PageLoading>
    </a-card>
    <AnnouncementDetailModal v-model:open="announcementVisible" :message="announcementMessage" />
    <AnnouncementPublishModal
      v-if="authStore.isAdmin"
      v-model:open="publishVisible"
      @success="refreshMessages"
    />
    <PolicyVersionApprovalDrawer v-model:open="policyApprovalVisible" :policy-id="policyApprovalPolicyId" :version="policyApprovalVersion" @success="refreshMessages" />
    <ReportDownloadApprovalDrawer v-model:open="reportApprovalVisible" :application-id="reportApprovalApplicationId" @success="refreshMessages" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  getSiteMessageList,
  markAllSiteMessagesRead,
  updateSiteMessageReadStatus,
} from '@/api/siteMessage'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import SiteMessageActionBar from '@/components/system/SiteMessageActionBar.vue'
import AnnouncementDetailModal from '@/components/system/AnnouncementDetailModal.vue'
import AnnouncementPublishModal from '@/components/system/AnnouncementPublishModal.vue'
import PolicyVersionApprovalDrawer from '@/components/policy/PolicyVersionApprovalDrawer.vue'
import ReportDownloadApprovalDrawer from '@/components/report/ReportDownloadApprovalDrawer.vue'
import SiteMessageQueryBar from '@/components/system/SiteMessageQueryBar.vue'
import SiteMessageTable from '@/components/system/SiteMessageTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import { useAuthStore } from '@/stores/auth'
import { getPolicyVersionList } from '@/api/policy'
import type { PolicyVersionListItem } from '@/types/policy'
import type { SiteMessage, SiteMessageListFilters } from '@/types/siteMessage'
import { useRouteWithFrom } from '@/composables/useRouteWithFrom'
import {
  getSiteMessageActionValidationError,
  resolveSiteMessageActionRoute,
} from '@/utils/siteMessageNavigation'
import {
  createEmptySiteMessageListFilters,
  siteMessageListFiltersToQuery,
} from '@/utils/siteMessageQuery'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { withFrom } = useRouteWithFrom()

const markAllLoading = ref(false)
const announcementVisible = ref(false)
const announcementMessage = ref<SiteMessage | null>(null)
const publishVisible = ref(false)
const policyApprovalVisible = ref(false)
const policyApprovalPolicyId = ref('')
const policyApprovalVersion = ref<PolicyVersionListItem | null>(null)
const reportApprovalVisible = ref(false)
const reportApprovalApplicationId = ref<string | null>(null)

/** 当前登录用户名，用于按接收人过滤站内消息。 */
const recipientUsername = computed(() => authStore.userInfo?.username ?? 'admin')

const {
  filterForm,
  loading,
  list: messageList,
  pagination,
  handleSearch,
  handleReset,
} = useFilteredPaginatedList<SiteMessage, SiteMessageListFilters>(
  async (params) =>
    (
      await getSiteMessageList({
        ...params,
        recipientUsername: recipientUsername.value,
        page: params.page,
        pageSize: params.pageSize,
      })
    ).data,
  {
    createEmptyFilters: createEmptySiteMessageListFilters,
    filtersToQuery: siteMessageListFiltersToQuery,
    pageSize: 10,
  },
)

async function refreshMessages() {
  await handleSearch()
}

/** 同步更新当前页列表项的已读状态，替换数组引用以驱动表格行样式刷新 */
function syncMessageRead(messageId: string, read: boolean) {
  messageList.value = messageList.value.map((item) =>
    item.messageId === messageId ? { ...item, read } : item,
  )
}

/** 将当前页所有项标为已读（配合全部已读接口） */
function syncCurrentPageAllRead() {
  messageList.value = messageList.value.map((item) => ({ ...item, read: true }))
}

/** 全部标为已读：请求后端后同步当前页高亮 */
async function handleMarkAllRead() {
  markAllLoading.value = true
  try {
    const res = await markAllSiteMessagesRead(recipientUsername.value)
    if (res.data.updatedCount > 0) {
      syncCurrentPageAllRead()
      message.success(`已将 ${res.data.updatedCount} 条消息标为已读`)
    } else {
      message.info('暂无未读消息')
    }
  } finally {
    markAllLoading.value = false
  }
}

/**
 * 点击「查看xx」：未读时先请求标为已读并更新样式，再跳转
 */
async function handleActionClick(msg: SiteMessage) {
  if (!msg.action) return
  const validationError = getSiteMessageActionValidationError(msg.action)
  if (validationError) {
    message.warning(validationError)
    return
  }

  try {
    if (!msg.read) {
      await updateSiteMessageReadStatus({ messageId: msg.messageId, read: true })
      syncMessageRead(msg.messageId, true)
    }

    if (msg.action.type === 'view_announcement') {
      announcementMessage.value = msg
      announcementVisible.value = true
      return
    }

    if (msg.action.type === 'open_policy_approval') {
      const versions = await getPolicyVersionList(msg.action.policyId!, { page: 1, pageSize: 100 })
      const target = versions.data.list.find((item) => item.versionId === msg.action?.versionId)
      if (!target) {
        message.warning('未找到待审批策略版本，可能已被其他审批人处理')
        return
      }
      policyApprovalPolicyId.value = msg.action.policyId!
      policyApprovalVersion.value = target
      policyApprovalVisible.value = true
      return
    }
    if (msg.action.type === 'open_report_approval') {
      reportApprovalApplicationId.value = msg.action.applicationId!
      reportApprovalVisible.value = true
      return
    }

    await router.push(withFrom(resolveSiteMessageActionRoute(msg.action)))
  } catch (error) {
    message.error(error instanceof Error ? error.message : '消息操作失败，请稍后重试')
  }
}

/** 其他页面消息动作跳回消息页时，按 announcementId 自动打开公告。 */
watch(
  () => route.query.announcementId,
  (announcementId) => {
    if (typeof announcementId !== 'string' || !announcementId) return
    const target = messageList.value.find((item) => item.action?.announcementId === announcementId)
    if (target) void handleActionClick(target)
  },
)

/** 切换单条已读/未读：请求后端后同步行高亮 */
async function handleToggleRead(msg: SiteMessage, read: boolean) {
  await updateSiteMessageReadStatus({ messageId: msg.messageId, read })
  syncMessageRead(msg.messageId, read)
  message.success(read ? '已标为已读' : '已设为未读')
}
</script>

<style scoped>
.page-container {
  min-height: 100%;
}
.page-actions { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
</style>
