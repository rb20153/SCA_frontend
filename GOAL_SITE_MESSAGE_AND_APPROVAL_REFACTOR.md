# 站内消息与审批流程改造 Goal

> Status: Static implementation ready for user acceptance
>
> Owner: 前端 + 后端
>
> Last updated: 2026-08-30

## 0. Executive Summary

### Problem

当前站内消息只有基础列表、已读切换和少量演示数据。任务完成/失败、策略审批、报告下载审批、告警和系统公告没有形成完整的业务触发、跳转、审批和结果通知闭环；`go_approval` 目前只能跳策略审批，报告下载审批没有审批人工作流。

### Target Outcome

建立统一的站内消息事件模型和前后端协议：后端在业务事件成功后生成消息，前端按消息动作打开结果页、筛选列表、公告弹窗或审批抽屉。审批相关消息不可关闭，报告下载审批绑定申请参数并支持通过/驳回/重新申请/直接下载。接口尚未就绪时，前端使用独立模拟数据完整展示所有状态，联调完成后可删除模拟层切换真实接口。

### Business or User Value

用户能及时知道任务、报告和告警状态；管理员/审计员能从消息直接处理审批；审批意见、申请原因和下载参数可追溯，避免“申请成功但无人审批”或“驳回后仍可下载”的流程漏洞。

### P0 Outcomes

- [ ] 五类消息均有明确触发事件、接收人、关联对象、跳转动作和已读规则。
- [ ] 策略发布审批、报告下载审批均可从站内消息直接打开右侧审批抽屉并提交结果。
- [ ] 报告下载申请包含申请原因、格式、证据链参数；通过后按原参数直接下载，驳回后可重新申请。
- [ ] 模拟数据覆盖每种消息和审批状态，前端无后端接口时仍可验收完整交互。

### Implementation Status (2026-08-30)

- 已完成静态实现：统一消息 action、顶栏未读角标、策略与报告审批抽屉、报告下载申请、公告发布/查看、任务/告警/报告 ID 精确跳转，以及五类消息模拟场景。
- 模拟层已支持已读、公告发布、报告申请/审批/重申/下载和策略审批的一次性状态转换；页面、组件、store 不直接引用 mock。
- 已完成类型检查与生产构建。已登录浏览器验收、后端接口联调与 mock 移除保留到用户确认静态效果后进行。

## 1. Context and Current State

### Current State

- `/api/system/messages` 已支持分页查询；`/read-all` 和单条 `/read` 已支持。
- 消息类型已有 `task`、`approval`、`alert`、`report`、`system` 映射。
- 操作已有 `view_task_result`、`go_approval`、`view_alert`、`view_knowledge`、`change_password`、`view_report`。
- 任务通知只能跳转结果页；失败任务没有按任务 ID筛选协议。
- 告警和报告消息没有 ID 筛选协议；系统公告没有公告弹窗和发布入口。
- 报告下载已有状态查询、申请、创建下载接口，但申请没有申请原因，也没有审批人侧列表/抽屉/审批接口。
- 策略审批已有 `PolicyVersionApprovalDrawer`，可作为策略消息审批抽屉内容。
- 顶栏未读数尚未接入真实消息统计。

### Target State

消息由后端业务事件自动产生，前端只负责展示和执行统一 action；所有审批结果有状态条件更新和结果通知；站内消息操作完成后自动标记已读。详情页、列表筛选和抽屉均由消息携带的稳定 ID 驱动。

### Actors and Systems in Scope

- 普通用户：创建任务、生成/下载报告、接收结果和审批结果。
- 系统管理员、审计员：接收并处理策略发布审批、报告下载审批；必须具备对应页面 `read` 权限。
- 系统管理员：发布全局公告。
- 前端 Vue 3 + TypeScript + Ant Design Vue：消息中心、审批抽屉、结果页/列表跳转、模拟层。
- 后端认证、任务、策略、报告、告警、知识库和消息服务。

## 2. Scope Boundary

### In Scope

