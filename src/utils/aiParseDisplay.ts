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

/**
 * 格式化 AI 解析完成时间（抽屉顶栏展示）
 * @param iso - ISO 8601 时间字符串
 */
export function formatAiParseFinishedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
