# SCA 前端 · 工程师日志

> 记录每次改动的内容摘要、实现思路和注意事项，供开发者快速了解当前代码状态。
> 按时间倒序，最新的在最上方。

---

## [2026-06-10] 知识库 · 覆盖统计页布局微调

### 改了什么

- 待补全清单：建议动作列宽收窄（112px + ellipsis），去掉横向 `scroll-x`，避免底部滚动条
- 分页由 5 条/页改为 **6 条/页**
- 第一行左右栏 `flex` 等高：采集方式分布图表 `flexBody` 自动撑高，与分类覆盖底部对齐
- 第二行左右栏等高：待补全卡片与更新趋势模块总高度一致

### 怎么实现的

- `ChartPlaceholder` 新增 `flexBody`：在 `coverage-panel-stack--fill` 内占满剩余高度
- `KnowledgeCoverage.vue` 两行均用 `type="flex"` + `coverage-section--stretch` 拉伸列高

---

## [2026-06-10] 知识库 · 覆盖统计页（完整）

### 改了什么

- **第一行**：分类覆盖 / 采集方式分布（`ChartPlaceholder` + `CoverageStatTable`）
- **第二行左**：待补全清单（`CoveragePendingTable` + `ListTable`，6 条/页）
- **第二行右**：更新趋势（图表占位 + `CoverageUpdateWeekList` 最近 3 周）
- **`KnowledgeBaseList.vue`**：支持 `?projectName=` 自动筛选（从待补全「查看」跳转）

### 怎么实现的

- 待补全列：项目名称、缺口、影响 Tag（低/中/高）、建议动作、操作（查看）
- 更新趋势列表：左 `Wxx`、右更新简介，数据来自 `getCoverageUpdateTrendWeeks`
- 查看 → `router.push({ path: '/knowledge', query: { projectName } })`

### 注意事项

- 图表区域仍为占位，后续替换 ECharts
- `CoverageStatTable` 与 `ListTable` 分工：小统计表 vs 分页业务列表

---

## [2026-06-10] 检测任务 · 创建任务弹窗（自主率 / 开源风险）

### 改了什么

- **类型选择**后分别打开 `AutonomyDetectTaskCreateModal`（三步 `a-steps`）或 `RiskDetectTaskCreateModal`
- **自主率**：选项目+任务名 → 扫描模式（切换提示语）→ 执行方式/Worker/自动重试；未完成当前步不可下一步
- **开源风险**：顶部流程提示 + 任务名/项目；**数据来源**（扫描项目 / 导入 SBOM）在关联项目下方；SBOM 模式拖拽上传（.json/.xml/.spdx）且必须上传后才能创建
- **列表进度**：`queued` 状态展示固定 10%（`getTaskDisplayProgress`）
- API：`getDetectTaskProjectOptions`、`getRiskDetectVulnDbVersions`、`createDetectTask`（mock 写入 `MOCK_ALL_DETECT_TASKS` 头部）

---

## [2026-06-10] 漏洞知识库 · 风险摘要占位

### 改了什么

- **`VulnKnowledgeRiskSummary`**：统计卡片下方、`ChartPlaceholder` 占位，文案「高危 / 中危 / 低危来源分布（图表待接入）」
- 后续在同组件内替换为 ECharts + 后端风险分布接口

---

## [2026-06-10] 漏洞条目页 · 快捷检索建议

### 改了什么

- **`VulnItemQuickSearchCard`**：与导出按钮同一行，以可点击 `a-tag` 展示；短文案由 `shortLabel` 或 filters 推导，完整说明在 tooltip
- 点击建议 → `quickSearchSuggestionToFilters` 写入筛选表单 → `onSearch()` 自动查询；若 URL 带 `sourceId` 会先清 query
- mock：`vulnItemQuickSearch.ts`（4 条，含全库关键词 / 单来源 + 编号 / 等级+状态组合）

---

## [2026-06-10] 漏洞条目页 · 导出检索结果

### 改了什么

- 页面顶部「导出当前检索结果」按钮 + `VulnItemExportModal`
- 可选格式（默认 CSV：Excel / JSON）、范围（默认当前筛选结果 / 当前页）
- `exportVulnItems()` 返回 `downloadUrl` + `fileName`，确定后 `triggerReportDownload` 自动下载并关弹窗
- mock：`vulnItemExport.ts` 按筛选或当前页生成 Blob URL

---

## [2026-06-10] 漏洞条目页 · 筛选 / 列表 / 详情抽屉

### 改了什么

- **布局**：`VulnItemQueryBar` 在统计卡片上方；列表在卡片下方
- **筛选**：关键词、来源（`?sourceId=` 跳转自动填充来源名并带 `sourceId` 查询）、等级（全部/低/中/高）、状态（全部/待处置/需复核/已同步）、CVE/CNVD 编号
- **列表**：`VulnItemTable` 七列；长文本列 `ellipsis` + `ListTableCell`
- **详情**：`VulnItemDetailDrawer` 打开时 `getVulnItemDetail`；描述与参考链接独占一行；无底部按钮
- **统计联动**：查询/重置时 `getVulnItemOverview` 与 `getVulnItemList` 共用 `vulnItemListFiltersToQuery` 条件

### 注意事项

- 用户手动改来源输入框会清空 `sourceId`，避免名称与路由 ID 冲突
- 重置且 URL 带 `sourceId` 时会 `router.replace` 清 query，由路由 watch 触发刷新

---

## [2026-06-10] 漏洞时间展示统一为日期 + 时间

### 改了什么

- **`formatVulnSourceLastSync`**：离线包「最近同步」与内置源一致，格式 `YYYY-MM-DD HH:mm`
- **`mapVulnItemToStatCards`**：「最近更新」由仅日期改为 `YYYY-MM-DD HH:mm`

---

## [2026-06-10] 漏洞条目页 · 跳转上下文 + 统计卡片

### 改了什么

- **`VulnItemList.vue`**：按 `route.query.sourceId` 请求 `getVulnItemOverview`，展示 4 项 `StatCardRow`
- **跳转**：漏洞总数卡片 → 全库（无 query）；来源列表「查看条目」→ `?sourceId=`
- **`mapVulnItemToStatCards`**：无 sourceId 时第二格「跨库重复」；有 sourceId 时第二格「来源」+ 来源名

---

## [2026-06-10] 漏洞知识库 · 全库同步 / 导入离线包 / 来源模型

### 改了什么