- 统一消息实体、动作 payload、事件码和接收人规则。
- 任务完成/失败消息、策略审批消息、报告下载审批及结果消息、告警消息、系统公告消息。
- 站内消息列表、未读角标、公告弹窗、审批抽屉和跨页面 URL 筛选。
- 报告下载申请原因和下载参数持久化。
- 前端 API/types/adapter/router/组件改造与独立模拟数据。
- 后端接口说明文档，包含请求/响应、状态码和事件触发规则。

### Explicitly Out of Scope

- 不改任务检测、报告生成、策略审批本身的业务算法。
- 不新增独立审批中心；本期审批入口来自站内消息和已有业务入口。
- 不允许前端代替后端生成真实业务消息或绕过后端权限、状态校验。

### Deferred Work

- 消息模板后台配置、定时汇总策略、消息撤回和批量删除。
- 多级审批、会签、转审和审批代理人。

## 3. Constraints, Assumptions, and Dependencies

### Constraints

- 复用现有 Ant Design Vue 组件和 `ReportPreviewViewer`、`PolicyVersionApprovalDrawer`。
- 不引入依赖；模拟数据放在 API/mock 边界，不写入页面组件。
- 审批提醒和审批结果通知不可被个人消息偏好关闭。
- 前端 `write:false` 仍隐藏写按钮；审批例外继续要求 `admin/auditor + 对应页面 read`。

### Assumptions

- 报告审批申请创建新申请记录，旧申请保留历史；同一报告/申请人同时最多一条审批中申请。
- 多审批人并发时先成功者生效，后者返回 `409` 并刷新状态。
- 任务完成和失败都通知任务创建人及项目负责人；运行中不通知；同一终态只发一条。
- 告警仅高危/严重新增、转派、处置逾期触发消息；普通级别只进告警中心。
- 公告支持全体、角色、部门三种范围；点击公告自动标记已读。

### Dependencies

| Dependency | Owner | Status |
|---|---|---|
| `/auth/me` 返回用户角色和页面 read/write 权限 | 后端认证 | Available |
| 消息事件落库、按用户查询和未读统计 | 后端消息服务 | To implement |
| 报告下载申请/审批接口及状态条件更新 | 后端报告服务 | To implement |
| 任务、告警、策略、知识库事件发布 | 后端各业务服务 | To implement |

## 4. System and Module Boundaries

| Boundary | Responsibility | Inputs | Outputs | Failure behavior |
|---|---|---|---|---|
| 后端业务服务 | 在事务成功后产生事件和消息 | 任务/审批/报告/告警/公告事件 | 消息记录、关联 ID、action | 业务成功但消息失败需重试并记录，不回滚主业务 |
| `/api/system/messages` | 查询当前用户消息、未读数、已读 | 用户 token、筛选、分页 | 标准消息实体 | 返回空列表，不返回其他用户数据 |
| 前端消息适配层 | 兼容 camel/snake、短/长枚举 | API 或 mock payload | `SiteMessage` | 未知 action 只展示消息，不误跳转 |
| 前端导航层 | 解析 action 并打开目标 | action + URL | 结果页、筛选列表、公告弹窗、审批抽屉 | 缺少 ID 时提示并停留当前页 |
| 前端审批层 | 展示申请详情并提交结论 | approval payload | approved/rejected | 409 提示已被其他审批人处理并刷新 |

## 5. Core Contracts

### Standard Message Entity

```json
{
  "messageId": "msg-001",
  "type": "task|approval|alert|report|system",
  "eventCode": "task.completed",
  "title": "任务已完成",
  "summary": "自主率检测任务已完成",
  "content": "任务名称、项目名称、状态和失败原因等完整内容",
  "recipientUserId": "user-001",
  "createdAt": "2026-08-30T10:00:00Z",
  "read": false,
  "action": {
    "type": "view_task_result",
    "label": "查看结果",
    "taskType": "autonomy",
    "taskId": "task-001"
  }
}
```

`action` 可为空。未知 `eventCode` 或 action 时仍显示标题、摘要、正文和已读操作，但不显示错误跳转按钮。

### Message Types and Trigger Rules

