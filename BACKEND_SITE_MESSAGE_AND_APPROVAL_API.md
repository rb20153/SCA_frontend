# 站内消息、公告与报告下载审批接口契约

> 文档状态：待后端确认并实现。
> 前端状态：已切换真实接口；站内消息未读数接口未提供时，前端仅回退原消息列表接口。
> 范围：站内消息、公告、策略审批消息跳转、报告下载申请与审批、任务/告警/报告精确筛选。

## 0. 本次站内消息改造说明（请后端先阅读）

### 0.1 为什么要改

改造前，前端只有“站内消息列表 + 单条/全部已读”的基础能力：消息内容多为演示数据，点击操作只能做少量通用跳转。任务完成或失败、策略版本待审批、报告下载待审批、告警、报告生成结果和系统公告没有统一的事件模型，也没有稳定的关联 ID；因此出现“有消息但不能直达对应处理页面”“报告下载申请后审批人没有待办”“审批结束后申请人没有可下载/重申入口”等断链。

本次前端已将消息中心改为业务流程入口。后端需要在对应业务成功后自动生成消息，并在消息中携带**事件码、完整正文、收件人和 action 关联 ID**。前端不创建真实业务消息、不绕过后端审批或权限，只负责展示、打开已有抽屉、跳转列表/结果页和发起已定义的请求。

### 0.2 前后变化对照

| 项目 | 改造前 | 改造后，后端需要做什么 |
| --- | --- | --- |
| 消息查询 | `GET /api/system/messages` 基础分页、已读状态 | **继续保留**，并逐步在每条记录增加 `eventCode`、`content`、`action`；旧字段前端仍兼容 |
| 未读角标 | 无独立总数接口 | 新增 `GET /api/system/messages/unread-count`；未上线前前端会使用旧列表 `readStatus=unread` 临时统计 |
| 任务消息 | 无明确结果入口 | 任务完成/失败后自动建消息；action 必须含 `taskType/taskId`。完成跳结果页，失败跳任务列表并按 ID 筛选 |
| 策略审批 | 审批在策略页，消息没有直达待办 | 策略提交后向符合权限的管理员/审计员发 `open_policy_approval`，携带 `policyId/versionId`；审批结束通知申请人 |
| 报告下载 | 申请原因、格式、证据链参数与审批人流程不完整 | 新增申请、审批详情、审批、受控下载接口；申请人和审批人通过消息完成待办、通过下载、驳回重申闭环 |
| 告警/报告通知 | 消息不能精确定位对象 | action 携带 `alertId/reportId`；列表接口支持对应 ID 精确筛选 |
| 系统公告 | 没有发布与范围分发 | 管理员发布后后端按全体/角色/部门实际生成公告消息；不支持指定人员 |
| 系统事件 | 密码、角色、部门、知识库异常无统一通知 | 对应业务完成后由后端自动生成系统消息，前端不提供手工创建入口 |

### 0.3 前端收到消息后的动作

| action | 用户点击后的前端动作 | 后端必须给出的关联字段 |
| --- | --- | --- |
| `view_task_result` | 打开任务结果页 | `taskType`、`taskId` |
| `view_task_list` | 打开对应任务列表并按任务 ID 筛选 | `taskType`、`taskId` |
| `open_policy_approval` | 当前消息页打开已有策略审批抽屉 | `policyId`、`versionId` |
| `open_report_approval` | 当前消息页打开报告下载审批抽屉 | `applicationId`、`reportId` |
| `download_report` | 依据批准时保存的参数调用下载接口 | `applicationId`、`reportId`、`format`、`includeEvidenceChain` |
| `retry_report_download_application` | 打开报告下载申请弹窗 | `reportId` |
| `view_alert` / `view_report` | 跳告警中心/报告列表，并精确筛选 | `alertId` / `reportId` |
| `view_announcement` | 打开公告正文弹窗 | `announcementId` |

关联字段缺失时前端会停止跳转并提示“缺少关联信息”，所以后端在生成消息时不得省略该 action 的必填 ID。

### 0.4 后端实施边界

