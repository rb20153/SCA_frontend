# SCA 页面读写权限实施 Goal

> Status: Confirmed
>
> Owner: Frontend
>
> Last updated: 2026-08-29

## 0. Executive Summary

### Problem

角色管理已经能保存页面 `permission` 读写对象，但当前登录态仍按旧的字符串数组解析，菜单、路由和业务按钮没有统一读取 `read` / `write`。此前散落的审计员、只读人员角色判断已移除，必须用同一套页面权限规则替代。

### Target Outcome

`/auth/me.permission` 成为唯一的页面访问与写操作前端依据：

- `read:false`：隐藏菜单并禁止页面及关联查看子页访问。
- `read:true, write:false`：保留查询、查看、导出、下载等只读能力，隐藏所有写操作入口，不留布局空白。
- `read:true, write:true`：保留原有页面操作。
- 首页、站内消息、个人设置前端固定为读写可用。

### Business or User Value

同一角色在菜单、直接访问 URL、列表操作列、详情页、弹窗和编辑页面中呈现一致权限，不再依赖硬编码角色名称。

### P0 Outcomes

- [ ] `/auth/me` 新旧权限格式均能被前端稳定解析，且首次登录与刷新不会闪现越权菜单。
- [ ] 29 个业务页面按所属权限键控制 read 与 write；所有写入口逐页隐藏。
- [ ] 提供可由测试人员独立执行的手工验收清单。

## 1. Context and Current State

### Current State

- 后端过渡前可能返回旧格式：`permission: [页面路径，页面路径2]`。
- 目标格式为：`Record<页面路径, { read: boolean; write: boolean }>`。
- 角色管理已使用 16 个可配置页面路径保存 `permission`。
- 现有侧栏只依据字符串路径过滤；路由守卫只恢复登录态，不校验页面 read 权限。
- 各模块仍有独立的创建、编辑、删除、同步、保存、提交和状态变更入口。

### Target State

前端提供集中权限能力，页面组件只声明所属页面路径，再用 `canRead` / `canWrite` 控制现有 Ant Design Vue 按钮、链接、表单操作区和弹窗触发入口。

不新增权限按钮样式或包裹 UI 组件。`write:false` 时使用条件渲染隐藏原有元素，现有工具栏、表格操作列、抽屉和表单自动收拢，不出现禁用态或占位空白。

### Actors and Systems in Scope

- 已登录用户：通过 `/api/auth/me` 获取角色和页面权限。
- 前端认证 Store、权限工具、Vue Router、侧栏布局、29 个业务页面及其共享业务组件。
- 后端：提供 `/auth/me.permission`，并在写接口上完成最终鉴权。

## 2. Scope Boundary

### In Scope

- 新旧 `/auth/me.permission` 格式适配、基础页强制授权、动态子页归属映射。
- 权限加载状态、侧栏 read 过滤、无 read 直达 URL 拦截。
- 逐页 write 入口隐藏，包含顶栏/工具栏、表格操作列、详情操作区、弹窗触发按钮、编辑页面保存/发布入口。
- 纯编辑型子路由的 write 守卫。
- 策略审批的 `admin` / `auditor` 角色例外。
- 类型检查、生产构建和下文手工验收清单。

### Explicitly Out of Scope

- 后端接口级鉴权、数据库迁移和角色配置后台的后端实现。
- 新增权限页面路径、按钮禁用视觉规范或独立权限组件库。
- 通过前端隐藏代替后端安全校验。

### Deferred Work

- 后端不再发送旧字符串数组后，删除旧格式兼容分支。
- 若未来增加操作级权限，另行扩展数据契约；本 Goal 只处理页面级 read/write。

## 3. Constraints, Assumptions, and Dependencies

### Constraints

- Vue 3、TypeScript、Pinia、Vue Router、Ant Design Vue；不引入依赖。
- 一个页面的所有写操作只看其“权限归属键”的 `write`；详情和结果页不向后端索取动态路径权限。
- `write:true` 必须隐含 `read:true`。前端收到非法组合时归一化为读写可用，并保留后端修复问题的定位信息。

### Confirmed Decisions