| Type | Event codes | Trigger and recipients | Action |
|---|---|---|---|
| `task` 任务通知 | `task.completed`, `task.failed` | 自主率、开源风险、AI 分析任务进入终态；通知创建人和项目负责人；每个任务终态幂等一条 | 完成：按 `taskType/taskId` 进入对应结果页；失败：进入对应列表页并带 `?taskId=` 精确筛选 |
| `approval` 审批提醒/结果 | `policy.version.submitted`, `report.download.submitted`, `policy.approval.completed`, `report.download.completed` | 待审批通知系统管理员/审计员中具备对应页面 read 的人员；结果通知申请人；不可关闭 | 策略：直接打开现有策略审批抽屉；报告待审：打开报告审批抽屉；报告通过：去下载；报告驳回：重新申请 |
| `alert` 告警摘要 | `alert.high_created`, `alert.critical_created`, `alert.assigned`, `alert.overdue` | 高危/严重新增、转派、逾期；通知项目负责人和当前处理人 | `/system/alerts?alertId=`，进入告警中心并按 ID筛选 |
| `report` 报告通知 | `report.generated`, `report.generation_failed` | 报告生成完成/失败；通知报告创建人 | `/reports?reportId=`，按报告 ID筛选；失败消息不直接下载 |
| `system` 系统公告/系统事件 | `system.announcement`, `password.updated`, `password.reset`, `role.changed`, `department.changed`, `knowledge.sync_failed` | 密码、角色、部门、知识库同步等由后端自动产生；公告由管理员发布并按范围分发 | 公告：打开标题+正文弹窗；密码重置：去修改密码；其他事件按 action 或仅阅读 |

### Action Types

新增/保留以下动作：

- `view_task_result`: `taskType`, `taskId`；完成跳结果页。
- `view_task_list`: `taskType`, `taskId`；失败跳列表并带任务 ID筛选。
- `open_policy_approval`: `policyId`, `versionId`；直接打开策略审批抽屉，不跳转页面。
- `open_report_approval`: `applicationId`, `reportId`；直接打开报告审批抽屉。
- `retry_report_download_application`: `reportId`；打开申请原因/下载参数弹窗。
- `download_report`: `reportId`, `applicationId`, `format`, `includeEvidenceChain`；按审批参数直接创建下载并触发浏览器下载。
- `view_alert`: `alertId`；跳 `/system/alerts?alertId=`。
- `view_report`: `reportId`；跳 `/reports?reportId=`。
- `view_announcement`: `announcementId`；打开公告弹窗并标记已读。
- `change_password`: 现有密码修改跳转。

### Report Download Application

```json
{
  "applicationId": "download-app-001",
  "reportId": "report-001",
  "applicantId": "user-002",
  "applicantName": "张三",
  "reason": "客户验收需要",
  "format": "pdf|word|html",
  "includeEvidenceChain": false,
  "status": "pending_review|approved|rejected",
  "approvalOpinion": "审批意见",
  "createdAt": "2026-08-30T10:00:00Z",
  "processedAt": null
}
```

状态：`pending_review -> approved|rejected`；`rejected -> pending_review` 通过新申请记录重新申请。已 `approved` 的申请不可重复审批；并发审批后者返回 `409`。

### Access and Safety Rules

- 策略审批：`roleCode` 为 `admin` 或 `auditor` 且 `/policies.read=true`。
- 报告下载审批：`roleCode` 为 `admin` 或 `auditor` 且 `/reports.read=true`。
- 报告申请人只能查看自己的申请和结果；审批人只能处理分配给其权限范围的待审申请。
- 前端隐藏按钮只是体验保护；后端必须校验角色、页面权限、申请状态和并发版本。

## 6. Ordered Goals

### Goal 0 - 模拟数据与适配层

**Outcome:** 在无新增后端接口时，可通过 mock API 展示所有消息、审批和状态流。

#### Functional Work

