<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="规则关键字">
      <a-input
        v-model:value="filters.ruleKeyword"
        placeholder="输入规则关键字"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="命中范围">
      <a-select
        v-model:value="filters.hitScope"
        :options="POLICY_RULE_HIT_SCOPE_FILTER_OPTIONS"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="TraceID">
      <a-input
        v-model:value="filters.traceId"
        placeholder="输入 TraceID"
        allow-clear
        class="list-query-input-wide"
        @press-enter="emit('search')"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { PolicyRuleHitListFilters } from '@/types/policy'
import { POLICY_RULE_HIT_SCOPE_FILTER_OPTIONS } from '@/utils/policyRuleHitQuery'

const filters = defineModel<PolicyRuleHitListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>
