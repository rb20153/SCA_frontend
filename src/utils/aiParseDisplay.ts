import type { CreateAiParseTaskParams } from '@/types/detect'

/**
 * 从创建参数推导解析对象展示名
 * @param params - 创建任务参数
 */
export function deriveAiParseObjectName(params: CreateAiParseTaskParams): string {
  if (params.sourceMode === 'upload-source-package') {
    return params.packageFileName?.trim() || '未命名压缩包'
  }

  const url = params.repositoryUrl?.trim() ?? ''
  if (!url) {
    return '未命名仓库'
  }

  const normalized = url.replace(/\/+$/, '').replace(/\.git$/i, '')
  const segments = normalized.split('/')
  const last = segments[segments.length - 1]
  return last || url
}