- [ ] 新建独立 `src/mock/siteMessageScenarios.ts`（或等价 mock boundary），包含五类消息及全部动作 payload。
- [ ] 覆盖未读/已读、任务完成/失败、策略待审、报告待审/通过/驳回、告警高危/转派/逾期、报告完成/失败、系统公告/密码/角色部门/知识库异常。
- [ ] mock 支持申请原因、审批意见、审批状态转移、409 并发示例和下载链接占位。
- [ ] API 层优先请求真实接口，开发配置或接口未实现时回退 mock；页面组件不得直接导入 mock。

#### Acceptance Criteria

- [ ] 每种消息在列表中可见，字段不为空，操作文案和跳转正确。
- [ ] mock 能完成报告提交申请、审批通过/驳回、重新申请和直接下载演示。

### Goal 1 - 消息模型、未读角标与通用导航

**Outcome:** 站内消息页面和顶栏使用真实/模拟统一模型。

- [ ] 扩展 `SiteMessageActionType`、action 字段和 adapter。
- [ ] 增加未读数接口或从分页响应提取未读数，接入顶栏角标；登录后、路由回到前台和已读操作后刷新。
- [ ] 公告详情弹窗复用通用 Modal；打开成功后标记已读。
- [ ] 任务完成跳对应结果页；失败跳对应列表并传 `taskId`；告警/报告按 ID筛选。
- [ ] 失败、缺 ID、未知 action、接口错误均有明确提示和可重试行为。

### Goal 2 - 策略版本审批消息

**Outcome:** 策略发布申请后，审批人从消息直接打开已有审批抽屉。

- [ ] 新增 `open_policy_approval` action，携带 `policyId/versionId`。
- [ ] 抽屉复用 `PolicyVersionApprovalDrawer`，加载差异、申请人、变更摘要并提交通过/驳回。
- [ ] 审批提交后刷新版本列表和消息；申请人收到审批结果消息。
- [ ] 无权限、已处理和并发 409 均阻止重复提交。

### Goal 3 - 报告下载申请与审批抽屉

**Outcome:** 报告下载审批形成完整闭环。

- [ ] 改造申请弹窗：申请原因、下载格式、是否包含证据链；新申请和重新申请共用。
- [ ] 新增报告审批右侧抽屉：申请人、申请原因、复用 `ReportPreviewViewer` 展示报告、审批结论和审批意见。
- [ ] 审批通过消息的“去下载”直接调用下载接口，使用审批时保存的格式和证据链参数。
- [ ] 驳回消息显示审批意见并提供“重新申请”，打开申请弹窗而不是直接下载。
- [ ] 预览失败不阻断审批；下载/审批接口错误可重试。

### Goal 4 - 自动系统消息与公告发布

**Outcome:** 系统事件由后端自动产生，管理员可发布公告。

- [ ] 站内消息页仅管理员显示“发布公告”按钮；弹窗支持标题、正文、全体/角色/部门范围。
- [ ] 发布调用公告接口；后端按范围生成 `system.announcement` 消息。
- [ ] 密码更新/重置、角色部门变更、知识库同步异常由后端事件自动生成，不提供前端手工创建入口。

### Goal 5 - 后端接口联调与 mock 移除

**Outcome:** 所有消息和审批使用真实接口，保留可回滚的 mock 开关直到验收完成。

- [ ] 按 `BACKEND_SITE_MESSAGE_AND_APPROVAL_API.md` 对齐接口字段、状态码和权限。
- [ ] 使用真实接口完成全链路验收后移除 mock 文件、fallback 分支和演示入口。
- [ ] 清理仅 mock 使用的类型和 adapter 分支，不影响未知字段兼容。

## 7. Backend API Contract To Implement

### Existing APIs to Extend

- `GET /api/system/messages`：支持 `type/title/readStatus/page/pageSize`；响应消息标准实体及 action。
- `GET /api/system/messages/unread-count`：返回当前用户未读数。
- `POST /api/system/messages/read-all`、`PATCH /api/system/messages/{messageId}/read`：审批消息同样可读，但不可关闭其产生规则。
- `GET /api/reports/{reportId}/download-status`：返回当前申请状态及已保存申请参数。
- `POST /api/reports/{reportId}/download-applications`：请求体增加 `reason/format/includeEvidenceChain`，返回 `applicationId` 和状态。
- `POST /api/reports/{reportId}/downloads`：通过 `applicationId` 校验 approved 状态，并按审批参数下载。
- `GET /api/alerts`：增加 `alertId` 精确筛选参数。
- `GET /api/reports`：增加 `reportId` 精确筛选参数。
- 各任务列表接口：增加 `taskId` 精确筛选参数。

