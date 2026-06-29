import type { ReportTemplateVariable } from '@/types/reportTemplate'

/** HTML 转义，防止预览 XSS */
function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 行内 Markdown：加粗、斜体、行内代码、链接 */
function renderInlineMarkdown(text: string): string {
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  return html
}

/**
 * 构建变量占位符 → 中文展示名映射（英文键与中文名均识别）
 * @param variables - 后端返回的变量列表
 */
export function buildReportTemplateVariableLabelMap(
  variables: ReportTemplateVariable[],
): Map<string, string> {
  const map = new Map<string, string>()
  variables.forEach((item) => {
    map.set(item.varKey, item.varLabel)
    map.set(item.varLabel, item.varLabel)
  })
  return map
}

/** 将 $变量 替换为蓝色中文标签 HTML */
function replaceTemplateVariablePlaceholders(
  html: string,
  labelMap: Map<string, string>,
): string {
  return String(html || '').replace(/\$([^\s$<>&\n]+)/g, (_, name: string) => {
    const label = labelMap.get(name) ?? name
    return `<span class="report-template-variable">${escapeHtml(label)}</span>`
  })
}

/**
 * 将 Markdown 模板文本渲染为预览 HTML（含变量占位符中文标签）
 * @param text - Markdown 正文
 * @param variables - 变量库（用于英文键 → 中文名）
 */
export function renderReportTemplateMarkdownPreview(
  text: string,
  variables: ReportTemplateVariable[],
): string {
  const labelMap = buildReportTemplateVariableLabelMap(variables)
  const source = String(text || '').replace(/\r\n/g, '\n')
  const lines = source.split('\n')
  const html: string[] = []
  let listMode = ''
  const codeLines: string[] = []
  let inCode = false

  /** 关闭当前列表块 */
  function closeList() {
    if (!listMode) {
      return
    }
    html.push(`</${listMode}>`)
    listMode = ''
  }

  /** 关闭围栏代码块 */
  function closeCode() {
    if (!inCode) {
      return
    }
    html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
    codeLines.length = 0
    inCode = false
  }

  lines.forEach((rawLine) => {
    const line = rawLine || ''
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      closeList()
      if (inCode) {
        closeCode()
      } else {
        inCode = true
      }
      return
    }

    if (inCode) {
      codeLines.push(line)
      return
    }

    if (!trimmed) {
      closeList()
      return
    }

    if (/^---+$/.test(trimmed)) {
      closeList()
      html.push('<hr/>')
      return
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (orderedMatch) {
      if (listMode !== 'ol') {
        closeList()
        listMode = 'ol'
        html.push('<ol>')
      }
      html.push(`<li>${renderInlineMarkdown(orderedMatch[2])}</li>`)
      return
    }

    if (trimmed.startsWith('- ')) {
      if (listMode !== 'ul') {
        closeList()
        listMode = 'ul'
        html.push('<ul>')
      }
      html.push(`<li>${renderInlineMarkdown(trimmed.slice(2))}</li>`)
      return
    }

    closeList()

    if (trimmed.startsWith('### ')) {
      html.push(`<h3>${renderInlineMarkdown(trimmed.slice(4))}</h3>`)
      return
    }
    if (trimmed.startsWith('## ')) {
      html.push(`<h2>${renderInlineMarkdown(trimmed.slice(3))}</h2>`)
      return
    }
    if (trimmed.startsWith('# ')) {
      html.push(`<h1>${renderInlineMarkdown(trimmed.slice(2))}</h1>`)
      return
    }
    if (trimmed.startsWith('> ')) {
      html.push(`<blockquote>${renderInlineMarkdown(trimmed.slice(2))}</blockquote>`)
      return
    }

    html.push(`<p>${renderInlineMarkdown(line).replace(/  $/g, '<br/>')}</p>`)
  })

  closeList()
  closeCode()
  return replaceTemplateVariablePlaceholders(html.join(''), labelMap)
}

/**
 * 生成变量插入占位符（$中文变量名）
 * @param variable - 变量项
 */