- **维护区**：全库同步弹窗（打开时 `getVulnSyncAllPreview` 动态文案）、导入离线包弹窗（来源标签 + 拖拽上传）
- **列表**：仅 NVD/CNVD/OSV/GitHub Advisory + 用户上传离线包；离线包记录数/高危/周期为 —，仅「查看条目」
- **`VulnSource.kind`**：`builtin` | `offline_upload`；统计卡片「查看漏洞条目」链接改为增长绿 `#52c41a`

### 注意事项

- **同步周期**是后端配置展示字段，不需按周期轮询；仅在「同步进行中」时轮询任务/列表状态即可（后续联调补）

---

## [2026-06-10] 漏洞知识库 · 筛选 / 列表 / 立即同步

### 改了什么

- **`VulnKnowledgeBase.vue`**：统计卡片下接 `VulnSourceQueryBar` + 分页 `VulnSourceTable`
- **组件**：`VulnSourceQueryBar`、`VulnSourceTable`、`VulnSourceActionCell`、`VulnSourceSyncModal`
- **`api/knowledge.ts`**：`getVulnSourceList`、`syncVulnSource`
- **mock**：`mock/modules/knowledge/vulnSourceList.ts`（8 条，含 NVD/CNVD/OSV/GitHub Advisory）

### 怎么实现的

- 筛选：来源、同步状态、关键词（匹配名称/描述/标签）
- 状态 Tag：正常绿、延迟黄、警告红
- 「查看条目」→ `/knowledge/vulnerabilities/items`，`history.state` 携带 `vulnSource`
- 「立即同步」弹窗确认后调 API，成功后刷新列表与顶部卡片

---

## [2026-06-10] 日志列表 · 导出 / 筛选 / 列表 / 全链路抽屉

### 改了什么

- **`LogList.vue`**：顶部「导出日志」+ `LogQueryBar` 筛选 + 分页 `LogTable`
- **组件**：`LogExportModal`（时间范围 + CSV/JSON）、`LogQueryBar`、`LogTable`、`LogActionCell`、`LogDetailDrawer`
- **`api/system.ts`**：`getLogList`、`getLogDetail`、`exportLogs`
- **mock**：`mock/modules/system/logList.ts`（22 条 + 详情 + Blob 导出）

### 怎么实现的

- 筛选复用 `ListQueryBar` + `useFilteredPaginatedList`；时间范围用 `a-range-picker` + `show-time`
- 导出确定后请求后端拿 `downloadUrl`，`triggerReportDownload` 触发下载
- 详情抽屉无底部按钮、无蓝色提示框；时间线用 `a-timeline`，原始日志用 `pre` 换行展示
- 从检测任务「查看日志」跳转 `?taskId=` 时自动按关联任务筛选

### 注意事项

- 列表末列标题为「详情」，链接文案「全链路详情」
- mock 导出在浏览器内生成 Blob URL，联调后改为后端签名链接

---

## [2026-06-10] 文字溢出防护 · 公共组件 + 全列表接入

### 改了什么

- **公共组件**：`EllipsisText`（列表单行省略 + tooltip）、`DetailText`（详情/抽屉/弹窗长文换行）、`ListTableCell`（按列配置自动选用省略或纯文本）
- **工具**：`utils/listTable.ts` 中 `shouldColumnEllipsis` / `withListColumnDefaults` — 有 `dataIndex` 的文本列默认 `ellipsis: true`，`action`/`status`/`level`/Tag 等列排除
- **`ListTable`**：默认 `bodyCell` 回退 `ListTableCell`；单元格 `overflow: hidden`
- **8 张业务表**全部在自定义 `bodyCell` 末尾增加 `v-else` + `ListTableCell`：`DetectTaskTable`、`ProjectTable`、`KbProjectTable`、`KbVersionTable`、`PolicyTable`、`ReportTable`、`ReportTemplateTable`、`AlertTable`
- **`StatCard`** 主数值改用 `EllipsisText`
- **详情/弹窗**：`AlertDetailDrawer` 标题/内容/建议等用 `DetailText`；报告失败原因弹窗用 `DetailText` + `preserve-breaks`

### 使用约定

| 场景 | 组件 | 说明 |
|------|------|------|
| 列表单元格（名称、标题等） | `ListTableCell` 或列上 `ellipsis: true` | 超出显示 `…`，悬停 tooltip 全文 |
| 统计卡片数值 | `EllipsisText` | 防止超大数字或长文案撑破卡片 |
| 抽屉/描述列表/弹窗正文 | `DetailText` | 自动换行；日志类传 `preserve-breaks` |
| 自定义 bodyCell 的表 | 分支末尾必须 `v-else` + `ListTableCell` | 否则会覆盖 `ListTable` 默认回退 |

### 注意事项

- 列需同时设 `width` + `dataIndex` 省略才生效；纯 `key` 无 `dataIndex` 的列（如格式化日期）走普通文本
- 占位页（项目目录、结果详情等）尚无列表/抽屉，后续按上表接入即可

---

## [2026-06-10] 告警中心 · Tab / 筛选 / 列表 / 详情抽屉

### 改了什么

- **`AlertCenter.vue`**：未处理/已处理 Tab → 统计卡片 → 筛选 → 分页列表
- **组件**：`AlertQueryBar`、`AlertTable`、`AlertActionCell`、`AlertDetailDrawer`（`a-drawer` 官方组件）
- **`api/system.ts`**：`getAlertList`、`getAlertDetail`；概览 API 增加 `status` 参数
- **mock**：`alertList.ts`（未处理 18 条 / 已处理 12 条 + 详情）

### 怎么实现的

- 切换 Tab 时并行请求概览与列表（默认未处理；点已处理才拉已处理数据）
- 筛选：级别 + 日期时间（默认今日 00:00）；已处理 Tab 按处理日期过滤
- 详情抽屉打开时 `getAlertDetail`；关联任务/项目可跳转结果页与项目详情

### 注意事项

- 「处理」按钮暂无交互；详情长文已用公共 `DetailText` 换行展示

---

## [2026-06-10] 覆盖统计 / 漏洞知识库 / 告警中心 · 统计卡片

### 改了什么

- **`KnowledgeCoverage.vue`**、**`VulnKnowledgeBase.vue`**、**`AlertCenter.vue`**：顶部 `StatCardRow` + `onMounted` 请求概览 API
- **`api/knowledge.ts`**：`getKnowledgeCoverageOverview`、`getVulnKnowledgeOverview`
- **`api/system.ts`**（新建）：`getAlertCenterOverview`
- **mock**：`coverageOverview.ts`、`vulnKnowledgeOverview.ts`、`system/alertOverview.ts`
- **`utils/statCard.ts`**：三个页面的 overview → `StatCardItem` 映射函数