1. 保持旧的消息查询、单条已读、全部已读接口可用，先不影响现有用户。
2. 新的 `action`/`eventCode` 字段允许分批上线；前端收到旧消息仍照常展示，只是不显示无法执行的业务操作。
3. 新的报告下载审批、公告接口尚未实现时会直接返回真实错误，前端不会再用 Mock 伪造成功结果。
4. 每次业务事件必须在主事务成功后再投递消息；投递失败需要重试和告警，不能影响主业务成功，也不能静默丢消息。

## 1. 通用约定

### 1.1 鉴权

- 全部接口通过 `Authorization: Bearer <token>` 获取当前用户，禁止信任 body 中用户 ID、用户名、角色。
- 发布公告：仅 `roleCode=admin`。
- 策略审批：`roleCode in (admin,auditor)` 且 `/policies.read=true`。
- 报告下载审批：`roleCode in (admin,auditor)` 且 `/reports.read=true`。
- 报告下载：申请属于当前 token 用户、状态为 `approved` 且申请的报告 ID 与 URL 一致。
- 查看、标记消息已读：消息收件人必须为当前 token 用户。

前端的菜单/按钮隐藏只做体验保护，后端必须独立完成以上校验。

### 1.2 响应、分页与错误

成功响应：

```json
{ "code": 0, "message": "success", "data": {} }
```

分页 `data` 推荐：

```json
{ "list": [], "total": 0, "page": 1, "pageSize": 10 }
```

现有 `records/current/size` 格式前端也兼容。

| HTTP | 场景 | 前端处理 |
| --- | --- | --- |
| `400` | 参数、格式或状态不合法 | 展示 `message`，允许修正后重试 |
| `401` | token 失效 | 清理登录态并跳登录页 |
| `403` | 无页面、对象或审批权限 | 提示无权限，不更新本地状态 |
| `404` | 消息、申请、公告或对象不存在 | 提示并刷新当前列表 |
| `409` | 重复待审申请、并发审批已处理 | 提示最新状态并刷新 |
| `500` | 内部错误 | 展示失败，可重试 |

时间字段统一 ISO 8601 UTC，如 `2026-08-30T10:00:00Z`；布尔值使用 JSON `true/false`。

## 2. 站内消息

### 2.1 消息实体

`GET /api/system/messages` 每条消息返回：

