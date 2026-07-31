/**
 * mock 变量库：复用正式兜底常量，避免 mock 与联调默认变量漂移
 */
export {
  DEFAULT_REPORT_TEMPLATE_MARKDOWN,
  DEFAULT_REPORT_TEMPLATE_VARIABLES as MOCK_REPORT_TEMPLATE_VARIABLES,
} from '@/utils/reportTemplateVariables'
