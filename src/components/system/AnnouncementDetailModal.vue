<template>
  <a-modal v-model:open="visible" title="系统公告" :footer="null" destroy-on-close>
    <article v-if="message" class="announcement"><h3>{{ message.title }}</h3><p class="time">{{ formatSiteMessageDateTime(message.createdAt) }}</p><div class="content">{{ message.content }}</div></article>
  </a-modal>
</template>
<script setup lang="ts">
import type { SiteMessage } from '@/types/siteMessage'
import { formatSiteMessageDateTime } from '@/utils/siteMessageDisplay'
defineProps<{ message: SiteMessage | null }>()
const visible = defineModel<boolean>('open', { required: true })
</script>
<style scoped>
.announcement h3 { margin: 0 0 8px; font-size: 16px; }.time { margin: 0 0 18px; color: rgba(0,0,0,.45); font-size: 13px; }.content { white-space: pre-wrap; line-height: 1.7; }
</style>