```json
{
  "messageId": "msg-20260830-001",
  "type": "approval",
  "eventCode": "report.download.submitted",
  "title": "报告下载申请待审批",
  "summary": "张三申请下载《开源风险检测报告》",
  "content": "申请原因：客户验收需要；导出格式：PDF；包含证据链：否。",
  "recipientUserId": "user-auditor-001",
  "recipientUsername": "auditor",
  "createdAt": "2026-08-30T10:00:00Z",
  "read": false,
  "action": {
    "type": "open_report_approval",
    "label": "去审批",
    "applicationId": "download-app-001",
    "reportId": "report-001"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `messageId` | string | 是 | 消息唯一 ID |
| `type` | string | 是 | `task`、`approval`、`alert`、`report`、`system`；前端兼容旧的 `*_notice` 枚举 |
| `eventCode` | string | 是 | 业务触发事件，见 3.1 |
| `title` / `summary` / `content` | string | 是 | `content` 为完整正文，不能仅返回截断文本 |
| `recipientUserId` | string | 是 | 收件人 ID，仅审计展示；权限以 token 为准 |
| `recipientUsername` | string | 建议 | 兼容旧接口，可缺省 |
| `createdAt` | string | 是 | ISO 时间 |
| `read` | boolean | 是 | 当前收件人的已读状态 |
| `action` | object/null | 是 | 无操作时前端仅展示正文与已读操作 |

未知 `type/eventCode/action.type` 不应使消息列表失败；前端会展示正文但不执行未知跳转。

### 2.2 查询和已读接口

#### `GET /api/system/messages`（现有接口，必须保留）

按当前 token 用户查询，排序 `createdAt DESC`。

| Query | 类型 | 说明 |
| --- | --- | --- |
| `type` | string | `task|approval|alert|report|system` |
| `title` | string | 标题模糊查询 |
| `readStatus` | string | `all`、`read`、`unread` |
| `page` / `pageSize` | number | 页码从 1 开始，建议 pageSize 上限 100 |
| `recipientUsername` | string | 旧接口兼容字段；服务端必须仍以 token 为准 |

此接口是旧后端兜底：即使未提供新消息事件字段，也必须继续返回原有列表数据；前端已兼容 `message_id/id`、`content/body/detail`、`read/isRead/readStatus`、`list/items/records` 等旧字段。

#### `GET /api/system/messages/unread-count`（新增）

```json
{ "code": 0, "message": "success", "data": { "count": 3 } }
```

后端尚未提供该接口时，前端只在 HTTP `404/405` 情况回退请求上述旧列表接口：`readStatus=unread&page=1&pageSize=100`。因此后端应尽快实现未读总数接口，避免大于 100 条时统计不精确。

#### `PATCH /api/system/messages/{messageId}/read`（现有接口）

请求：

```json
{ "read": true }
```

仅允许当前收件人修改。成功 `data: null`；他人消息 `403`，不存在 `404`。

#### `POST /api/system/messages/read-all`（现有接口）

建议无请求体；为兼容旧前端，可忽略 body 的 `recipientUsername`。响应：

```json
{ "code": 0, "message": "success", "data": { "updatedCount": 12 } }
```

## 3. 事件和 action

### 3.1 后端事件规则

业务事务成功提交后投递消息，建议幂等键：`eventCode + businessId + recipientUserId`。消息投递失败必须重试、记录日志并告警，不得静默丢失。

| type | eventCode | 触发 | 接收人 | action |
| --- | --- | --- | --- | --- |
| `task` | `task.completed` | 自主率、开源风险、AI 分析任务完成 | 创建人、项目负责人 | `view_task_result` |
| `task` | `task.failed` | 任务失败 | 创建人、项目负责人 | `view_task_list` |
| `approval` | `policy.version.submitted` | 提交策略发布申请 | 具备策略审批条件的管理员/审计员 | `open_policy_approval` |
| `approval` | `policy.approval.completed` | 策略审批完成 | 版本申请人 | 审批结果正文 |
| `approval` | `report.download.submitted` | 提交报告下载申请 | 具备报告审批条件的管理员/审计员 | `open_report_approval` |
| `approval` | `report.download.completed` | 报告下载审批完成 | 申请人 | `download_report` 或 `retry_report_download_application` |
| `alert` | `alert.high_created` / `alert.critical_created` | 高危/严重告警新增 | 项目负责人、当前处理人 | `view_alert` |
| `alert` | `alert.assigned` / `alert.overdue` | 告警转派或逾期 | 当前处理人、项目负责人 | `view_alert` |
| `report` | `report.generated` / `report.generation_failed` | 报告完成或失败 | 报告创建人 | `view_report` |
| `system` | `system.announcement` | 管理员发布公告 | 全体/角色/部门范围内用户 | `view_announcement` |
| `system` | `password.updated` / `password.reset` / `role.changed` / `department.changed` / `knowledge.sync_failed` | 对应系统事件 | 受影响用户或管理员 | 无或 `change_password` |

同一任务同一终态、同一收件人只生成一条消息。审批提醒和审批结果消息不可被个人偏好关闭。

### 3.2 action 载荷

| `action.type` | 必填字段 | 前端行为 |
| --- | --- | --- |
| `view_task_result` | `taskType`, `taskId` | 跳对应任务结果页 |
| `view_task_list` | `taskType`, `taskId` | 跳任务列表并带 `?taskId=` |
| `open_policy_approval` | `policyId`, `versionId` | 在消息页打开策略审批抽屉 |
| `open_report_approval` | `applicationId`, `reportId` | 在消息页打开报告下载审批抽屉 |
| `download_report` | `applicationId`, `reportId`, `format`, `includeEvidenceChain` | 调用下载接口 |
| `retry_report_download_application` | `reportId` | 打开下载申请弹窗 |
| `view_alert` | `alertId` | 跳 `/system/alerts?alertId=` |
| `view_report` | `reportId` | 跳 `/reports?reportId=` |
| `view_announcement` | `announcementId` | 打开公告详情弹窗 |
| `change_password` | 无 | 跳个人设置密码区域 |

每项 action 应含 `label`。关联 ID 缺失时前端不跳空页面并提示错误。

## 4. 报告下载申请和审批

### 4.1 `GET /api/reports/{reportId}/download-status`

点击下载时调用。响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "reportId": "report-001",
    "requiresApproval": true,
    "approvalState": "pending_submit",
    "applicationId": null,
    "reason": null,
    "format": null,
    "includeEvidenceChain": null,
    "exportPolicy": {
      "policyName": "报告外发脱敏策略",
      "desensitizeRoleLabel": "外部访客",
      "desensitizeLevel": "高",
      "watermarkPreview": "仅限授权使用"
    }
  }
}
```

