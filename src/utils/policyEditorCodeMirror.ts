import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

/** 策略编辑器深色主题（黑底 + 按类型着色） */
export const policyEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      height: '100%',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'Consolas, "Courier New", monospace',
    },
    '.cm-content': {
      caretColor: '#ffffff',
      padding: '12px 0',
    },
    '.cm-gutters': {
      backgroundColor: '#1e1e1e',
      color: '#6e7681',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#2a2a2a',
    },
    '.cm-activeLine': {
      backgroundColor: '#2a2d2e',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#264f78',
    },
    '.cm-cursor': {
      borderLeftColor: '#ffffff',
    },
  },
  { dark: true },
)

/** JSON 语法高亮：键白色，值按类型亮色 */
export const policyJsonHighlight = HighlightStyle.define([
  { tag: t.propertyName, color: '#ffffff' },
  { tag: t.string, color: '#ce9178' },
  { tag: t.number, color: '#b5cea8' },
  { tag: t.bool, color: '#569cd6' },
  { tag: t.null, color: '#569cd6' },
  { tag: t.punctuation, color: '#d4d4d4' },
  { tag: t.bracket, color: '#d4d4d4' },
  { tag: t.separator, color: '#d4d4d4' },
])

export const policyJsonSyntaxHighlighting = syntaxHighlighting(policyJsonHighlight)
