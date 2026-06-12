<template>
  <div class="page-container">
    <SiteMessageActionBar :loading="markAllLoading" @mark-all-read="handleMarkAllRead" />

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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  getSiteMessageList,
  markAllSiteMessagesRead,
  updateSiteMessageReadStatus,
} from '@/api/siteMessage'
import ListEmptyGuide from '@/components/common/ListEmptyGuide.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import SiteMessageActionBar from '@/components/system/SiteMessageActionBar.vue'
import SiteMessageQueryBar from '@/components/system/SiteMessageQueryBar.vue'
import SiteMessageTable from '@/components/system/SiteMessageTable.vue'
import { useFilteredPaginatedList } from '@/composables/useFilteredPaginatedList'
import { useAuthStore } from '@/stores/auth'
import type { SiteMessage, SiteMessageListFilters } from '@/types/siteMessage'
import { resolveSiteMessageActionRoute } from '@/utils/siteMessageNavigation'
import {
  createEmptySiteMessageListFilters,
  siteMessageListFiltersToQuery,
} from '@/utils/siteMessageQuery'

const router = useRouter()
const authStore = useAuthStore()

const markAllLoading = ref(false)

/** 当前登录用户名，用于 mock 按接收人过滤 */
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

  if (!msg.read) {
    await updateSiteMessageReadStatus({ messageId: msg.messageId, read: true })
    syncMessageRead(msg.messageId, true)
  }

  await router.push(resolveSiteMessageActionRoute(msg.action))
}

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
</style>