### 注意事项

- 三页其余区块仍为占位；高危/待补全/紧急等计数 > 0 时使用 `warnValue` 警告色

---

## [2026-06-10] 公共统计卡片 StatCard / StatCardRow

### 改了什么

- 新增 **`components/common/StatCard.vue`**、**`StatCardRow.vue`**，统一标签 + 主数值 + 可选增长率行
- **`types/common.ts`** 已有 `StatCardItem`；新增 **`utils/statCard.ts`** 映射首页数据
- 首页、版本管理改用公共组件；删除 `dashboard/StatCard.vue`、`knowledge/KbVersionStatCard.vue`

### 注意事项

- `StatCardRow` 支持 `columns`：`4`（首页）或 `5`（版本管理），含响应式栅格
- 无 `growth` 字段时不展示第三行增长率

---

## [2026-06-10] 知识库 · 版本管理页（M03-S02-P01）

### 改了什么

- **`KbVersionManage.vue`**：顶部「更新版本」+ 5 项统计卡片 + 版本分页列表
- **`api/knowledge.ts`**：新增 `getKbProjectDetail`、`getKbVersionOverview`、`getKbVersionList`
- **`mock/modules/knowledge/versionList.ts`**：按项目生成版本 mock（OpenFOAM 12 条对齐原型）
- **组件**：`KbVersionUpdateBar`（获取更新/上传更新包二选一弹窗）、`KbVersionStatCard`、`KbVersionTable`、`KbVersionActionCell`
- **`KbProjectActionCell`**：跳转版本管理/项目目录时经 `history.state` 携带 `kbProject`

### 怎么实现的

- 统计卡片样式对齐首页 `StatCard`（无增长率行），5 列栅格自适应
- 版本列表 10 条/页；操作列按状态展示「更新说明 / 构建日志 / 恢复」（暂无可点交互）
- 更新方式弹窗样式对齐 `DetectTaskCreateBar`，选中后仅关闭弹窗

### 注意事项

- 获取更新、上传更新包、更新说明、构建日志、恢复等待后续迭代
- 直接刷新版本管理 URL 时无 navigation state，卡片数据由 API 拉取

---

## [2026-06-10] 知识库 · 面包屑与侧栏高亮

### 改了什么

- **`router/index.ts`**：项目目录、版本管理及覆盖统计/漏洞库等子页，面包屑统一为「知识库管理（可点回 `/knowledge`）/ 当前页」；列表页去掉重复的「知识库管理 / 知识库管理」
- **`AdminLayout.vue`**：访问 `/knowledge/:id/versions` 或 `directory` 时，侧栏仍高亮「知识库管理」菜单项

---

## [2026-06-10] 知识库管理 · 开源项目列表（筛选/分页/编辑/删除）

### 改了什么

- **`views/knowledge/KnowledgeBaseList.vue`**：重写占位页，串联筛选区 + 表格 + 编辑/删除弹窗
- **`api/knowledge.ts`** + **`types/knowledge.ts`** + **`mock/modules/knowledge/knowledgeList.ts`**（26 条）
- **组件**：`KbProjectQueryBar`、`KbProjectTable`、`KbProjectActionCell`、`KbProjectEditModal`、`KbProjectDeleteModal`
- **工具**：`knowledgeQuery.ts`（筛选项与查询参数转换）、`knowledgeDisplay.ts`（分类/采集方式文案与 Tag 颜色）

### 怎么实现的

- 筛选复用 `ListQueryBar`：项目名称、分类（仿真框架/数值计算/工具链）、采集方式（云端仓库拉取/上传源码包）、最近更新（单日）
- 列表复用 `ListTable` + `useFilteredPaginatedList`，10 条/页，无列头排序
- 操作：项目目录 → `/knowledge/:id/directory`；版本管理 → `/knowledge/:id/versions`；编辑弹窗（除标签外必填）；删除需输入项目名称匹配后才可确认
- 编辑/删除成功后前端同步更新当前页列表项（删空当前页时自动回退一页）

### 注意事项

- 顶部「添加开源项目」按钮与底部概览卡片尚未实现
- 编辑弹窗暂不包含登录方式/凭据（仅基本信息字段，与原型 kb-edit 简化版一致）

---

## [2026-06-10] 项目管理 · 项目名称与负责人必填

- 新增项目弹窗：项目名称、负责人均必填（表单 `required` + 提交校验）
- `createProject` / `updateProject` API mock 层校验非空，保证列表负责人不为空

---

## [2026-06-10] 项目管理 · 创建后跳转详情 + 列表交互调整

### 改了什么

- 新增项目成功后跳转 `/projects/:projectId` 详情页
- 列表项目名称改为普通文本（不可点击）
- 操作「编辑」跳转详情页，不再弹窗编辑

---

## [2026-06-10] 报告列表 · 生成检测报告弹窗

### 改了什么

- **`ReportCreateBar`** + **`ReportGenerateModal`**：顶部「生成检测报告」按钮
- **`api/report.ts`**：新增 `generateReport()`，mock 插入「生成中」报告

### 怎么实现的

- 弹窗三项：项目（最新默认）、任务（按项目过滤、最新默认）、模板（`isDefault` 优先）
- 下拉 `listHeight=256`，超出滚动
- 底部提示链到 `/reports/templates`
- 确定后调 `generateReport`，列表回到第 1 页刷新

---

## [2026-06-10] 报告模板列表 · 筛选/发布/系统模板置顶

### 改了什么

- **`ReportTemplateQueryBar`**：模板名称、输出格式、可见范围、状态筛选
- **`ReportTemplatePublishModal`** + `publishReportTemplate()` API
- 系统模板（标准验收/管理摘要）列表置顶，操作列灰字「系统默认模版不可操作」
- 更新时间列改为仅 `YYYY-MM-DD`；草稿状态新增「发布模板」

### 注意事项

- 发布成功 toast 在 `ReportTemplatePublishModal` 内弹出
- 筛选后系统模板若不符合条件不会强制出现在结果中

---

## [2026-06-10] 报告管理 · 报告模板列表 + 侧栏调整

### 改了什么

- **`layouts/AdminLayout.vue`**：报告管理改为子菜单（报告列表 / 报告模板）
- **`views/report/ReportTemplate.vue`**：模板列表页
- **`views/report/ReportTemplateEditor.vue`**：编辑器占位页（路由 `/reports/templates/:templateId/edit`）
- **`api/reportTemplate.ts`** + **`mock/modules/report/templateList.ts`**（18 条 mock）
- **组件**：`ReportTemplateCreateBar`、`ReportTemplateCreateModal`、`ReportTemplateTable`、`ReportTemplateActionCell`、`ReportTemplateDeleteModal`、`ReportTemplateUnpublishModal`、`ReportTemplatePublishFailureModal`