### New APIs

- `GET /api/report-download-applications/pending`：审批人待处理申请分页列表。
- `GET /api/report-download-applications/{applicationId}`：申请详情，含报告预览关联信息。
- `POST /api/report-download-applications/{applicationId}/approval`：请求体 `{ conclusion: "approved|rejected", opinion: string }`；状态条件更新，重复处理返回 `409`。
- `POST /api/system/announcements`：管理员发布公告，请求体 `{ title, content, audienceType, audienceIds[] }`。
- `GET /api/system/announcements/{announcementId}`：公告详情（如消息 content 不完整时使用）。
- `GET /api/system/messages/{messageId}`：可选，读取完整正文/关联数据。

### Backend Event Rules

- 业务事务成功后投递事件，消息落库幂等键建议为 `eventCode + businessId + recipientUserId`。
- 审批待办只发送给 `admin/auditor` 且具有对应页面 read 权限的用户；后端不能只依赖前端权限。
- 审批结果通知申请人；报告下载审批通过/驳回摘要必须包含审批意见。
- 消息生成失败需要重试、日志和告警；不能让主业务成功但前端永远没有待办而无迹可查。

## 8. Validation Strategy

### Automated Verification

- adapter：五类消息、短/长枚举、camel/snake 字段、未知 action。
- action route：任务成功/失败、告警 ID、报告 ID、公告、策略/报告审批。
- 状态机：报告 `pending_review -> approved/rejected -> pending_review`；重复审批和非法状态拒绝。
- 权限：管理员/审计员有对应 read 才能审批；普通用户不能打开或提交审批。
- mock/API fallback：真实接口失败或未实现时展示 mock，且页面无直接 mock 依赖。

### Manual or Browser Checks

- 顶栏未读数、消息筛选、单条/全部已读。
- 任务完成/失败消息分别跳结果页和带任务 ID的列表。
- 策略审批消息直接打开现有审批抽屉。
- 报告审批抽屉预览、申请原因、审批意见、通过下载、驳回重新申请。
- 告警/报告 ID筛选和清空筛选。
- 公告发布、公告查看弹窗和自动已读。
- 刷新、空列表、接口错误、预览失败、409 并发、无权限访问。

## 9. Non-Functional Acceptance

- 权限：所有审批接口后端校验角色、页面 read、申请状态和对象归属。
- 一致性：审批结果、站内消息和下载状态最终一致；重复事件不产生重复待办。
- 可追溯：申请原因、审批意见、申请人、审批人、时间、报告/版本 ID保留。
- 可恢复：消息查询失败可重试；预览失败不阻断审批；409 后刷新当前状态。
- 兼容：后端缺少新字段时 adapter 使用明确空值；未知 action 不误跳转。

## 10. Definition of Done

- [ ] 本文接口文件已交后端确认，字段、事件、权限和状态码无歧义。
- [ ] 模拟数据覆盖全部五类消息及所有确认状态，静态前端验收通过。
- [ ] 真实接口联调完成，mock fallback 已按验收结果移除。
- [ ] 类型检查、生产构建、核心组件测试和浏览器验收通过。
- [ ] 站内消息、审批、报告下载、权限和异常状态有可复现证据。

## 11. Open Questions at Handoff

- 后端最终确认报告预览是否直接复用现有 `/api/reports/{reportId}/preview`，以及下载接口如何传 `applicationId`。
- 后端最终确认任务列表、告警列表和报告列表对 `taskId/alertId/reportId` 的 query 字段名。
- 后端确认公告正文是否始终随消息返回，还是必须调用公告详情接口。

## 12. Change Log

| Date | Change | Reason | Author |
|---|---|---|---|
| 2026-08-30 | Confirmed full message and approval workflow plan | User confirmed all decisions and requested mock-first implementation | Codex |