- 旧 `permission: string[]` 过渡期按数组中每个路径 `{ read:true, write:true }` 解释。
- 未返回的可配置路径按 `{ read:false, write:false }` 解释。
- `/dashboard`、`/system/messages`、`/system/profile` 前端固定 `{ read:true, write:true }`。
- 纯编辑型 `/policies/:policyId/edit`、`/reports/templates/:templateId/edit` 必须具备所属页面 `write:true`；直接访问时跳回所属列表并提示无权编辑。
- 其他查看型详情/结果/追溯子页只要求所属页面 `read:true`。
- 策略版本“审批”仅 `role === 'admin' || role === 'auditor'` 且 `/policies.read === true` 时显示；不依赖 `/policies.write`。
- 导出、下载、查看详情、检索、筛选、分页、目录展开、站内消息标记已读均为 read 操作。

### Dependencies

| Dependency | Owner | Status | Required result |
|---|---|---|---|
| `/api/auth/me` | Backend | Pending | 返回对象形式 `permission`，键和值符合角色权限接口说明。 |
| 角色更新和角色分页 | Backend | Pending | `PUT /api/system/roles/{id}` 与 `records[].permission` 使用相同对象。 |
| 写接口鉴权 | Backend | Pending | 后端拒绝无 write 权限的实际写请求。 |

## 4. System and Module Boundaries

| Boundary | Responsibility | Inputs | Outputs | Failure / degradation |
|---|---|---|---|---|
| `authUser` / Auth Store | 解析并缓存权限，维护加载状态 | `/auth/me` 原始响应 | 标准化 `PagePermissionMap` | 请求失败仅给基础页权限。 |
| Permission utility / composable | 路径归属、基础页规则、canRead/canWrite | 当前用户权限、目标路径 | 布尔权限结果 | 未知路径默认无权。 |
| Router | 等待权限加载、阻止无 read 与编辑型无 write URL | 目标路由 | 允许访问或安全跳转 | 跳到第一个可读页面，通常首页。 |
| AdminLayout | 渲染可读菜单 | `canRead(menuKey)` | 无越权菜单 | 加载中不显示完整菜单。 |
| 页面和业务组件 | 隐藏写入口、只保留 read 入口 | `canWrite(ownerKey)` | 一致的操作界面 | 缺失权限按不可写处理。 |

### Boundary Rules

- 页面组件不得再直接按 `userInfo.role` 判断普通新增、编辑、删除、同步或保存操作。
- 页面组件不得自行解析后端 `permission` 原始数据；只调用集中权限能力。
- 对同一路径的判断必须使用集中归属表，禁止用 `startsWith` 在各组件重复实现。
- 组件隐藏入口不等于后端放行；接口 403 仍沿用全局错误提示。

## 5. Core Contracts

### Data Entities

| Entity | Purpose | Identity | States | Traceability |
|---|---|---|---|---|
| `PagePermission` | 单页面读写能力 | 页面权限键 | read/write | `/auth/me` 与角色记录来源。 |
| `PagePermissionMap` | 当前用户页面权限集合 | 16 个静态键 + 3 个基础规则 | loading / ready / failed | 用户 ID、角色、接口返回时间。 |
| `RoutePermissionOwner` | 路由到权限键映射 | 静态路由模式 | read-only / editor | 路由名称、所属权限键。 |

### Permission Contract

```ts
type PagePermission = { read: boolean; write: boolean }
type PagePermissionMap = Record<PagePermissionKey, PagePermission>
```

| 输入 | 标准化结果 |
|---|---|
| 新对象 `{ "/projects": { read:true, write:false } }` | 使用真实读写值。 |
| 旧数组 `["/projects"]` | `/projects` 标准化为 `{ read:true, write:true }`。 |
| 缺失键 | `{ read:false, write:false }`。 |
| `{ read:false, write:true }` | `{ read:true, write:true }`。 |
| 基础页键 | 强制 `{ read:true, write:true }`。 |

### Route Ownership

