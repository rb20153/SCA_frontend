<template>
  <a-empty class="list-empty-guide">
    <template #description>
      <p class="list-empty-guide__title">{{ title }}</p>
      <p v-if="hasHint" class="list-empty-guide__hint">
        <slot name="hint">
          <template v-if="linkTo">
            <span v-if="hintBefore">{{ hintBefore }}</span>
            <router-link :to="linkTo">{{ linkText }}</router-link>
            <span v-if="hintAfter">{{ hintAfter }}</span>
          </template>
          <template v-else>{{ description }}</template>
        </slot>
      </p>
    </template>
  </a-empty>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = defineProps<{
  /** 空状态主标题，如「暂无检测任务」 */
  title: string
  /** 纯文本引导说明（无跳转链接时使用） */
  description?: string
  /** 链接前的引导文字 */
  hintBefore?: string
  /** 引导跳转的路由路径 */
  linkTo?: string
  /** 链接展示文字 */
  linkText?: string
  /** 链接后的引导文字 */
  hintAfter?: string
}>()

const slots = useSlots()

/** 是否展示引导说明区域 */
const hasHint = computed(
  () =>
    Boolean(slots.hint) ||
    Boolean(props.description) ||
    Boolean(props.linkTo),
)
</script>

<style scoped>
.list-empty-guide {
  padding: 32px 0;
}

.list-empty-guide__title {
  margin: 0 0 8px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.list-empty-guide__hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.list-empty-guide__hint a {
  color: #1677ff;
}
</style>