### 怎么实现的

- 列表列：模板名称、版本、输出格式、可见范围、是否默认、状态（草稿/已发布/发布失败）、更新时间、操作
- 操作：
  - 编辑：跳转编辑器页
  - 删除：仅非系统模板；`标准验收报告`、`管理摘要报告`（`isSystem: true`）无删除按钮
  - 取消发布：仅已发布；确认后 API 并将行状态改为草稿
  - 失败原因：仅发布失败；弹窗打开时请求 API
- 新建：弹窗填名称 + 可选复制自 → 创建草稿 → 跳转编辑器

### 注意事项

- 编辑器页仍为占位，后续承接原型 Markdown 工作台
- 报告列表顶栏「生成报告」仍待实现

---

## [2026-06-10] 报告管理 · 报告列表页

### 改了什么

- **`views/report/ReportList.vue`**：报告列表页（顶部操作区暂未实现）
- **`api/report.ts`** + **`mock/modules/report/reportList.ts`**（24 条 mock）
- **组件**：`ReportQueryBar`、`ReportTable`、`ReportActionCell`、`ReportDeleteModal`、`ReportFailureReasonModal`、`ReportDownloadModal`、`ReportDetailDrawer`
- **工具**：`utils/reportQuery.ts`、`utils/reportDisplay.ts`、`utils/reportDownload.ts`、`utils/reportDownloadDisplay.ts`
- **mock**：`mock/modules/report/reportDownload.ts`（审批状态 + 导出策略摘要 + 下载文件名规则）

### 怎么实现的

- 筛选：报告名称、项目名称（input）、生成时间（单日 `a-date-picker`，格式 YYYY-MM-DD）
- 列表列：报告名称、关联项目、使用模板、生成时间、状态 Tag、操作
- 操作按状态：
  - 全部：删除（弹窗「删除后不可恢复，但不影响原始任务结果与证据链。」确认后调 API 并前端移除）
  - 已完成：查看（`ReportDetailDrawer` 右侧抽屉）、下载（见下方「报告下载」）
  - 失败：失败原因（弹窗打开时 `getReportFailureReason`）
- 复用 `ListQueryBar` + `ListTable` + `useFilteredPaginatedList`（10 条/页）

### 注意事项

- 报告列表已支持「生成检测报告」弹窗
- mock 下载链接为占位路径，联调后需替换为真实签名 URL
---

## [2026-06-10] 报告管理 · 查看抽屉

### 改了什么

- **`ReportDetailDrawer.vue`**：右侧抽屉，模式同 `LogDetailDrawer` / `VulnItemDetailDrawer`
- **`getReportDetail()`**：打开抽屉时按 `reportId` 拉取详情（mock 复用列表数据）

### 怎么实现的

- 仅「已完成」行展示「查看」；点击后 `openDetailDrawer` 传入 `reportId`
- 抽屉顶部 `a-descriptions`：报告名称、关联项目、模板、生成时间（`YYYY-MM-DD HH:mm`）
- 下方 `flex: 1` 预览区占位，后续接入 PDF / HTML Viewer
- 抽屉宽 840px，`body-style` 纵向 flex 占满可视高度

---

## [2026-06-10] 报告管理 · 下载流程

### 改了什么

- **`ReportList.vue`**：承接下载点击逻辑（审批判断 + 打开下载弹窗）
- **`ReportDownloadModal.vue`**：格式/证据链选择 + 策略摘要展示
- **`api/report.ts`**：新增 `getReportDownloadStatus`、`submitReportDownloadApplication`、`createReportDownload`（移除直链 `getReportDownloadUrl`）
- **`mock/modules/report/reportDownload.ts`**：审批状态与下载文件 mock

### 怎么实现的

1. 点击「下载」→ `getReportDownloadStatus(reportId)`
2. **需审批且未通过**（`report-003`）→ `Modal.confirm`「需要审批，是否提交申请？」→ 是则 `submitReportDownloadApplication`；审批中提示稍后再试
3. **无需审批或已审批**（普通报告 / `report-005`）→ 打开 `ReportDownloadModal`
4. 弹窗顶部 `a-alert` 展示：策略名、当前角色脱敏级别、水印预览（来自后端/mock 策略摘要）
5. 用户选：下载格式（默认 PDF，可选 Word/HTML）、是否包含证据链（是/否）
6. 确定 → `createReportDownload` → `triggerReportDownload`；含证据链时 mock 返回 `.zip`，否则按格式扩展名

### 注意事项

- mock 固定当前用户为「检测工程师 · 部分脱敏」；联调后由后端按 JWT 角色返回
- `report-003`（飞控V2周检报告）用于演示审批流；提交后变为 `pending_review`，需 mock 或后端改为 `approved` 才能下载

---

## [2026-06-10] 策略管理 · 策略列表页

### 改了什么

- **`views/policy/PolicyList.vue`**：策略列表完整页
- **`api/policy.ts`** + **`mock/modules/policy/policyList.ts`**（26 条 mock）
- **组件**：`PolicyCreateBar`、`PolicyQueryBar`、`PolicyTable`、`PolicyActionCell`、`PolicyDeleteModal`

### 怎么实现的

- 「添加策略」与操作列「编辑」跳转 `/policies/:policyId/edit`（新建用 `new`）
- 「版本/审批」「命中追溯」均跳转 `/policies/:policyId/governance`
- 删除：引用项目数=0 弹窗确认后调 API；>0 提示需先解绑项目，确定仅关闭
- 列表复用 `ListQueryBar` + `ListTable` + `useFilteredPaginatedList`（10 条/页）

### 注意事项

- `PolicyEditor` / `PolicyGovernance` 仍为占位页
- mock 中 `快速扫描策略`、`漏洞深度分析策略` 引用项目数为 0，可测删除流程

---

## [2026-06-10] 抽离列表表格样式壳层 ListTable

### 改了什么

- **`components/common/ListTable.vue`**：统一 `a-table` 外壳（`size=middle`、横向滚动、分页透传、`bodyCell` 插槽）
- **`utils/listTable.ts`**：`withListColumnDefaults()` 默认表头/单元格居中
- 全局工具类：`list-table-link`、`list-table-status-tag`、`list-table-action-dash`
- `ProjectTable`、`DetectTaskTable`、`ProjectActionCell`、`DetectTaskActionCell` 改用 `ListTable`