| 路由 | 所属权限键 | 访问要求 |
|---|---|---|
| `/projects/:projectId` | `/projects` | read |
| `/detect/autonomy/:taskId/result` | `/detect/autonomy` | read |
| `/detect/risk/:taskId` | `/detect/risk` | read |
| `/policies/:policyId/edit` | `/policies` | write |
| `/policies/:policyId/governance` | `/policies` | read |
| `/policies/:policyId/trace` | `/policies` | read |
| `/reports/templates/:templateId/edit` | `/reports/templates` | write |
| `/knowledge/vulnerabilities/items` | `/knowledge/vulnerabilities` | read |
| `/knowledge/:kbProjectId/versions` | `/knowledge` | read |
| `/knowledge/:kbProjectId/directory` | `/knowledge` | read |

### Access and Safety Rules

- `read:false` 时不展示菜单，直达路由不渲染页面内容。
- `write:false` 时隐藏写按钮、写链接和写入口；不显示禁用样式。
- 查看型详情页允许只读用户访问，但其中的写表单操作区不显示。
- 编辑型子页必须 write；不允许通过手输 URL 绕过列表页中隐藏的编辑入口。
- `admin` 与 `auditor` 的审批例外仅覆盖策略版本“审批”动作。

## 6. Ordered Goals

### Goal 1 - 统一权限基础能力

**Outcome:** Auth Store、权限工具、路由和侧栏对同一份权限数据给出一致结果。
**Depends on:** 后端对象权限契约可联调；旧数组兼容仍保留。
**Blocks:** 所有页面 write 接入。

#### Functional Work

- [ ] 定义可配置路径、基础页路径、动态路由归属和编辑型路由规则。
- [ ] 标准化 `/auth/me.permission` 新旧格式，记录权限加载中、成功、失败状态。
- [ ] 提供 `canRead(path)`、`canWrite(path)`、`getPermissionOwner(route)` 统一能力。
- [ ] 登录成功与刷新恢复登录态均等待权限加载完成。
- [ ] 侧栏按 `canRead` 渲染；空分组不渲染。
- [ ] 路由守卫拦截无 read 路由及无 write 的编辑型路由。

#### Acceptance Criteria

- [ ] 旧数组用户保留当前可见页面与原写能力。
- [ ] 新对象只读用户仅见 read 页面，且不见写入口。
- [ ] 权限加载过程中没有短暂显示全部菜单。
- [ ] 权限请求失败时仅首页、站内消息、个人设置可用。
- [ ] 无权 URL 跳转到第一个可读页面并显示无权提示。

### Goal 2 - 项目与检测模块 write 接入

**Outcome:** 项目、两类检测和 AI 分析所有写入口按所属页面 `write` 隐藏。

#### Functional Work

| 所属页面 | write:false 时隐藏的操作 |
|---|---|
| `/projects` | 新增项目、行编辑、行删除；项目详情更新基本信息/取消修改、添加交付物、交付物删除、更新检测策略/取消修改、添加成员、设为负责人、移除成员、创建检测任务；关联任务编辑、暂停、终止、继续、删除。 |
| `/detect/autonomy` | 创建任务；任务编辑、暂停、终止、继续、删除。 |
| `/detect/risk` | 创建任务；任务编辑、暂停、终止、继续、删除；任何会提交组件处置结果的入口。 |
| `/detect/ai-analysis` | 开始 AI 解析、重新解析、删除解析记录。 |

#### Acceptance Criteria

- [ ] 项目详情对只读用户保留概要、交付物查看/下载、成员查看和任务查看。
- [ ] 检测结果页继续可查看，不显示任务变更入口。
- [ ] 只读用户在项目和检测模块不能通过操作列、抽屉或关联入口启动写请求。

### Goal 3 - 策略与报告模块 write 接入

**Outcome:** 策略、报告和模板以页面权限控制写操作与编辑型路由。

#### Functional Work

| 所属页面 | write:false 时隐藏或拦截的操作 |
|---|---|
| `/policies` | 添加、编辑、删除策略；编辑器进入和提交发布申请；更新策略、导入策略、回滚。保留查看版本、命中追溯、导出。 |
| `/policies` 审批例外 | “审批”仅 admin/auditor 且 read 时显示。 |
| `/reports` | 生成报告、删除报告、提交下载审批申请。保留查看、下载、失败原因。 |
| `/reports/templates` | 新建、编辑、删除、发布、取消发布、模板编辑器保存和所有表单写入。编辑器直达 URL 无 write 时拦截。 |

