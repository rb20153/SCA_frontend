import type { PageParams } from '@/types/common'

export interface Policy {
  policyId: string
  policyName: string
  scenarioDescription: string
  referencedProjectCount: number
  isDefault: boolean
  updatedAt: string
}

export interface PolicyListFilters {
  policyName: string
  scenario: string
}

export interface PolicyQueryParams extends PageParams {
  policyName?: string
  scenario?: string
}
