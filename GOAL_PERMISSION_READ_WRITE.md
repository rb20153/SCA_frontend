# SCA 页面读写权限规划

> 状态：已确认页面清单，待后端按本文接口契约调整 `/auth/me`
>
> 最后更新：2026-08-29

## 0. 执行摘要

当前前端共有 **29 个业务页面**。其中 16 个为角色可配置的静态页面键，3 个基础页由前端强制放行，10 个为详情或编辑子页面，必须继承所属列表页的权限；后端不需要为带 ID 的动态路径单独配置权限。

目标是将 `/auth/me` 的 `permission` 从当前的路径字符串数组升级为“页面路径 -> read/write”的对象。前端以 `read` 控制侧栏和路由访问，以 `write` 控制所有会改变服务端状态的操作入口。首页、站内消息、个人设置由前端强制授予 `read: true, write: true`。

## 1. 后端接口契约

### 推荐返回结构

```json
{
  "userId": "1001",
  "username": "zhangsan",
  "role": "auditor",
  "permission": {
    "/dashboard": { "read": true, "write": true },
    "/projects": { "read": true, "write": false },
    "/detect/autonomy": { "read": true, "write": true },
    "/detect/risk": { "read": false, "write": false }
  }
}
```

### 规则

| 规则 | 约定 |
|---|---|
| `read` | `true` 时才显示侧栏入口、允许访问路由和关联详情页。`false` 时该页面及其子页不可访问。 |
| `write` | `true` 时显示新增、编辑、删除、提交、同步等会修改服务端数据或任务状态的操作。 |
| write/read 关系 | 不允许 `read: false, write: true`。后端应保证 `write: true` 时 `read: true`。 |
| 未返回页面键 | 按 `{ read: false, write: false }` 处理。 |
| 基础页面 | `/dashboard`、`/system/messages`、`/system/profile` 前端强制双 `true`；后端可返回，但前端不以其值限制访问。 |
| 动态路径 | 后端只配置“权限归属键”；前端将详情、编辑、结果页映射到该键。不要把 `:projectId`、`:taskId`、`:policyId`、`:templateId` 作为权限键下发。 |
| 审批 | 审批入口不由 `write` 单独决定，仅角色为系统管理员（`admin`）或审计员（`auditor`）时可见；页面仍须具备 `read`。 |
| 只读操作 | 查看详情、检索、筛选、分页、展开目录、复制、下载、导出、标记已读均属于 read，不应隐藏。 |

## 2. 后端需配置的 16 个静态页面键

下表是后端角色 `permission` 对象的完整可配置键集合，中文名称供后台角色配置界面展示。

| 序号 | 权限键 | 中文页面名 | 英文页面名 | 特殊规则 |
|---:|---|---|---|---|
| 1 | `/projects` | 项目列表 | Project List | 项目详情继承。 |
| 2 | `/detect/autonomy` | 自主率检测 | Autonomy Detection | 检测结果继承。 |
| 3 | `/detect/risk` | 开源风险检测 | Open Source Risk Detection | 检测结果继承。 |
| 4 | `/detect/ai-analysis` | AI 辅助分析 | AI Assisted Analysis | 无。 |
| 5 | `/policies` | 策略列表 | Policy List | 编辑器、版本与审批、规则命中追溯继承。 |
| 6 | `/reports` | 报告列表 | Report List | 无。 |
| 7 | `/reports/templates` | 报告模板 | Report Templates | 模板编辑页继承。 |
| 8 | `/knowledge` | 知识库管理 | Knowledge Base Management | 版本管理、项目目录继承。 |
| 9 | `/knowledge/coverage` | 覆盖统计 | Coverage Statistics | 无。 |
| 10 | `/knowledge/vulnerabilities` | 漏洞知识库 | Vulnerability Knowledge Base | 漏洞条目继承。 |
| 11 | `/knowledge/quarter-updates` | 季度更新管理 | Quarterly Update Management | 无。 |
| 12 | `/system/users` | 用户列表 | User Management | 无。 |
| 13 | `/system/departments` | 部门管理 | Department Management | 无。 |
| 14 | `/system/roles` | 角色管理 | Role Management | 无。 |
| 15 | `/system/logs` | 日志列表 | Audit Log | 无。 |
| 16 | `/system/alerts` | 告警中心 | Alert Center | 无。 |

