<template>
  <a-space :size="12" wrap>
    <a
      v-if="message.action"
      class="list-table-link"
      @click.prevent="emit('action-click', message)"
    >
      {{ message.action.label }}
    </a>

    <a
      v-if="!message.read"
      class="list-table-link"
      @click.prevent="emit('toggle-read', message, true)"
    >
      标为已读
    </a>
    <a
      v-else
      class="list-table-link"
      @click.prevent="emit('toggle-read', message, false)"
    >
      设为未读
    </a>
  </a-space>
</template>

<script setup lang="ts">
import type { SiteMessage } from '@/types/siteMessage'

defineProps<{
  message: SiteMessage
}>()

const emit = defineEmits<{
  'action-click': [message: SiteMessage]
  'toggle-read': [message: SiteMessage, read: boolean]
}>()
</script>
