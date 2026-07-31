import type { ReportTemplateVariable } from '@/types/reportTemplate'

/**
 * 报告模板默认变量库（后端未返回 variables 时的前端兜底）
 * 后端存英文 varKey，编辑器展示中文 varLabel
 */
export const DEFAULT_REPORT_TEMPLATE_VARIABLES: ReportTemplateVariable[] = [
  { varKey: 'report_title', varLabel: '报告名称' },
  { varKey: 'project_name', varLabel: '项目名称' },
  { varKey: 'task_name', varLabel: '任务名称' },
  { varKey: 'generated_at', varLabel: '生成时间' },
  { varKey: 'owner', varLabel: '责任人' },
  { varKey: 'autonomy_rate', varLabel: '自主率' },
  { varKey: 'risk_summary', varLabel: '风险摘要' },
  { varKey: 'component_count', varLabel: '组件总数' },
  { varKey: 'vuln_count', varLabel: '漏洞总数' },
  { varKey: 'sbom_diff', varLabel: 'SBOM差异' },
]

/** 空白新建模板默认 Markdown 正文（与原型一致） */
export const DEFAULT_REPORT_TEMPLATE_MARKDOWN = `# $报告名称

> 项目：$项目名称  
> 任务：$任务名称  
> 生成时间：$生成时间  
> 责任人：$责任人

## 1. 验收结论

本次检测的总体自主率为 **$自主率**。

### 结论摘要

- 项目名称：$项目名称
- 组件总数：$组件总数
- 漏洞总数：$漏洞总数
- 核心风险：$风险摘要

## 2. 关键发现

1. 自主率结果显示核心求解器已具备较高自研占比。
2. 需优先复核与 OpenFOAM 相关的高相似证据。
3. 版本变更与 SBOM 差异如下：$SBOM差异

## 3. 处置建议

- 对高风险许可证组件追加人工确认。
- 对漏洞组件建立修复计划和导出审批记录。
- 将本模板作为项目默认验收模板持续迭代。

---

\`备注：以上内容为 Markdown 模板示例，可继续从变量库插入更多占位符。\``