`/dashboard`、`/system/messages`、`/system/profile` 不出现在角色授权表中，前端固定按 `read: true, write: true` 处理。

## 3. 全部 29 个业务页面及权限归属

| 序号 | 前端路由 | 中文页面名 | 英文页面名 | 权限归属键 | 是否后端单独配置 |
|---:|---|---|---|---|---|
| 1 | `/dashboard` | 首页仪表盘 | Dashboard | `/dashboard` | 是，前端强制放行 |
| 2 | `/projects` | 项目列表 | Project List | `/projects` | 是 |
| 3 | `/projects/:projectId` | 项目详情 | Project Detail | `/projects` | 否，继承 |
| 4 | `/detect/autonomy` | 自主率检测 | Autonomy Detection | `/detect/autonomy` | 是 |
| 5 | `/detect/risk` | 开源风险检测 | Open Source Risk Detection | `/detect/risk` | 是 |
| 6 | `/detect/autonomy/:taskId/result` | 自主率检测结果 | Autonomy Detection Result | `/detect/autonomy` | 否，继承 |
| 7 | `/detect/risk/:taskId` | 开源风险检测结果 | Open Source Risk Detection Result | `/detect/risk` | 否，继承 |
| 8 | `/detect/ai-analysis` | AI 辅助分析 | AI Assisted Analysis | `/detect/ai-analysis` | 是 |
| 9 | `/policies` | 策略列表 | Policy List | `/policies` | 是 |
| 10 | `/policies/:policyId/edit` | 策略编辑器 | Policy Editor | `/policies` | 否，继承 |
| 11 | `/policies/:policyId/governance` | 版本与审批 | Policy Version and Approval | `/policies` | 否，继承 |
| 12 | `/policies/:policyId/trace` | 规则命中追溯 | Rule Hit Traceability | `/policies` | 否，继承 |
| 13 | `/reports` | 报告列表 | Report List | `/reports` | 是 |
| 14 | `/reports/templates` | 报告模板 | Report Templates | `/reports/templates` | 是 |
| 15 | `/reports/templates/:templateId/edit` | 报告模板编辑 | Report Template Editor | `/reports/templates` | 否，继承 |
| 16 | `/knowledge` | 知识库管理 | Knowledge Base Management | `/knowledge` | 是 |
| 17 | `/knowledge/coverage` | 覆盖统计 | Coverage Statistics | `/knowledge/coverage` | 是 |
| 18 | `/knowledge/vulnerabilities` | 漏洞知识库 | Vulnerability Knowledge Base | `/knowledge/vulnerabilities` | 是 |
| 19 | `/knowledge/vulnerabilities/items` | 漏洞条目 | Vulnerability Items | `/knowledge/vulnerabilities` | 否，继承 |
| 20 | `/knowledge/quarter-updates` | 季度更新管理 | Quarterly Update Management | `/knowledge/quarter-updates` | 是 |
| 21 | `/knowledge/:kbProjectId/versions` | 知识库项目版本管理 | Knowledge Base Version Management | `/knowledge` | 否，继承 |
| 22 | `/knowledge/:kbProjectId/directory` | 知识库项目目录 | Knowledge Base Project Directory | `/knowledge` | 否，继承 |
| 23 | `/system/users` | 用户列表 | User Management | `/system/users` | 是 |
| 24 | `/system/roles` | 角色管理 | Role Management | `/system/roles` | 是 |
| 25 | `/system/departments` | 部门管理 | Department Management | `/system/departments` | 是 |
| 26 | `/system/logs` | 日志列表 | Audit Log | `/system/logs` | 是 |
| 27 | `/system/alerts` | 告警中心 | Alert Center | `/system/alerts` | 是 |
| 28 | `/system/messages` | 站内消息 | Site Messages | `/system/messages` | 是，前端强制放行 |
| 29 | `/system/profile` | 个人设置 | Personal Settings | `/system/profile` | 是，前端强制放行 |

不计入业务页面的路由：`/login`，以及兼容重定向 `/detect/tasks`、`/detect/tasks/:taskId/result`、`/detect/tasks/:taskId/risk`。

## 4. 页面操作与 read/write 矩阵

“隐藏的 write 操作”包含工具栏按钮、表格操作列链接、抽屉或弹窗中的提交按钮，不能只隐藏页面顶部按钮。