### 怎么用

```vue
<ListTable
  :columns="columns"
  :data-source="list"
  :loading="loading"
  :pagination="pagination"
  :scroll-x="1100"
  row-key="id"
>
  <template #bodyCell="{ column, record }">...</template>
</ListTable>
```

列定义无需再写 `align: 'center'`，由壳层自动补齐。

---

## [2026-06-10] 项目管理 · 项目列表页

### 改了什么

- **`views/project/ProjectList.vue`**：完整项目列表页（新增按钮、筛选、表格、分页）
- **`api/project.ts`** + **`mock/modules/project/projectList.ts`**：28 条 mock，支持筛选/分页/增删改
- **`types/project.ts`**、**`utils/projectQuery.ts`**、**`utils/projectDisplay.ts`**
- **组件**：`ProjectCreateBar`、`ProjectQueryBar`、`ProjectTable`、`ProjectActionCell`、`ProjectFormModal`（新增/编辑共用）、`ProjectDeleteModal`（名称二次确认）

### 怎么实现的

- 筛选区复用 `ListQueryBar`；创建时间用 `a-range-picker` + `show-time`
- 列表复用 `useFilteredPaginatedList`，每页 10 条，翻页重新请求
- 表格样式对齐检测任务列表：表头居中、右下分页器
- 删除弹窗：名称不一致时确定按钮禁用；一致才调 `deleteProject`
- 项目名称列 `router-link` 跳转 `/projects/:projectId`（详情页仍为占位）

### 注意事项

- 项目详情页 `ProjectDetail.vue` 尚未实现
- 联调时替换 `api/project.ts` 中四个函数即可，页面与组件无需改动

---

## [2026-06-10] 公共 Loading 与列表空状态引导组件

### 改了什么

- **`components/common/PageLoading.vue`**：基于 `a-spin` 的加载兜底
  - `loading`：是否显示遮罩
  - `tip`：提示文案，默认「加载中...」
  - `routeMode`：路由切换时为内容区预留最小高度，减少布局跳动
- **`components/common/ListEmptyGuide.vue`**：列表无数据时的引导占位
  - `title`：主标题（必填）
  - `description`：纯文本引导（当前页操作类场景）
  - `hintBefore` + `linkTo` + `linkText` + `hintAfter`：带跳转链接的引导（跨页场景）
  - `#hint` 插槽：完全自定义引导文案
- **`stores/layout.ts`**：新增 `pageLoading` / `setPageLoading`
- **`router/index.ts`**：路由 `beforeEach` 开启 loading，`afterEach` / `onError` 关闭
- **`AdminLayout.vue`**：`<router-view>` 外包 `PageLoading route-mode`
- **`Dashboard.vue`** / **`DetectTaskList.vue`**：接入上述组件

### 怎么用

**页面等接口数据：**
```vue
<PageLoading :loading="loading">
  <!-- 页面内容 -->
</PageLoading>
```

**列表无数据占位：**
```vue
<ListEmptyGuide
  title="暂无项目"
  hint-before="还没有项目，前往"
  link-to="/projects"
  link-text="项目管理"
  hint-after="创建第一个项目"
/>
<!-- 或当前页操作 -->
<ListEmptyGuide title="暂无检测任务" description="点击上方按钮创建任务" />
```

### 注意事项

- 路由 loading 仅作用于 `AdminLayout` 内页面；登录页不受影响
- 列表页首次加载用 `PageLoading`，有数据后翻页仍由 `a-table` 的 `loading` 负责，避免双重遮罩
- 其他未开发的列表页开发时直接复用 `ListEmptyGuide`，按业务填 `title` 和引导文案即可

---

## [2026-06-09] 抽离通用列表查询筛选（ListQueryBar + useFilteredPaginatedList）

### 改了什么

- **`components/common/ListQueryBar.vue`**：通用查询区外壳（卡片 + inline 表单 + 查询/重置按钮）
  - 默认插槽放业务筛选项；`extra-actions` 插槽可追加按钮（如目录树「展开全部」）
  - 全局工具类：`list-query-input` / `list-query-select` / `list-query-date`
- **`composables/useFilteredPaginatedList.ts`**：筛选 + 分页数据流
  - `filterForm`：表单状态
  - `appliedQuery`：点击查询后生效；翻页携带
  - `handleSearch` / `handleReset`：回第 1 页并请求
- `DetectTaskQueryBar` 改为基于 `ListQueryBar` 的业务字段封装
- `DetectTaskList` 改用 `useFilteredPaginatedList`

### 其他列表页如何复用

1. 定义 `XxxListFilters` + `createEmptyXxxFilters` + `xxxFiltersToQuery`（放 `types/` 或 `utils/`）
2. 可选：封装 `XxxQueryBar.vue`，内部用 `ListQueryBar` + 业务表单项
3. 页面：`useFilteredPaginatedList(getXxxList 包装, { createEmptyFilters, filtersToQuery })`

各页差异仅在**筛选项字段**和 **filtersToQuery**，样式与查询/重置逻辑共用。

---

## [2026-06-09] 检测任务创建入口改为单按钮 + 类型选择弹窗

### 改了什么

- `DetectTaskCreateBar`：顶部改为大号「创建检测任务」按钮
- 点击后弹出「选择检测类型」Modal，两张可点击卡片（自主率 / 开源风险）
- 选定类型后关闭弹窗并触发 `create-autonomy` / `create-risk`（创建向导仍待接入）

---

## [2026-06-09] 检测任务页「创建任务」操作条

### 改了什么

- ~~新增 `DetectTaskCreateBar.vue`：左侧文案「创建任务」+ 两个同级主按钮~~（已改为单按钮 + 类型弹窗，见上一条）

---

## [2026-06-09] 检测任务列表查询筛选

### 改了什么

- 新增 `DetectTaskQueryBar.vue`：任务名称、检测类型、关联项目、状态 + 查询/重置
- 状态筛选项含：全部、排队中、运行中、已完成、已暂停、已终止、失败
- `getTaskList()` mock 支持按筛选条件过滤后再分页；默认仍按 `createdAt` 倒序
- 查询：写入 `appliedQuery` → 回到第 1 页 → 请求 10 条
- 重置：清空表单与 `appliedQuery` → 回到第 1 页 → 无筛选请求
- 翻页：携带当前 `appliedQuery` 与页码一并请求

---

## [2026-06-09] 检测任务列表操作列与任务操作 API

### 改了什么