`approvalState`：`not_required`、`pending_submit`、`pending_review`、`approved`、`rejected`。已申请时必须返回保存的 `reason/format/includeEvidenceChain/applicationId`。

### 4.2 `POST /api/reports/{reportId}/download-applications`

请求：

```json
{ "reason": "客户验收需要", "format": "pdf", "includeEvidenceChain": false }
```

| 字段 | 校验 |
| --- | --- |
| `reason` | 必填，去首尾空格后建议 1-500 字符 |
| `format` | 必填：`pdf`、`word`、`html` |
| `includeEvidenceChain` | 必填 boolean |

响应：

```json
{ "code": 0, "message": "申请已提交", "data": { "applicationId": "download-app-001", "status": "pending_review" } }
```

创建成功后必须保存完整参数、向合格审批人生成 `report.download.submitted` 消息。同一 `reportId + applicantId` 有 `pending_review` 申请时返回 `409`；驳回后重新申请创建新记录，旧记录保留。

### 4.3 `GET /api/report-download-applications/{applicationId}`

申请人本人或有审批权限者可访问。响应 `data`：

```json
{
  "applicationId": "download-app-001",
  "reportId": "report-001",
  "applicantId": "user-002",
  "applicantName": "张三",
  "reason": "客户验收需要",
  "format": "pdf",
  "includeEvidenceChain": false,
  "status": "pending_review",
  "approvalOpinion": "",
  "approvedByUserId": null,
  "approvedByName": null,
  "createdAt": "2026-08-30T10:00:00Z",
  "processedAt": null
}
```

状态只能为 `pending_review`、`approved`、`rejected`；审批完成后必须返回意见和处理时间。

### 4.4 `POST /api/report-download-applications/{applicationId}/approval`

请求：

```json
{ "conclusion": "approved", "opinion": "报告用途合理，同意下载。" }
```

`conclusion` 只能为 `approved/rejected`；`opinion` 必填，建议 1-500 字符。不得由前端传审批人 ID。

实现必须条件更新：`WHERE application_id=? AND status='pending_review'`。更新成功一行才返回成功；更新零行时查状态，已处理返回 `409`，不存在返回 `404`。

成功后向申请人生成 `report.download.completed` 消息：

- 通过：`action.type=download_report`，必须携带原申请 `applicationId/reportId/format/includeEvidenceChain`，正文含审批意见。
- 驳回：`action.type=retry_report_download_application`，携带 `reportId`，正文含审批意见。

### 4.5 `POST /api/reports/{reportId}/downloads`

请求：

```json
{ "applicationId": "download-app-001", "format": "pdf", "includeEvidenceChain": false }
```

后端必须以申请落库参数为准。body 与落库 `format/includeEvidenceChain` 不一致返回 `400`，不允许按前端篡改值导出。申请不属于当前用户返回 `403`；不是 `approved` 返回 `409`；申请与 URL 报告不一致返回 `400`。