| 权限归属键 | read 时保留的操作 | write 为 false 时必须隐藏或禁用的操作 |
|---|---|---|
| `/dashboard` | 查看统计、进入关联页面 | 无，基础页强制 write。 |
| `/projects` | 查询、筛选、查看项目详情、查看/下载交付物、查看任务 | 新增项目、编辑项目、删除项目；详情中的更新基本信息/取消修改、添加/删除交付物、更新检测策略/取消修改、添加成员、设为负责人、移除成员、创建检测任务；关联任务的编辑、暂停、终止、继续、删除。 |
| `/detect/autonomy` | 查询、筛选、查看检测结果 | 创建检测任务；任务编辑、暂停、终止、继续、删除。 |
| `/detect/risk` | 查询、筛选、查看检测结果、查看组件和依赖关系 | 创建检测任务；任务编辑、暂停、终止、继续、删除。 |
| `/detect/ai-analysis` | 查询、查看解析结果、复制、下载结果 | 开始 AI 解析、重新解析、删除解析记录。 |
| `/policies` | 查询、查看策略、查看版本与审批、查看规则命中追溯、导出策略 | 添加策略、编辑策略、删除策略；策略编辑器中的内容编辑和提交发布申请；版本页的更新策略、导入策略、回滚。审批另见本章末尾特殊规则。 |
| `/reports` | 查询、查看报告详情、下载报告、查看失败原因 | 生成检测报告、删除报告、提交下载审批申请。 |
| `/reports/templates` | 查询、查看模板内容、查看导出配置 | 新建模板、编辑模板、删除模板、发布、取消发布；编辑页中的内容/配置编辑和保存模板。 |
| `/knowledge` | 查询、筛选、查看项目、查看版本和目录、展开/折叠目录 | 添加开源项目、编辑开源项目、删除开源项目；版本管理中的更新版本、获取更新、上传更新包、恢复版本。 |
| `/knowledge/coverage` | 查看覆盖统计、趋势、待补全项目 | 无已识别写操作。 |
| `/knowledge/vulnerabilities` | 查询、筛选、查看来源和漏洞条目、导出 | 全库同步、单来源同步、导入离线漏洞包。 |
| `/knowledge/quarter-updates` | 查询、查看季度更新记录 | 按实际页面存在的新增、编辑、删除、提交、同步操作统一作为 write 接入。 |
| `/system/users` | 查询、筛选、查看用户 | 新增用户、编辑用户、重置密码、删除用户。 |
| `/system/departments` | 查询、查看部门 | 新增部门、编辑部门、删除部门。 |
| `/system/roles` | 查询、查看角色和权限树 | 新增角色、编辑角色权限、删除角色。 |
| `/system/logs` | 查询、筛选、查看日志详情、导出日志 | 无已识别写操作。 |
| `/system/alerts` | 查询、筛选、查看告警详情 | 处理告警、提交处理记录。 |
| `/system/messages` | 查看、筛选、跳转关联页、单条/全部标记已读 | 无，基础页强制 write；标记已读按 read 保留。 |
| `/system/profile` | 查看个人资料、账号信息和通知设置 | 无，基础页强制 write；更新基本资料、修改密码、保存通知设置均保留。 |

### 审批特殊规则

- 策略版本“审批”仅 `role === "admin"`（系统管理员）或 `role === "auditor"`（审计员）显示。
- 审批按钮同时要求当前页面 `/policies` 具备 `read: true`；不以一般 `write` 权限为前置条件。
- “提交发布申请”是业务写操作，仍只要求 `/policies.write === true`。
- 报告下载审批申请是写操作，`/reports.write === false` 时不可提交；报告下载本身保持 read。

## 5. 前端实施范围与边界

### 本阶段先实现

1. 将前端权限类型从 `string[]` 适配为 `Record<PagePermissionKey, { read: boolean; write: boolean }>`。
2. 增加一个集中式权限解析函数/组合式能力，负责基础页强制放行、动态路由归属映射、非法 `write && !read` 降级处理。
3. 登录成功和刷新恢复登录态时，先完成 `/auth/me` 权限加载；加载中不渲染可点击的完整侧栏和业务路由内容，显示既有页面加载状态。
4. 侧栏仅显示 `read: true` 的页面；没有任何可读子项的分组隐藏。
5. 增加全局路由守卫：直接输入或收藏访问无 read 权限的 URL 时，跳转至第一个可读页面（通常为 `/dashboard`），并提示“无权访问该页面”。
6. `/auth/me` 权限请求失败时采用保守降级：仅开放首页、站内消息、个人设置；不得短暂显示其余菜单。

