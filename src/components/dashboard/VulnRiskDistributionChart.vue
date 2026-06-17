<template>
  <a-card :bordered="false" class="vuln-risk-distribution-chart">
    <template #title>
      <div class="vuln-risk-distribution-chart__title">
        <span>漏洞风险分布</span>
        <span class="vuln-risk-distribution-chart__total">总数 {{ total }}</span>
      </div>
    </template>
    <RiskRosePieChart :items="chartItems" empty-description="暂无漏洞数据" />
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import RiskRosePieChart from '@/components/common/RiskRosePieChart.vue'
import type { DashboardVulnRiskDistributionItem } from '@/types/dashboard'
import {
  DASHBOARD_VULN_RISK_LEVEL_COLOR,
  DASHBOARD_VULN_RISK_LEVEL_LABEL,
  DASHBOARD_VULN_RISK_LEVEL_ORDER,
} from '@/utils/dashboardVulnRisk'

const props = defineProps<{
  /** 三档漏洞分布项 */
  items: DashboardVulnRiskDistributionItem[]
  /** 漏洞总数，用于环心展示 */
  total: number
}>()

/** 首页三档风险分布转为通用玫瑰图数据 */
const chartItems = computed(() => {
  const countMap = new Map(props.items.map((item) => [item.level, item.count]))
  return DASHBOARD_VULN_RISK_LEVEL_ORDER.map((level) => {
    const color = DASHBOARD_VULN_RISK_LEVEL_COLOR[level]
    return {
      name: DASHBOARD_VULN_RISK_LEVEL_LABEL[level],
      value: countMap.get(level) ?? 0,
      color,
    }
  })
})
</script>

<style scoped>
.vuln-risk-distribution-chart {
  height: 100%;
}

.vuln-risk-distribution-chart__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.vuln-risk-distribution-chart__total {
  font-size: 12px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.45);
}
</style>