export function formatReportTemplateVariableToken(variable: ReportTemplateVariable): string {
  return `$${variable.varLabel}`
}

/**
 * 将 Markdown 中的 $中文变量名 转为后端英文 varKey（长 label 优先，避免短名误替换）
 * @param text - 编辑器正文（中文占位符）
 * @param variables - 变量库
 */
export function convertMarkdownVariablesToEnglish(
  text: string,
  variables: ReportTemplateVariable[],
): string {
  let result = String(text || '')
  const sorted = [...variables].sort((a, b) => b.varLabel.length - a.varLabel.length)
  for (const item of sorted) {
    result = result.split(`$${item.varLabel}`).join(`$${item.varKey}`)
  }
  return result
}

/**
 * 将后端存储的 $英文 varKey 转为编辑器展示用的 $中文变量名
 * @param text - 后端 Markdown 正文
 * @param variables - 变量库
 */
export function convertMarkdownVariablesToChinese(
  text: string,
  variables: ReportTemplateVariable[],
): string {
  let result = String(text || '')
  const sorted = [...variables].sort((a, b) => b.varKey.length - a.varKey.length)
  for (const item of sorted) {
    result = result.split(`$${item.varKey}`).join(`$${item.varLabel}`)
  }
  return result
}

/**
 * 在文本指定光标位置插入字符串
 * @param text - 当前正文
 * @param insertText - 待插入文本
 * @param selectionStart - 选区起点
 * @param selectionEnd - 选区终点
 */
export function insertTextAtSelection(
  text: string,
  insertText: string,
  selectionStart: number,
  selectionEnd: number,
): { nextText: string; cursorPosition: number } {
  const start = Math.max(0, Math.min(selectionStart, text.length))
  const end = Math.max(start, Math.min(selectionEnd, text.length))
  const nextText = text.slice(0, start) + insertText + text.slice(end)
  return {
    nextText,
    cursorPosition: start + insertText.length,
  }
}

/**
 * 触发浏览器下载 Markdown 文本文件
 * @param content - 文件内容
 * @param fileName - 文件名（含 .md 后缀）
 */
export function downloadMarkdownFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/** 将模板名称转为安全下载文件名 */
export function sanitizeReportTemplateMarkdownFileName(templateName: string): string {
  const base = templateName.trim() || 'report-template'
  const safe = base.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '-')
  return safe.endsWith('.md') ? safe : `${safe}.md`
}

/** 构建可识别的变量占位符列表（中文 + 英文键，长匹配优先） */
export function buildReportTemplateVariableTokens(
  variables: ReportTemplateVariable[],
): string[] {
  const tokens = new Set<string>()
  variables.forEach((item) => {
    tokens.add(`$${item.varLabel}`)
    tokens.add(`$${item.varKey}`)
  })
  return [...tokens].sort((a, b) => b.length - a.length)
}

/**
 * Backspace/Delete 时若光标在变量占位符内或边界，返回整段删除范围
 * @param text - 当前正文
 * @param cursorStart - 选区起点
 * @param cursorEnd - 选区终点
 * @param key - 按键类型
 * @param variables - 变量库
 */
export function resolveVariableTokenDeleteRange(
  text: string,
  cursorStart: number,
  cursorEnd: number,
  key: 'Backspace' | 'Delete',
  variables: ReportTemplateVariable[],
): { start: number; end: number } | null {
  if (cursorStart !== cursorEnd) {
    return null
  }

  const pos = cursorStart
  const tokens = buildReportTemplateVariableTokens(variables)

  for (const token of tokens) {
    let searchFrom = 0
    while (searchFrom < text.length) {
      const idx = text.indexOf(token, searchFrom)
      if (idx === -1) {
        break
      }

      const start = idx
      const end = idx + token.length

      if (key === 'Backspace' && pos > start && pos <= end) {
        return { start, end }
      }
      if (key === 'Delete' && pos >= start && pos < end) {
        return { start, end }
      }

      searchFrom = idx + 1
    }
  }

  return null
}