### 本阶段不实现

- 不逐页改造具体新增、编辑、删除、同步等按钮的 `write` 显隐；本文件第 4 章是后续逐页接入清单。
- 不改造后端鉴权。后端仍须对所有写接口和无权读取接口做最终权限校验，前端隐藏不构成安全边界。
- 不新增动态 URL 权限键，不将权限规则硬编码为角色白名单（审批例外除外）。

## 6. 有序 Goals

### Goal 1 - 权限契约与页面归属落地

**结果：** `/auth/me` 返回的页面权限能被前端稳定解析，并覆盖 16 个可配置键、3 个基础页规则与 10 个动态子页映射。

- [ ] 后端按第 2 章键集合返回对象形式 `permission`。
- [ ] 前端定义页面权限类型、基础页规则和动态路由归属表。
- [ ] 对缺失键、未知键和 `write:true/read:false` 返回做确定性降级处理。

**验收：** 给定同一份权限数据，菜单显示、路由许可和详情页权限归属结果一致。

### Goal 2 - 权限加载与无权路由保护

**结果：** 登录、刷新和手工输入 URL 时都不会暴露无 read 权限的页面。

- [ ] 登录后等待 `/auth/me` 返回权限再展示可访问菜单。
- [ ] 刷新恢复 token 后，权限加载中展示加载状态而非完整菜单。
- [ ] 无 read 权限直达 URL 跳至第一个可读页面并提示原因。
- [ ] 权限请求失败仅保留三项基础页，并提供刷新后重试的恢复路径。

**验收：** 首次登录、刷新、空权限和权限请求失败四种场景均不出现越权菜单或业务内容闪现。

### Goal 3 - 分页 write 操作接入

**结果：** 第 4 章所列 write 入口在只读用户界面全部隐藏或禁用，read 操作保持可用。

- [ ] 先接入项目、检测、策略、报告四个高频模块。
- [ ] 再接入知识库和系统管理模块。
- [ ] 审批按 `admin` / `auditor` 角色例外规则接入。

**验收：** 只读用户在任一已授权页面无法从工具栏、表格操作列、抽屉或弹窗触发写请求；拥有 write 的用户不受影响。

## 7. 验证与完成定义

| 场景 | 预期证据 |
|---|---|
| 全权限用户 | 16 个可配置入口及 3 个基础页可见；全部 29 个业务路由可按归属访问；写操作显示。 |
| 只读用户 | 已授权菜单和详情可访问；第 4 章所有 write 操作均不显示；导出、下载、查看仍可用。 |
| 无权限用户 | 无对应侧栏入口；手工访问对应页面被拦截并跳转。 |
| 审计员 | 策略审批可见；其他页面仍以 read/write 控制。 |
| 权限加载中和失败 | 无完整菜单闪现；失败时只可进入三项基础页。 |
| 刷新与首次登录 | `/auth/me` 返回后即刻应用权限，无需手工刷新。 |

完成条件：后端确认第 2 章 16 个键可配置并按第 1 章返回；前端完成 Goal 1、Goal 2；Goal 3 逐页改造前以本文件第 4 章作为唯一清单，并通过类型检查、生产构建和浏览器权限矩阵验证。

## 8. 风险与待联调事项

| 项目 | 影响 | 处理方式 |
|---|---|---|
| 后端只返回字符串数组 | 不能表达只读页面 | 必须改为第 1 章对象结构后再实施 write 控制。 |
| 后端遗漏静态权限键 | 用户可能无法访问应有页面 | 前端按无权限处理；后端以第 2 章清单校验角色配置。 |
| 仅前端隐藏按钮 | 用户仍可能通过接口直接写入 | 后端必须做接口级权限校验。 |
| 审批角色编码变更 | 审批按钮可能误隐藏或误显示 | 联调时确认仍使用 `admin`、`auditor`；变更时统一更新角色映射。 |
| 旧缓存用户信息 | 刷新前可能含旧的字符串数组权限 | 发布时清理或兼容迁移旧缓存，且以最新 `/auth/me` 为准。 |
