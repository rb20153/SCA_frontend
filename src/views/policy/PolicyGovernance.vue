<template>
  <div class="page-container">
    <div class="policy-name-stat">
      <StatCard label="策略" :value="policyName" />
    </div>

    <a-result
      status="info"
      title="版本与审批"
      sub-title="页面开发中"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getPolicyById } from '@/api/policy'
import StatCard from '@/components/common/StatCard.vue'
import type { Policy } from '@/types/policy'

const route = useRoute()

const policyName = ref('—')

/** 路由参数中的策略 ID */
const policyId = computed(() => String(route.params.policyId ?? ''))

/** 列表跳转时通过 history.state 携带的策略信息（刷新后失效） */
const navigationPolicy = computed<Policy | undefined>(() => {
  const state = history.state as { policy?: Policy } | null
  if (state?.policy?.policyId === policyId.value) {
    return state.policy
  }
  return undefined
})

/** 解析顶部策略名：优先路由 state，刷新后 API 兜底 */
async function resolvePolicyName() {
  if (navigationPolicy.value) {
    policyName.value = navigationPolicy.value.policyName
    return
  }

  const res = await getPolicyById(policyId.value)
  policyName.value = res.data?.policyName ?? '—'
}

onMounted(resolvePolicyName)
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.policy-name-stat {
  max-width: 320px;
  margin-bottom: 16px;
}
</style>