#### Acceptance Criteria

- [ ] 只读用户可查看策略、版本、追溯和报告，但不能打开策略或模板编辑器。
- [ ] 报告下载保留，下载审批申请按 write 隐藏。
- [ ] 审计员在 `/policies.read:true` 且 `write:false` 时仍可见审批入口，其他写入口不可见。

### Goal 4 - 知识库与系统管理模块 write 接入

**Outcome:** 知识库与系统管理模块写操作完整接入，基础页规则不受影响。

#### Functional Work

| 所属页面 | write:false 时隐藏的操作 |
|---|---|
| `/knowledge` | 添加、编辑、删除开源项目；更新版本、获取更新、上传更新包、恢复版本。目录查看、展开/折叠保持 read。 |
| `/knowledge/coverage` | 当前无已识别写操作，仅验证 read 访问。 |
| `/knowledge/vulnerabilities` | 全库同步、单来源同步、导入离线漏洞包。保留查询、漏洞条目查看、导出。 |
| `/knowledge/quarter-updates` | 当前及新增页面中的新增、编辑、删除、提交、同步操作。 |
| `/system/users` | 新增、编辑、重置密码、删除。 |
| `/system/departments` | 新增、编辑、删除。 |
| `/system/roles` | 新增、修改授权、删除。 |
| `/system/logs` | 当前无写操作；导出保持 read。 |
| `/system/alerts` | 处理告警、提交处理记录。 |
| `/system/messages` | 基础页强制读写；查看、单条/全部标记已读均保留。 |
| `/system/profile` | 基础页强制读写；资料、密码和通知设置保存均保留。 |

#### Acceptance Criteria

- [ ] 只读用户可查看知识库版本和目录，不能发起更新、同步、导入或恢复。
- [ ] 系统管理只读用户不见用户、部门、角色和告警处理写入口。
- [ ] 基础页不受权限对象缺失或失败影响。

### Goal 5 - 手工验收与交付

**Outcome:** 提供可重复执行的权限验证记录，证明菜单、路由和操作入口一致。

#### Golden Path Checks

1. 用全权限对象登录，确认菜单、查看页、编辑页和写操作全部存在。
2. 用项目、策略、知识库均为 `read:true, write:false` 的账号登录，确认查看保留且所有 write 入口隐藏。
3. 用无 read 的账号登录，确认侧栏无入口，输入 URL 被拦截。
4. 用审计员账号和 `/policies.read:true, write:false` 登录，确认只出现策略审批例外。
5. 刷新每个账号的浏览器页面，确认权限在首屏即生效。
6. 临时模拟 `/auth/me` 失败，确认仅基础页可用。

#### Evidence and Deliverables

- [ ] 权限工具、路由映射和逐页 write 条件代码。
- [ ] 类型检查与生产构建结果。
- [ ] 完成下方手工验收清单并记录账号、路径、预期、实际结果和截图链接。

## 7. Non-Functional Acceptance

| Area | Requirement | Evidence | Test Layer |
|---|---|---|---|
| 一致性 | 同一路径在菜单、路由和按钮使用同一权限归属 | 权限工具单元测试与手工清单 | Unit / Manual |
| 安全边界 | 前端不因隐藏而假设接口安全 | 无权限写接口返回 403 的联调记录 | Integration |
| 可靠性 | 权限加载失败不会开放业务页 | 失败模拟截图 | Manual |
| 兼容性 | 新对象与旧数组格式均可登录 | 两类 `/auth/me` fixture | Unit / Integration |
| 可维护性 | 不保留普通角色硬编码按钮判断 | 全仓 role 判断检索结果 | Static check |

## 8. Manual Acceptance Checklist

### A. 全权限账号

- [ ] `/dashboard`、16 个可配置菜单入口、站内消息、个人设置均可见。
- [ ] 项目、检测、策略、报告、知识库、系统管理的新增/编辑/删除/同步等原有写入口可见。
- [ ] `/policies/:policyId/edit` 和 `/reports/templates/:templateId/edit` 可直接打开并保存。

