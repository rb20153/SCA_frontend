import type { KbCollectMode, KbQuarterUpdateStatus } from '@/types/knowledge'
import { formatKbProjectDateTime } from '@/utils/knowledgeDisplay'

export const KB_QUARTER_UPDATE_STATUS_LABEL: Record<KbQuarterUpdateStatus, string> = {
  in_progress: '进行中',
  completed: '已完成',
  failed: '失败',
}

export const KB_QUARTER_UPDATE_STATUS_COLOR: Record<KbQuarterUpdateStatus, string> = {
  in_progress: 'processing',
  completed: 'success',
  failed: 'error',
}

/** 季度更新记录页采集方式展示文案（较知识库列表略短） */
export const KB_QUARTER_UPDATE_COLLECT_MODE_LABEL: Record<KbCollectMode, string> = {
  cloud_repo: '云端拉取',
  upload_package: '上传包',
}

/** 季度更新记录表格横向滚动宽度 */
export const KB_QUARTER_UPDATE_TABLE_SCROLL_X = 1080

/** 格式化季度更新记录更新时间 */
export function formatKbQuarterUpdateDateTime(value: string): string {
  return formatKbProjectDateTime(value)
}