响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "downloadUrl": "https://example.invalid/signed/report-001.pdf",
    "fileName": "开源风险检测报告.pdf",
    "expiresAt": "2026-08-30T11:00:00Z"
  }
}
```

### 4.6 `GET /api/report-download-applications/pending`

Query：`page/pageSize`。仅返回当前审批人有权处理的 `pending_review` 申请，列表项字段至少与 4.3 一致。

## 5. 策略审批消息

策略审批原接口不改路径。待审消息必须提供：

```json
{
  "type": "approval",
  "eventCode": "policy.version.submitted",
  "title": "策略版本待审批",
  "action": {
    "type": "open_policy_approval",
    "label": "去审批",
    "policyId": "policy-001",
    "versionId": "version-003"
  }
}
```

审批完成后向申请人创建 `policy.approval.completed` 消息，正文包含结论和意见；并发处理使用状态条件更新，后处理者返回 `409`。

## 6. 公告

### 6.1 `POST /api/system/announcements`

仅管理员调用。请求：

```json
{
  "title": "系统维护公告",
  "content": "本周六 22:00 至 23:00 进行系统维护。",
  "audienceType": "department",
  "audienceIds": ["dept-001", "dept-002"]
}
```

| 字段 | 规则 |
| --- | --- |
| `title` | 必填，最大 50 字符 |
| `content` | 必填，最大 1000 字符 |
| `audienceType` | `all`、`role`、`department` |
| `audienceIds` | `all` 必须空数组；`role/department` 至少一个有效对应 ID |

响应：

```json
{ "code": 0, "message": "公告已发布", "data": { "announcementId": "ann-001", "recipientCount": 18, "publishedAt": "2026-08-30T10:00:00Z" } }
```

后端保存公告并为范围内每位有效用户生成 `system.announcement` 消息。不支持“指定人员”范围；不存在或停用的角色/部门 ID 返回 `400`。

### 6.2 `GET /api/system/announcements/{announcementId}`

仅公告收件人或管理员可读：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "announcementId": "ann-001",
    "title": "系统维护公告",
    "content": "本周六 22:00 至 23:00 进行系统维护。",
    "publisherName": "系统管理员",
    "publishedAt": "2026-08-30T10:00:00Z"
  }
}
```

### 6.3 角色、部门选项接口

- `GET /api/system/roles/options?status=enabled`：返回 `[{ "roleId": "role-001", "roleName": "审计员" }]`。
- `GET /api/system/departments/options?status=enabled`：返回 `[{ "departmentId": "dept-001", "departmentName": "研发一部" }]`。

两个接口只返回启用项，供公告“指定角色/指定部门”下拉框使用。

## 7. 精确筛选接口

| 页面 | Query | 路由 |
| --- | --- | --- |
| 自主率任务列表 | `taskId` | `/detect/autonomy?taskId={taskId}` |
| 开源风险任务列表 | `taskId` | `/detect/risk?taskId={taskId}` |
| AI 分析任务列表 | `taskId` | `/detect/ai-analysis?taskId={taskId}` |
| 告警中心 | `alertId` | `/system/alerts?alertId={alertId}` |
| 报告列表 | `reportId` | `/reports?reportId={reportId}` |

均为 ID 精确匹配；无数据返回空分页，不返回 `404`。

## 8. 联调顺序与验收

1. 保持旧消息列表、已读接口可用，新增未读总数与标准消息 action。
2. 完成报告下载状态、申请、详情、审批、受控下载和审批消息投递。
3. 完成公告发布、范围展开、公告详情和公告消息。
4. 补齐策略审批结果、任务、告警、报告的自动消息投递与精确筛选。

| 场景 | 验收要点 |
| --- | --- |
| 未读角标 | 新接口返回总数；不存在时旧列表兜底 |
| 报告下载申请 | 参数落库，创建待审批消息，重复待审 `409` |
| 并发报告审批 | 第一人成功，第二人 `409` |
| 报告下载 | 仅申请人、仅批准状态、仅原申请参数可下载 |
| 公告 | 仅管理员，按全体/角色/部门准确分发 |
| 跳转 | 任务、告警、报告均用关联 ID 精确定位 |