### B. 只读账号

准备权限：`/projects`、`/policies`、`/knowledge/vulnerabilities` 设为 `read:true, write:false`；其余按需配置。

- [ ] 对应侧栏入口可见；项目详情、策略版本/追溯、漏洞条目可查看。
- [ ] 项目列表和详情不显示新增、编辑、删除、交付物添加/删除、成员变更、任务创建和任务状态变更。
- [ ] 策略页不显示添加、编辑、删除、更新、导入、回滚和发布申请；可查看版本、追溯和导出。
- [ ] 漏洞知识库不显示全库同步、单来源同步、导入离线包；查询、导出和条目详情可用。
- [ ] 直接访问策略编辑器、报告模板编辑器被重定向并提示无权编辑。

### C. 无权限账号

- [ ] 对 `read:false` 页面，侧栏及父级空菜单组不显示。
- [ ] 手输列表、详情或结果 URL 被拦截，页面不短暂展示数据。
- [ ] 找不到任何可读业务页面时仍可进入首页、站内消息、个人设置。

### D. 审计员审批例外

准备权限：`role='auditor'`，`/policies={ read:true, write:false }`。

- [ ] 策略版本页面显示“审批”。
- [ ] 添加、编辑、删除、更新、导入、回滚、发布申请仍不显示。
- [ ] 非审计员且非管理员在相同权限下不显示“审批”。

### E. 生命周期与失败场景

- [ ] 首次登录后不刷新页面，侧栏立即按 `/auth/me` 权限变化。
- [ ] 浏览器刷新后，权限加载期间不闪现全部菜单。
- [ ] `/auth/me` 返回旧字符串数组时，数组内页面保留读写能力。
- [ ] `/auth/me` 返回对象时，`write:false` 页面隐藏写入口。
- [ ] `/auth/me` 请求失败时，除三项基础页外均不可访问。

## 9. Risks, Blockers, and Decisions

| Item | Type | Impact | Mitigation / Decision | Status |
|---|---|---|---|---|
| 后端对象权限尚未部署 | Dependency | 无法验证真实只读 | 保留旧数组兼容；对象接口上线后联调 | Open |
| 漏掉嵌套写入口 | Risk | 只读用户仍可操作 | 按 Goal 2-4 表逐项排查工具栏、操作列、抽屉和弹窗 | Managed |
| 仅前端隐藏 | Risk | 可绕过 UI 直接调用接口 | 后端写接口鉴权为发布前置条件 | Open |
| 编辑路由直达 | Risk | 绕过隐藏编辑按钮 | 路由 metadata / 归属表要求 write | Resolved |
| 审批角色例外扩散 | Risk | 角色硬编码重新分散 | 仅集中权限工具暴露审批判断 | Managed |

### Stop or Escalate Conditions

- 后端对象结构与已确认 `permission[path] = { read, write }` 不一致时，停止接入并先更新契约。
- 发现同一写操作同时属于两个页面时，先确定唯一权限归属键再实现。
- 写接口未实现服务端鉴权时，前端可继续改善界面，但不得宣称权限安全已完成。

## 10. Definition of Done

- [ ] `/auth/me` 新旧格式、加载状态和失败降级均已接入。
- [ ] 侧栏、路由守卫、动态归属和编辑型路由规则全部生效。
- [ ] Goal 2 至 Goal 4 的每项 write 操作均由统一 `canWrite` 控制。
- [ ] 普通页面不再存在审计员/只读人员角色硬编码的写按钮判断。
- [ ] 手工验收清单 A-E 均有实际结果记录。
- [ ] 类型检查和生产构建通过。
- [ ] 后端写接口无权调用验证完成，或明确记录为联调阻塞。

## 11. Open Questions at Handoff

无。后端对象权限上线与接口级鉴权为实施依赖，不改变前端方案。

## 12. Change Log

| Date | Change | Reason | Author |
|---|---|---|---|
| 2026-08-29 | 创建逐页 write 权限实施计划 | 补齐原页面清单后的统一实现与验收策略 | Codex |