- 新增 `utils/taskActions.ts`：按状态返回操作项（空格分隔展示）
- 新增 `DetectTaskActionCell.vue`：操作链接 + 编辑/暂停/终止/继续/删除弹窗（编辑弹窗对齐原型：任务名称、扫描模式、重试次数）
- `DetectTaskTable` 增加 `showFullActions`（仅检测任务列表页启用）；首页仍为简化操作
- `api/detect.ts` 补充 mock：`updateDetectTask`、`terminateTask`；`delete/pause/resume` 会 mutate `MOCK_ALL_DETECT_TASKS`
- 操作成功后列表行就地更新；删除后移除行并修正 total

### 各状态操作

| 状态 | 操作 |
|---|---|
| 排队中 | 终止、编辑（仅自主率） |
| 运行中 | 暂停、终止、编辑（仅自主率） |
| 已完成 | 查看结果、删除 |
| 已暂停 | 继续任务、删除 |
| 已终止 | 删除 |
| 失败 | 查看日志、删除 |

---

## [2026-06-09] 检测类型配色与分页懒加载 composable

### 改了什么

- 检测类型 Tag 改为 **purple / magenta**，避开蓝/绿/红，减少与运行状态 Tag 撞色
- 新增 `composables/usePaginatedList.ts`：分页懒加载，每次只请求当前页，切换页码时重新调 API
- `DetectTaskList.vue` 改用 `usePaginatedList`，每页 10 条

### 怎么用

```ts
const { loading, list, pagination, loadPage, refresh } = usePaginatedList(
  async (params) => (await getTaskList(params)).data,
  { pageSize: 10 },
)
```

---

## [2026-06-09] 检测任务表格列与状态规范调整

### 改了什么

- **运行状态**收窄为 6 种：排队中、运行中、已完成、已暂停、已终止、失败（`TaskStatus` 类型同步更新）
- **进度**独立成列：进度条 + 百分比；排队固定 10%，运行中 30/60/90%，已完成 100%；失败/暂停/终止保留停止时进度
- **检测类型**恢复 Tag 配色：自主率=绿色、开源风险=橙色（不用蓝紫）
- **来源/模式**列：仅检测任务列表页展示（`showSourceMode`）；自主率对应全量/增量/快速扫描，风险对应项目扫描/导入SBOM
- `DetectTask` 新增 `sourceMode` 字段，mock 种子已更新
- 检测任务页分页改为 **10 条/页**；操作列「结果」改为「查看结果」

### 注意事项

- 首页 `DetectTaskTable` 不传 `showSourceMode`，不含来源/模式列
- 后端联调时 `TaskStatus` 与 `sourceMode` 枚举需与前端对齐

---

## [2026-06-09] 检测任务 mock 扩展与分页调整

### 改了什么

- `mock/modules/detect/taskList.ts`：生成 **52 条** mock（12 种种子轮转，覆盖 running/queued/success/failed 等）
- `getTaskList()` mock 分页：每页 20 条，total=52
- `getRecentTasks()` 改为从同一 `MOCK_ALL_DETECT_TASKS` 取最新 **10 条**
- 删除 `mock/modules/dashboard/recentTasks.ts`（避免双数据源）
- 检测任务页分页器：`showSizeChanger: false`，固定 20 条/页

---

### 改了什么

- 新增 `src/components/detect/DetectTaskTable.vue`：可复用任务列表（列、状态进度、操作跳转）
- 新增 `src/components/detect/TaskTypeText.vue`（从 dashboard 目录迁入 detect）
- 删除 `RecentTaskTable.vue`、`dashboard/TaskTypeText.vue`
- `Dashboard.vue` 改用 `DetectTaskTable`（无分页）
- `DetectTaskList.vue` 接入 `DetectTaskTable` + `getTaskList` 分页
- `taskDisplay.ts` 新增 `getTaskResultRoute`、`DETECT_TASK_TABLE_SCROLL_X`

### 为什么这么做

首页最近任务与检测任务列表列结构一致，抽成公共组件避免重复维护。

### 注意事项

- 检测任务页后续若增加「模式/来源、编辑/暂停」等列，可通过 props 扩展 `DetectTaskTable`，或新增 `variant="full"`

---

### 改了什么

- 进度条宽度减半（120px）；已完成/失败用同宽占位，与运行中/排队中 tag 左对齐
- 检测类型改为普通灰黑色文字，不再区分蓝/紫
- `getRecentTasks()` 统一排序截断：最多 10 条、按 `createdAt` 从新到旧
- 无数据时 `a-empty` + 引导链接至检测任务页

---

### 改了什么

- `RecentTaskTable.vue`：全列（含表头）居中对齐；运行状态列宽 220→440，状态 tag 与进度条横向并排；`scroll.x` 窄屏横向滚动

### 注意事项

- 列宽总和约 1110px，小于该宽度时表格底部出现横向滚动条

---

## [2026-06-09] 首页 Dashboard 实现（M01-S01-P01）

### 改了什么

- `src/views/dashboard/Dashboard.vue`：首页主体，a-row 栅格布局
- `src/components/dashboard/StatCard.vue`：顶部统计卡
- `src/components/dashboard/ChartPlaceholder.vue`：自主率趋势 / 漏洞分布占位
- `src/components/dashboard/TaskTypeText.vue`：检测类型纯文字色（无 tag 背景）
- `src/components/dashboard/RecentTaskTable.vue`：最近任务表格
- `src/api/dashboard.ts` + mock：`getDashboardOverview`、`getRecentTasks`
- `src/types/dashboard.ts`、`src/utils/taskDisplay.ts`

### 为什么这么做

按原型字段实现首页，布局用 Ant Design 栅格 + 卡片，不复刻 prototype CSS。图表接口尚未定，先用占位组件。

### 怎么实现的

- 顶部 4 卡：`getDashboardOverview()` 返回 stats 数组（数值 + 增长）
- 图表区：两个 `ChartPlaceholder`，后续接 ECharts + 独立 API
- 最近任务：`getRecentTasks()` 返回 `DetectTask[]`
  - 检测类型：`TaskTypeText` 蓝色/紫色文字
  - 运行中/排队中：`a-tag` + `a-progress` + 百分比（mock 含 10/30/60/90）
  - 已完成：操作「结果」→ 自主率 `/detect/tasks/:id/result` 或开源风险 `/detect/tasks/:id/risk`
  - 失败：「查看日志」→ `/system/logs?taskId=`
  - 运行中/排队中操作列显示「—」
- 耗时：`formatDurationMs` 格式化为 `2h15m`

### 注意事项

