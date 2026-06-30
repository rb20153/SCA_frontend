import type { ApiResponse } from '@/types/common'
import { getMockKbQuarterUpdateQuarterOptions } from '@/mock/modules/knowledge/quarterUpdateRecordList'

/** 季度更新管理 · 已有季度下拉选项 mock */
export const mockKbQuarterUpdateQuarterOptionsRes: ApiResponse<string[]> = {
  code: 200,
  message: 'ok',
  data: getMockKbQuarterUpdateQuarterOptions(),
}