- 图表 API 尚未实现，见 `API.md` 待建行
- 最近任务与检测任务列表 mock 分离，联调时可改为同一后端接口

---

## [2026-06-09] 新增 API.md 联调清单与 update-api-doc skill

### 改了什么

- 新增 `.cursor/skills/update-api-doc/SKILL.md`：规定页面/API/mock 变更后必须更新根目录 `API.md`
- 新增 `API.md`（与 `background.md` 同级）：汇总当前 auth/detect mock 接口、计划真实 API、联调状态
- 更新 `sca-frontend-dev`、`new-page`、`update-engineer-doc` skill，开发后 checklist 增加 API.md

### 为什么这么做

forEngineer.md 偏「实现说明」，后端联调时需要单独一份「哪些还是 mock、将来接什么接口」的索引表。

### 怎么实现的

- `API.md` 分「按页面索引」和「按 api 模块索引」两张表
- 每行记录：api 函数、mock 文件、计划 `METHOD /path`、状态（mock/联调中/已对接）
- 开发新页面时在对应模块下追加行；联调完成后改状态为「已对接」

### 注意事项

- `API.md` 在仓库根目录 `SCA前端/API.md`，不是 `frontend/` 下
- 路由守卫里的 `getCurrentUser()` 也要登记（非页面直接调用）

---

## [2026-06-09] 面包屑自动生成

### 改了什么

- `src/types/breadcrumb.ts`：面包屑项类型 `BreadcrumbItem`
- `src/types/router.d.ts`：扩展 Vue Router `RouteMeta`（title / breadcrumbs / requiresAuth）
- `src/utils/breadcrumb.ts`：`crumbs()` 构造器 + `resolveBreadcrumbs()` 解析函数
- `src/router/index.ts`：25 条业务路由全部配置 `meta.breadcrumbs`（对齐 prototype crumbs）；`afterEach` 自动写入 layout store
- `src/stores/layout.ts`：新增 `mergeLastBreadcrumb()`，供详情页加载后替换最后一级为动态名称
- `src/layouts/AdminLayout.vue`：面包屑 `:key` 改为 index，避免同名项冲突

### 为什么这么做

之前 `setBreadcrumbs` 存在但没有任何地方调用，顶栏面包屑一直为空。现在在路由 meta 里声明一次，切换页面自动更新，页面无需重复写。

### 怎么实现的

1. 每条路由用 `crumbs('模块', { title: '列表', path: '/xxx' }, '当前页')` 声明层级
2. `crumbs()` 自动让最后一项不带 path（当前页不可点）
3. `router.afterEach` 调 `resolveBreadcrumbs(to)` → `layoutStore.setBreadcrumbs()`
4. 登录页 `requiresAuth: false`，afterEach 跳过，不污染面包屑

详情页如需显示动态名称（如项目名），数据加载完成后调用：

```ts
layoutStore.mergeLastBreadcrumb(project.name)
```

### 注意事项

- 新增页面时记得在路由 meta 里加 `breadcrumbs`，否则只会显示单级 title 兜底
- 中间层级需要可点击回退时，必须显式传 `path`（如项目详情 → 项目列表）

---

## [2026-06-09] 刷新页面后自动恢复用户信息（getCurrentUser）

### 改了什么

- `src/api/auth.ts`：新增 `getCurrentUser()` 函数（mock 阶段返回当前用户）
- `src/mock/modules/auth/users.ts`：新增 `mockCurrentUserRes`，复用登录 mock 里的 admin 用户信息
- `src/stores/auth.ts`：新增 `fetchUserInfo()` action，内部调 `getCurrentUser()` 写入 Pinia
- `src/router/index.ts`：路由守卫改为 `async`，有 token 但无 userInfo 时自动 `fetchUserInfo()`

### 为什么这么做

之前只有 `token` 存在 localStorage，`userInfo` 只在 Pinia 内存里。刷新后 Pinia 重置，顶栏姓名会变成「用户」。现在用 token 补拉一次用户信息，刷新后也能正常显示姓名。

### 怎么实现的

```
登录成功 → setToken + setUserInfo（Pinia 内存，顶栏立刻显示）
刷新 F5  → Pinia 清空，token 还在 localStorage
路由守卫 → 检测 isLoggedIn && !userInfo → await fetchUserInfo()
         → getCurrentUser() 返回 userInfo → 顶栏恢复显示
```

如果 `getCurrentUser` 失败（如 token 过期 401），守卫里会 `logout()` 并跳登录页。

### 注意事项

- mock 阶段 `getCurrentUser` 固定返回 admin 用户，联调时只需把函数体改成 `request.get('/api/auth/me')`
- `userInfo` 仍然不写入 localStorage，始终以接口为准，避免本地缓存过期

---

## [2026-06-09] 注册表单邮箱字段改为手机号

### 改了什么

- `src/stores/auth.ts`：`UserInfo` 接口的 `email` 字段改为 `phone: string`
- `src/api/auth.ts`：`RegisterParams` 接口的 `email` 改为 `phone`，`register` 函数传参同步更新
- `src/mock/modules/auth/users.ts`：所有用户 mock 数据的 `email` 字段替换为 `phone`（`138000000xx`）
- `src/views/login/LoginPage.vue`：注册表单字段 label 改为"手机号"，校验规则改为手机号正则

### 为什么这么做

产品需求：注册时用手机号而非邮箱，更符合国内用户习惯。

### 怎么实现的

手机号校验用正则 `/^1[3-9]\d{9}$/`，覆盖国内主流号段（13x~19x，11位）。其余逻辑不变。

### 注意事项

- 真实接口接入时，后端注册接口的字段名也应为 `phone`，需提前和后端对齐
- `UserInfo` 接口变了，如果后续有其他页面展示用户信息（如个人设置页），注意同步改字段

---

## [2026-06-09] 建立 mock 数据规范，挪走页面内的违规 mock

### 改了什么

- 新增 `.cursor/skills/mock-data/SKILL.md`：规定 mock 数据只能放在 `src/mock/modules/<模块>/<文件>.ts`
- 更新 `.cursor/rules/mock-strategy.mdc`：目录结构从扁平文件改为"模块子目录"
- 新增 `src/mock/modules/auth/users.ts`：存放用户相关 mock（已注册用户名列表、登录 mock、用户列表 mock）
- 新增 `src/api/auth.ts`：`login` / `checkUsernameAvailable` / `register` 三个 API 函数
- `src/mock/modules/detect.ts` → 移动到 `src/mock/modules/detect/taskList.ts`（对齐子目录规范）
- `src/views/login/LoginPage.vue`：删除页面内的 `MOCK_EXISTING_USERS` 常量，改为调用 `checkUsernameAvailable` API

### 为什么这么做

之前 `LoginPage.vue` 里直接定义了 mock 数组，导致 mock 数据散落在页面里，后续接真实接口时不好找、容易漏改。
统一放到 `src/mock/modules/` 后，接口切换只需改 `src/api/` 里的函数体，页面完全不用动。

### 怎么实现的

- **用户名重复检测**：注册时调 `checkUsernameAvailable(username)`，这个函数 mock 阶段对比 `MOCK_REGISTERED_USERNAMES` 数组，真实接口阶段换成 GET 请求
- **分层原则**：页面 → 调 api 函数 → api 函数引用 mock 文件。页面和 mock 之间没有直接依赖

### 注意事项

- `src/mock/` 下的文件**不要在生产环境中引用**，后续接真实接口时 api 文件里的 mock import 要全部删掉
- 接口对齐后，`MOCK_REGISTERED_USERNAMES` 数组也可以删了

---

## [2026-06-09] 登录页新增注册功能，顶部 Header 改为全屏宽度

### 改了什么

- `src/views/login/LoginPage.vue`：新增注册表单，支持登录/注册双模式切换
- `src/layouts/AdminLayout.vue`：Header 改为 `position: fixed; width: 100vw`，侧栏 z-index 更高（100 vs 99）覆盖重叠部分；侧栏宽度改为响应式（折叠时 64px，展开时 220px）

### 为什么这么做

- **Header 全屏**：视觉上顶栏应横贯全屏，之前因为受 `margin-left` 约束只有右侧宽度
- **注册功能**：登录页需要支持新用户注册

### 怎么实现的

**Header 全屏方案：**

现在的层级关系是：
```
侧栏  z-index: 100  ← 更高，挡住 header 左侧重叠区域
Header z-index: 99  ← left:0, width:100vw，横贯全屏
```
Header 设置 `position: fixed; left: 0; width: 100vw`，让它脱离右侧容器的约束铺满全屏。
侧栏的 z-index 比 Header 高 1，所以侧栏会自然压在 Header 上面，视觉上看不出重叠。
同时给 `admin-main` 加了 `padding-top: 56px`，因为 Header 固定定位后不再占文档流空间，内容区需要手动补偿这个高度。

面包屑加了 `padding-left` 和侧栏宽度同步，防止文字被侧栏遮住。

**侧栏响应式宽度：**

用 `computed` 算出当前宽度（展开 220 / 折叠 64），通过 Vue 3 的 CSS `v-bind` 直接绑定到 `margin-left` 和面包屑的 `padding-left`，折叠动画自带 `transition: 0.2s`。

**登录/注册切换：**

用一个 `mode: 'login' | 'register'` 的 ref 控制显示哪个表单（`v-if`）。
切换时调 `formRef.resetFields()` 清掉旧的校验提示，避免切过去就看到一堆红色报错。

注册表单校验：
- 用户名格式：正则 `/^[a-zA-Z0-9]{4,20}$/`
- 用户名唯一性：异步 validator，调 API 查重（mock 阶段本地对比列表）
- 密码强度：≥8位 + 含字母 + 含数字
- 确认密码：和 `password` 字段实时比对

### 注意事项

- 侧栏折叠按钮由 `a-layout-sider` 的 `collapsible` 属性自带，状态存在 `useLayoutStore().sidebarCollapsed`
- Header 的面包屑目前是手动维护的（需要在页面里调 `layoutStore.setBreadcrumbs`），后续可以考虑根据路由 meta 自动生成

---

## [2026-06-09] 工程脚手架搭建完成

### 改了什么

- 用 `npm create vite@latest frontend -- --template vue-ts` 初始化项目
- 安装：`ant-design-vue`、`vue-router`、`pinia`、`axios`、`echarts`、`@antv/g6`、`dayjs`
- 安装开发依赖：`unplugin-vue-components`（ADV 按需注册）、`unplugin-auto-import`
- 新增/修改的核心文件：

| 文件 | 作用 |
|---|---|
| `vite.config.ts` | `@` 路径别名、ADV 按需加载插件、API 代理 `/api → :8080` |
| `tsconfig.json` | 严格模式 + `@/*` 路径映射 |
| `.env.development/production` | 环境变量：API 地址、WebSocket 地址 |
| `src/main.ts` | 注册 Pinia、Router、Ant Design Vue |
| `src/layouts/AdminLayout.vue` | 全局管理后台布局：深色侧栏 + 顶栏 + 内容区 |
| `src/router/index.ts` | 25 条路由 + 登录鉴权守卫 + 动态页面 title |
| `src/utils/request.ts` | Axios 实例：自动带 token、统一错误提示、401 自动跳登录 |
| `src/stores/auth.ts` | 登录状态：token（localStorage 持久化）+ 用户信息 |
| `src/stores/layout.ts` | 布局状态：侧栏折叠、面包屑 |
| `src/types/common.ts` | 公共类型：`ApiResponse`、`PageResult`、`TaskStatus`、`RiskLevel` 等 |
| `src/types/detect.ts` | 检测任务相关接口类型 |
| `src/composables/useECharts.ts` | ECharts 生命周期封装（防内存泄漏）|
| `src/composables/usePolling.ts` | 安全轮询封装（自动清 interval）|
| `src/composables/useG6Graph.ts` | AntV G6 生命周期封装 |
| `src/views/login/LoginPage.vue` | 登录页 |
| `src/views/**`（24个） | 各模块占位页，路由可正常跳转 |

### 怎么实现的

**按需加载 Ant Design Vue：**
用 `unplugin-vue-components` + `AntDesignVueResolver` 自动识别模板里的 `a-xxx` 组件并按需 import，不需要在 `main.ts` 里手动 `app.use(Antd)` 全量引入（但这里为了简单保留了全量注册，后续可切按需）。

**路由鉴权：**
`router.beforeEach` 检查 token，没有 token 且访问需要鉴权的页面就跳登录。已登录时访问 `/login` 自动跳首页。

**Axios 拦截器：**
请求拦截：从 `localStorage` 取 token 塞进 `Authorization: Bearer xxx` header。
响应拦截：如果 `code !== 200` 就弹错误提示；HTTP 状态码 401 清 token 并跳登录页。

### 注意事项

- 24 个页面全是占位（显示"页面开发中"），后续按模块逐个实现
- mock 数据阶段所有接口都从 `src/mock/` 里取数据，真实接口接入时只需改 `src/api/` 里的函数体
