# SCA 前端 · 工程师日志

> 记录每次改动的内容摘要、实现思路和注意事项，供开发者快速了解当前代码状态。
> 按时间倒序，最新的在最上方。

---

---

## [2026-07-27] 漏洞库版本下拉空白 + 后端 type 取值 combined

### 漏洞库版本下拉「No data」

后端 `GET /api/detect/tasks/risk/vuln-db-versions` 返回的 `version` 和 `label` **都是空串**，能用的值在 `id` / `name` 里：

```json
{ "id": "nvd-2026.06", "name": "NVD 2026.06", "status": "ready", "version": "", "label": "" }
```

原来的适配用 `item.version ?? item.value ?? ''`，`??` 只挡 `null`/`undefined`，空串照样通过，然后被「version 为空就丢弃」的过滤全部剔掉，所以下拉是空的。**不是请求时机问题**（弹窗打开时拉取是对的）。

改动：`detectAdapter.ts` 增加 `firstNonEmpty()`，漏洞库版本按 `version → value → id` 取第一个非空值，label 按 `label → name → version`；项目下拉同样处理。现在会渲染成 `NVD 2026.06` / `离线漏洞知识库`，提交给后端的 `vulnDbVersion` 是 `nvd-2026.06` 这种 id。

> 如果后端期望收到的是别的值（比如真正的版本号 `2026.06`），需要让后端把 `version` 字段填上，前端会自动优先用它。

### 任务列表 type 返回 `combined`

后端任务对象没有 `taskType`，只有 `type`，且出现了 openapi 里没定义的取值 `combined`（自主率+风险一起跑）。前端处理：识别不出的类型按当前列表页的类型兜底，所以 `combined` 任务在自主率页和开源风险页都会出现；只有明确是另一类（如 `type: "autonomy"`）的行才会在风险页被过滤掉。

其他字段差异（已在适配层兼容）：`name`（无 `taskName`）、`status: "completed"`、`scanMode: "full"`、分页体同时有 `records` 和 `list`。

---

## [2026-07-27] 开源风险列表混入自主率任务的兜底处理

### 原因

后端 `GET /api/detect/tasks` 目前对 `taskType` 查询条件不可靠：要么忽略该条件把自主率任务一起返回，要么任务对象里干脆不带 `taskType`。而前端原来的 `normalizeDetectTask` 在拿不到类型时**固定回退成 `autonomy`**，于是 `/detect/risk` 页面出现两个症状：

- 「来源」列全部显示成自主率的扫描模式（全量扫描等）
- 点「查看结果」跳到自主率结果页，而不是开源风险详情页

后端只有 `GET /api/detect/tasks` 这一个列表接口（`openapi.yaml` 里没有 `/api/detect/risk/tasks`），两个列表页靠 `taskType` 区分，所以修在前端。

### 改动

- `detectAdapter.normalizeDetectTask(raw, fallbackTaskType)`：明确识别 `autonomy` / `open-source-risk`（含 `risk`、`opensource` 别名），识别不出来时用调用方传的类型兜底，而不是一律当自主率
- `detectAdapter.normalizeDetectTaskPage(raw, expectedTaskType)`：传了期望类型时，剔除类型对不上的行，`total` 按本页剔除数量同步减掉
- `api/detect.ts` → `getTaskList()`：把 `params.taskType` 传给上面两个函数

后端把 `taskType` 过滤修好后，这个过滤自然就不会命中任何行，不需要回头删代码。

### 注意

- 只对 `taskType` 做了这种保护，**状态筛选没做**：类型是页面级不变量（错了会导致跳错结果页），而状态是用户主动选的条件，过滤掉反而会掩盖后端问题。后端状态筛选的异常已记在 `problem.md` #3
- 因为 `total` 用的是后端返回值减本页剔除数，后端修好之前分页总数可能偏大，翻到后面可能出现空页

---

## [2026-07-27] 自主率检测页 API 联调（检测任务 9 接口）

### 改了什么

`src/api/detect.ts` 中检测任务相关函数全部切 `request.*`，mock import 已移除：

| 函数 | 接口 | 说明 |
|---|---|---|
| `getTaskList` | `GET /api/detect/tasks` | 自主率/开源风险列表共用，空筛选值不下发 |
| `getTaskDetail` | `GET /api/detect/tasks/:taskId` | 详情兜底 + 动作回查 |
| `getDetectTaskProjectOptions` | `GET /api/detect/tasks/project-options` | 创建弹窗关联项目下拉 |
| `getRiskDetectVulnDbVersions` | `GET /api/detect/tasks/risk/vuln-db-versions` | 风险创建弹窗漏洞库版本 |
| `createDetectTask` | `POST /api/detect/tasks` | **multipart**（openapi 只定义了 multipart） |
| `updateDetectTask` | `PUT /api/detect/tasks/:taskId` | 编辑弹窗 |
| `deleteTask` | `DELETE /api/detect/tasks/:taskId` | body 带 `{ taskId }` |
| `pauseTask` / `resumeTask` | `POST .../pause`·`/resume` | body 带 `{ taskId }` |
| `terminateTask` | `POST .../terminate` | body 带 `{ reason }` |

新增 `src/utils/detectAdapter.ts`：任务字段规范化（`completed→success`、`scanMode/dataSource→sourceMode`、`id/name` 别名、耗时由 createdAt/updatedAt 兜底）、分页规范化、项目/漏洞库下拉规范化、query 空值剔除。原 `dashboardAdapter.normalizeRecentDetectTask` 迁到这里，`dashboardAdapter` / `projectAdapter` 改为复用，避免三处各写一份映射。

`buildCreateDetectTaskFormData` 从「只支持 import-sbom」扩展为自主率 + 开源风险统一构建，`isImportSbomDetectTask` 随之删除。

### 怎么验证

1. `/detect/autonomy` 列表加载、任务名称/项目/状态筛选、翻页
2. 创建任务三步向导：项目下拉应来自后端；提交后列表回到第 1 页刷新
3. 行内操作：编辑 / 暂停 / 继续 / 终止（填原因）/ 删除
4. `/detect/risk` 列表与创建同样已切真实接口（共用一套接口）

### 注意

- **multipart 必须显式带 `Content-Type: multipart/form-data`**：`request.ts` 默认头是 `application/json`，axios 会把 FormData 序列化成 JSON，所以 `createDetectTask` 用 `MULTIPART_CONFIG` 覆盖。`project.ts` 的两个上传函数暂未加，联调上传时若报错先补这个头
- 自主率创建向导额外传了 `executionMode` / `workerCount` / `autoRetryEnabled` / `retryCount`，openapi 未定义这几个字段，后端若忽略属预期；需要落库要让后端补
- 暂停/继续/终止的响应体后端可能只回片段（openapi 里 terminate 的 data 写的是 `{ reason }`），api 层用 `resolveTaskActionResult` 判断：没带 `taskId` 就回查一次详情，保证列表行状态能刷新
- 检测结果页、开源风险详情页等仍是 mock，但已去掉「任务不存在」的 `findMockTask` 校验——列表现在返回真实 taskId，再校验会整页报错；mock 生成器本身按 taskId 派生数据，任意 ID 都能出数
- 列表运行中任务目前没有轮询，进度要手动刷新

---

## [2026-07-27] 项目详情 API 联调启动 + 列表 5 接口标已对接

### 列表页（已对接）

- `getProjectList` / `updateProject` / `deleteProject` / `getPolicySelectOptions` / `searchUsers` → **已对接**

### 详情页（联调中）

`project.ts` 以下函数已切真实 API，mock import 已移除：

| 函数 | 接口 |
|---|---|
| `getProjectDetail` | `GET /api/projects/:id` |
| `updateProjectBasicInfo` | `PUT /api/projects/:id/basic-info` |
| `getProjectRelatedTasks` | `GET /api/projects/:id/tasks` |
| `getProjectMemberList` 等成员 5 个 | `/members` / `/member-candidates` / `/transfer-owner` |
| 交付物 5 个 | `/deliverables` 及 upload/download |
| 策略绑定 2 个 | `/policy-binding` |

适配层：`projectAdapter` 新增 member/deliverable/policy/task 规范化；策略绑定复用 `policyAdapter` 字段映射。

### 怎么验证

1. 列表页：查询/编辑/删除/策略下拉/搜用户（应已正常）
2. 点进项目详情 → 刷新 URL 应能 `getProjectDetail` 兜底
3. 逐 Tab：基本信息、交付物、策略、成员、关联任务

### 注意

- `basic-info` 提交 status 用**英文枚举**（详情接口返回的也是英文，中文仅用于列表 query）
- `basic-info` 同时提交 `owner` / `department` **名称** + ID：后端 `ownerUserId` 实际存的是用户名、`departmentId` 被写成 projectId，只传 ID 不会持久化
- 详情页项目名称：`taskCount === 0` 时可编辑，有关联任务时只读并提示
- 关联任务二次校验去掉 `projectName` 比对（后端任务项不返回该字段，否则整列表被过滤为空）
- 部门下拉 `getEnabledDepartmentOptions` 此前已切真实 API（与列表页共用）
- 更新基本信息后过滤后端误写的 `departmentId=projectId`；策略 Tab 空状态居中，policy-binding 空时从项目详情 `policy` 兜底
- 需要后端修的问题记在**仓库上层目录 `problem.md`**（目前 2 条：basic-info 改状态/负责人/部门不落库、新建项目选的策略未落库），含对应的前端兼容代码位置，后端修完可按表移除兼容逻辑
- `problem.md` 只在**我明确要求时**才追加条目（规则见 `.cursor/skills/record-problem/SKILL.md`）；其余联调中发现的后端异常（成功码 0/200 混用、分页字段重复、dashboard 字段名不符等）只在本文件「注意」里留痕 + 前端做兼容

---

## [2026-07-27] 编辑项目弹窗负责人/部门回填

### 原因

- 部门回填错误地走了 `prefetchOptions()`（调部门接口按 label 匹配），而编辑应**直接用列表行数据**
- `destroy-on-close` 下 `departmentSelectRef` 未挂载时 `seedOption` 被跳过
- 后端可能只返回 `department` / `departmentName`，无 `departmentId`

### 改动

- `ProjectList` 直接把列表行 `Project` 对象传给 `ProjectFormModal`
- `applyDepartmentFromList`：`seedOption({ value, label })` 来自列表，不请求接口
- `waitForSelectorRefs` 等待下拉组件挂载后再 seed
- `projectAdapter.readProjectDepartmentFields` 兼容 `departmentName` / `deptId` / 嵌套对象

### 验证

列表点「编辑」→ 所属部门应显示与列表一致的部门名称（即使未展开下拉）。

---

## [2026-07-27] 策略默认参数字段映射修复

### 原因

`GET /api/policies/:id/detect-params` 返回字段与前端表单不一致，导致「排除目录」「最小匹配长度」不回填：

| 后端实际 | 前端表单 |
|---|---|
| `excludeDirs` | `excludeDirectories` |
| `minMatchLines` | `minMatchLength` |
| `similarityThreshold: 0.85` | 0–100 整数（85） |

### 改动

`policyAdapter.ts` 的 `normalizePolicyDetectParams` 增加别名解析与相似度 0–1→0–100 换算。

### 验证

新建项目选策略 → 排除目录应出现 `node_modules` 等，最小匹配长度应为 10，相似度应为 85。

---

## [2026-07-27] 项目列表 6 接口联调

### 改了什么

- `src/api/project.ts`：`getProjectList` / `createProject` / `updateProject` / `deleteProject` 切 `request.*`（详情/成员等仍 mock）
- `src/api/policy.ts`：`getPolicySelectOptions` 切真实 API
- `src/api/user.ts`：`searchUsers` 切真实 API
- 新增适配层：`pageResultAdapter` / `projectAdapter` / `policyAdapter` / `userAdapter`

### 怎么验证

1. `/projects` 列表加载、筛选、分页
2. 新增项目三步向导（策略下拉、负责人搜索）
3. 编辑项目、删除项目（输入名称确认）

### 注意

- 删除项目 DELETE 带 body `{ projectId }`（与 openapi 一致）
- 创建项目若含文件类交付物，需确认后端是否接受 JSON 或需 multipart
- 项目详情页仍 mock，从列表点进详情刷新可能数据不一致

---

## [2026-07-27] 首页 dashboard 后端字段适配

### 原因

后端返回结构与前端 mock/openapi 不一致，导致图表空白、任务列显示「—」：

| 接口 | 后端实际 | 前端期望 |
|---|---|---|
| autonomy-trend | `points` 为**单个对象**（含 overallRate） | `points` 为 `{ date, avgRate }[]` |
| vulnerability-distribution | items 含 `name/value` | `level/count` 数组 |
| recent-tasks | `status: completed`、`scanMode: full` | `status: success`、`sourceMode: full-scan` |

### 改动

- 新增 `src/utils/dashboardAdapter.ts`，在 `dashboard.ts` 各函数返回前做 normalize
- 趋势：对象转单点数组，空 date 补当天，avgRate 取 overallRate 等字段
- 漏洞：兼容 HIGH/high、value/count，补齐三档
- 任务：`completed`→`success`，`scanMode`→`sourceMode`，elapsed 可由 updatedAt-createdAt 推算

### 注意

- 若趋势图只有 1 个点，是后端尚未返回 30 天序列，需后端补全 points 数组
- 耗时仍为「—」时，检查后端 `elapsedMs` 或 createdAt/updatedAt 是否合理

---

## [2026-07-27] /me 刷新姓名对齐 + 首页 dashboard 联调

### 改了什么

- **`src/utils/authUser.ts`**（新）：`normalizeMeUser` 剥离 JWT 字段，优先 `displayName` 作 `realName`；`mergeUserInfoWithCache` 在 /me 把 realName 填成 username 时用登录缓存兜底
- **`src/api/auth.ts`**：`getCurrentUser` 返回前走 `normalizeMeUser`
- **`src/stores/auth.ts`**：`setUserInfo` 规范化并写入 storage；`fetchUserInfo` 合并缓存
- **`src/utils/tokenStorage.ts`**：新增 `sca_user_info` 与 token 同介质缓存
- **`src/api/dashboard.ts`**：4 个函数切 `request.get`（overview / recent-tasks / autonomy-trend / vulnerability-distribution）

### 怎么验证

1. admin 登录 → 顶栏应显示 **Contract User**
2. F5 刷新 → 仍显示 **Contract User**（不再变成 admin）
3. 进 `/dashboard` → 4 张统计卡、趋势图、环图、最近任务应拉真实数据（需已登录）

---

## [2026-07-27] auth 联调实测（admin 账号）

### 实测结果（`http://8.130.55.127/api`）

| 接口 | code | 结论 |
|---|---|---|
| `POST /auth/login` | **0** | 通过，返回 `data.token` + `data.userInfo` |
| `GET /auth/me` | **0** | 通过，Bearer token 可恢复用户信息 |
| `GET /auth/check-username` | **200** | 仍用旧码，拦截器已通过 `isApiSuccessCode` 临时兼容 |

### 注意事项

- 登录页用 `admin` / 上述密码应能正常进 dashboard；刷新后顶栏用户信息由 `/auth/me` 恢复
- 请后端把 `check-username` 也改成 `code:0`，改完后可删 `API_LEGACY_SUCCESS_CODE` 兼容

---

## [2026-07-27] 拦截器对齐后端业务码：成功 code=0

### 改了什么

- `src/types/common.ts`：新增 `API_SUCCESS_CODE = 0`
- `src/utils/request.ts`：成功判定由 `code === 200` 改为 `code === 0`；HTTP 2xx 但 `code !== 0` 全局弹错并 reject；HTTP 401 或 body `code === 401` 统一走未授权处理（登录页只提示，其他页清 token 跳登录）
- `.cursor/rules/api-layer.mdc`：文档示例同步为 `code: 0`

### 为什么这么做

后端约定成功业务码为 `0`，失败可能是 `401` 等（有时 HTTP 状态也是 401，如登录密码错误）。

### 注意事项

- **mock 数据仍是 `code: 200`**：mock 走 `Promise.resolve`，不经过 axios 拦截器，未改动的模块不受影响
- 已切真实接口的 auth 等模块，后端必须返回 `code: 0` 才算成功；若个别接口仍返回 `200`，会被拦截器当失败处理，需后端统一
- curl 实测 `check-username` 曾返回 `code: 200`，若联调仍报错请让后端确认是否已全部切到 `0`

---

## [2026-07-27] 联调启动：接入真实后端（auth 4 接口先行）

### 改了什么

- `.env.development` / `.env.production`：`VITE_API_BASE_URL` 由 `/api` 改为**空**——api 函数内路径已带 `/api` 前缀，原配置会拼成 `/api/api/xxx`
- `vite.config.ts`：`/api` 代理目标由 `localhost:8080` 改为后端服务器 `http://8.130.55.127`，浏览器只访问同源 5173，规避 CORS
- `src/utils/request.ts`：① 导出类型收窄为 `RequestMethods`（get/post/put/delete 直接返回 `Promise<T>`），后续切接口按 TODO 注释原样写 `return request.get(...)` 即可通过 TS 检查；② 401 处理适配：登录页上的 401 是"密码错误"，展示后端 message 且不跳转；其他页面 401 才清 token 跳登录
- `src/api/auth.ts`：`login` / `getCurrentUser` / `checkUsernameAvailable` / `register` 4 个函数删除 mock import，切换为真实 `request.*` 调用

### 为什么这么做

后端已按 `openapi.yaml` 完成全部接口并部署在 `http://8.130.55.127/api`，联调从 auth 开始（所有接口都依赖 Bearer token）。

### 怎么实现的

- curl 实测验证：`check-username` 返回 `{code:200, message, data:{available, exists}, success, traceId, timestamp}`——比约定多了 `success/traceId/timestamp` 附加字段，拦截器只看 `code`，不受影响
- 登录失败后端返回 **HTTP 401**（而非 HTTP 200 + 业务码 401），无 token 访问 `/api/auth/me` 同样 HTTP 401，因此拦截器按"是否在登录页"区分两种 401 场景

### 注意事项 / 已知限制

- auth 4 接口状态为「联调中」：代码已切换，**登录页需要真实账号自测通过后**在 `API.md` 改「已对接」
- `src/mock/modules/auth/users.ts` 暂不能删：`api/user.ts` 与 system 模块 mock 仍引用它
- 其余 11 个 api 模块仍为 mock，按 API.md 清单分批切换；切换写法与 auth 相同（照抄函数内 TODO 注释）
- 存量 `vue-tsc` 报错约 879 行（a-table 泛型、form rules 类型等），与本次改动无关，本次新改文件 0 报错

---

## [2026-06-30] API_detail → OpenAPI 3.0.3（Apifox 导入）

### 改了什么

- 新增 `scripts/openapi/` 解析器 + schema 构建器 + `scripts/generate_openapi.py`
- 从 `API_detail.md` 生成根目录 **`openapi.yaml`**（OpenAPI 3.0.3，166 operations）及 **`openapi_generation_report.md`**
- 统一 ApiResponse 包装（code/message/data）、bearerAuth、PageResult_*、multipart binary、downloadUrl 响应、nullable null

### 怎么用

```bash
pip install pyyaml
python scripts/generate_openapi.py
```

Apifox：**项目设置 → 导入 → OpenAPI** → 选择仓库根目录 `openapi.yaml`。环境 baseURL 在 Apifox 中配置（servers 默认为 `/`）。

`API_detail.md` 更新后重新运行上述命令即可同步。

### 注意事项

- 免登录 4 条：login / check-username / register / departments/options（见报告 §7）
- 报告 §3 列出仅靠 JSON 示例推断、无 response 字段表的接口（多为 `data: null` 删除类）
- 与 `python -m scripts.api_detail.generate` 独立；建议先更新 API_detail 再生成 OpenAPI

---

## [2026-06-30] API_detail 空响应 `{}` 补全与动作返回约定

### 改了什么

- **新建 `scripts/api_detail/response_specs.py`**：为 §6 policy、§7 report、§8 reportTemplate、§9 system、§11 profile 共 45 个接口补全 `response_example` + 完整 `response_table`；§5 knowledge / §10 user 补全字段表
- **统一动作返回约定**（写入 `common.py` §0）：状态变更→资源对象；纯动作→`null`；导出→`downloadUrl+fileName`；异步→`taskId/parseTaskId/versionId`
- **Request 修正**：无 query/body 的 GET/DELETE 文档写「无」，不再写 `{}`
- **`check_api_detail.py` 扩展**：禁止 Response `data: {}`、字段表「见 types/xxx.ts」占位、无参 GET/DELETE 的 `{}` request

### 怎么用

```bash
python -m scripts.api_detail.generate
python scripts/check_api_detail.py   # 165 函数 + 契约三态校验
```

### 注意事项

- 后端按 `frontend/src/types/*.ts` 与 `API_detail.md` 实现即可，本次为文档与生成器补全，未改前端 API 函数签名
- `query_specs.py` 管 Request/部分 Response；`response_specs.py` 管 Response 示例与字段表，两者均在生成后 merge

---

## [2026-06-30] 字段缺失补全与高中风险契约修复

### 改了什么

- **API_detail 生成器**：补全 §3.8/§4.18/§4.27/§4.28/§4.30/§5.27/§7.5 Response 字段；§4.1 增加 startTime/endTime；§4.4 import-sbom multipart 说明；part1 userId 示例统一为 `user-00x`
- **query_specs.py**：新增 `5.27`（VulnRiskSummary）、`7.5`（ReportDownloadStatus 含 rejected）；完善 `5.4` tags 语义、`9.9`/`10.10` notes
- **multipart 联调准备**：新建 `frontend/src/utils/formDataBuilders.ts`；`knowledge`/`policy`/`project`/`detect` 共 8 个 API 函数在 mock 阶段构建 FormData（TODO 注释保留真实 request）
- **types**：`CreateAiParseTaskParams.packageFile`；`AiParseStartModal` 提交时传入文件
- **删除死代码**：`getEnabledUserOptions`、`loadEnabledUserSelectOptions`（无页面引用）；`check_api_detail.py` 165 函数 1:1 对齐
- **中风险 UI**：`ReportList` 增加 `approvalState === 'rejected'` 重新提交分支；`ReportGenerateModal` 仅展示 `published` 模板；`getRecentTasks(limit)` mock 使用 limit；auth mock userId 对齐 `user-002` 系列；`report-004` mock 演示驳回态

### 怎么用

- 联调 multipart：api 层已有 `buildXxxFormData()`，切换真实接口时将 `void formData` 改为 `return request.post(..., formData)`
- 报告下载驳回演示：列表中 `report-004` 点击下载会走 rejected 分支
- 重新生成契约：`python -m scripts.api_detail.generate` → `python scripts/check_api_detail.py`

### 注意事项

- mock 阶段仍 `Promise.resolve`，FormData 仅构建不发送
- 负责人选择已统一用 `searchUsers`，勿再恢复 `getEnabledUserOptions`

---

## [2026-06-30] P0/P1 API 契约对齐（API_detail + 少量前端）

### 改了什么

- **文档生成器**：`scripts/api_detail/part2_detect.py` 对齐 detect §4.1/4.11–4.24/4.29 字段与枚举；新增 `scripts/api_detail/query_specs.py` 集中维护 P1 Query/Body override
- **知识库/策略/报告/系统**：part3/part4 循环调用 `apply_override()`，补全 §5.1/5.4/5.9 等 P0 响应字段及 §6.1/7.1/9.2/10.1 等筛选 Query
- **全局约定**：`common.py` 增加 auth.role ↔ RBAC roleCode 映射表；预览用 `url`、下载用 `downloadUrl` 区分说明
- **前端契约修复**：
  - `ReportDownloadInfo.url` → `downloadUrl`（types / mock / `ReportDownloadModal.vue`）
  - `getRecentTasks(limit?)` 签名与 §2.2 文档一致
  - `resetUserPassword` TODO 注释改为 `{ newPassword }`
  - auth mock admin `userId`: `user-001`（与 `userList.ts` 一致）
- 重新生成 **`API_detail.md`**（8702 行，166 条）

### 怎么用

- 后端联调以 **`API_detail.md`** 为准；字段名与 `frontend/src/types/` 一致
- 改接口契约：优先改 `scripts/api_detail/*.py` 或 `query_specs.py`，再 `python -m scripts.api_detail.generate`
- 校验：`python scripts/check_api_detail.py`

### 注意事项

- `getEnabledUserOptions` 已删除（无引用；负责人用 `searchUsers`）
- multipart：api 已通过 `formDataBuilders.ts` 构建 FormData，mock 仍 resolve
- 报告在线预览 §7.4 仍用 `ReportPreview.url`，与下载 `downloadUrl` 不同

---

## [2026-06-30] 新增 API_detail.md 后端联调详细接口文档

### 改了什么

- 167 条 endpoint（166 函数 + saveReportTemplate 拆 POST/PUT）；不含 `getEnabledUserOptions`（无页面调用）
- 每条含：页面/场景、path、method、Request、Response、备注（后端）
- 第 0 章全局约定：`code: 200`、Bearer 鉴权、分页、multipart、downloadUrl
- 附录接口索引表（Method + Path + api 函数 + 章节号）
- 生成器源码：`scripts/api_detail/`（`python -m scripts.api_detail.generate` 可重新生成）
- 校验脚本：`scripts/check_api_detail.py`（核对 166 函数全覆盖）

### 怎么用

- **后端开发**：直接看 `API_detail.md`；联调进度仍看 `API.md`
- **前端改接口**：改 `src/api/` + types 后，同步更新 `API.md` 与 `API_detail.md`（或改 generator 后重新 generate）
- 复用接口（如 `getDetectTaskProjectOptions`）在「页面/场景」列合并列举，不重复写多条

### 注意事项

- 成功码沿用现有 **`code: 200`**，与 axios 拦截器一致
- 部分 knowledge/policy 条目 Response 示例较简，完整字段以 `frontend/src/types/` 为准
- `getNewReportTemplateEditorDetail` path 为 draft-preview（待定）

---

## [2026-06-30] 知识库 · 季度更新管理页（列表）

### 改了什么

- **`KbQuarterUpdateManage.vue`**：顶部 4 项统计 + **`KbQuarterUpdateQueryBar`** + 分页列表
- 筛选：季度（**`AsyncOptionsSelect`** + `getKbQuarterUpdateQuarterOptions`，默认全部）、状态、采集方式、摘要关键词
- 表格 **`KbQuarterUpdateRecordTable`**：项目名、季度、摘要、采集方式、状态、负责人、更新时间；无操作列
- mock：`quarterUpdateRecordList.ts`（12 条，支持筛选/分页）、`quarterUpdateQuarterOptions.ts`
- API：`getKbQuarterUpdateList`、`getKbQuarterUpdateQuarterOptions`

### 怎么用

- 路由 `/knowledge/quarter-updates`；进入后默认查全部季度记录
- 摘要关键词仅匹配 **summary** 字段（mock 大小写不敏感包含）

### 注意事项

- 记录由系统在版本管理等操作后写入，本页只读；联调替换为 `GET .../records` 与 `GET .../quarters`
- 采集方式展示用短文案（云端拉取/上传包），与知识库项目列表的「云端仓库拉取」等区分

---

## [2026-06-30] 策略版本导出与回滚

### 改了什么

- **已发布** 行「导出」→ **`PolicyVersionExportModal`**（策略导出）：导出范围（策略参数+规则集 / 仅策略参数 / 仅规则集）、格式（JSON/YAML）；确定后 `exportPolicyVersion`，下载并 toast 关闭
- **历史** 行「回滚」→ **`PolicyVersionRollbackModal`**：提示审计说明 + 输入版本号确认；确认后 `rollbackPolicyVersion`，toast 并刷新列表
- mock：回滚时原已发布降为历史，目标历史升为已发布

---

## [2026-06-30] 策略版本发布审批抽屉

### 改了什么

- 待审批行去掉 **催办**；**审批** 打开右侧 **`PolicyVersionApprovalDrawer`**
- 抽屉顶部：申请版本、申请人、变更摘要（各一行）；下方复用 **`PolicyVersionDiffPanels`**（无导出按钮）
- **发布审批** 表单：结论（通过/驳回，默认通过）、审批意见、生效时间（立即生效/下次发布窗口）
- 底部 **取消 / 提交审批**；提交调用 `submitPolicyVersionApproval`，成功后 toast 并刷新列表
- 差异对比 UI 抽成 **`PolicyVersionDiffPanels`**，供弹窗与抽屉共用

### 注意事项

- mock：驳回会移除待审批版本；通过+立即生效会将原已发布降为历史、待审批升为已发布
- 通过+下次发布窗口 mock 仅提示，版本状态暂不变

---

## [2026-06-30] 策略版本差异对比弹窗

### 改了什么

- **`PolicyVersionDiffModal`**：点击「差异」打开；左右两栏等高，复用 **`CodeSnippetBlock`** 展示旧/新版本策略摘要；仅保留「导出差异报告」与右上角关闭，无影响评估/取消/确定
- 对比配对（`utils/policyVersionDiff.ts` + mock）：
  - 待审批 ↔ 已发布
  - 历史 ↔ 已发布
  - 已发布 ↔ 待审批；无待审批则 ↔ 最新历史
- **`PolicyVersionActionCell`**：已发布去掉回滚；历史增加回滚（占位）；差异已接弹窗
- API：`getPolicyVersionDiff`、`exportPolicyVersionDiffReport`（mock 返回 Blob 下载链接）

### 注意事项

- 无法解析对比对象时弹窗内展示 warning，不报错 toast
- 联调后 diff/export 接口应返回真实摘要文本与文件 URL

---

## [2026-06-30] 策略编辑器发布申请 + 版本与审批页

### 改了什么

- **`PolicyEditor`**：去掉「保存草稿」，仅保留「提交发布申请」；弹窗填写版本号与变更摘要；编辑已有策略时版本号须大于当前生效版本；提交携带 JSON 配置与 `editorId`（来自 `authStore.userInfo`）
- **`PolicyPublishApplyModal`**：版本格式校验 + 变更摘要必填；默认建议下一版本号
- **`PolicyGovernance`**：顶部 4 项 `StatCardRow`（策略名、当前生效版本、待审批数、最近变更）；统计卡片与版本列表之间 **「更新策略」** 按钮，复用 `PolicyEntryWizardModal`（策略编辑器 / 导入策略）；下方 `PolicyVersionTable` 分页列表
- **`PolicyVersionActionCell`**：按状态展示操作链接（差异已接弹窗；历史含回滚占位；已发布无回滚）
- API/mock：`getPolicyEditorContent` 返回 `{ configText, currentVersion }`；`submitPolicyPublishApplication`、`getPolicyGovernanceOverview`、`getPolicyVersionList`；mock 在 `policyVersionList.ts`

### 怎么用

1. 策略列表 → 添加/编辑 → 策略编辑器改 JSON → 点「提交发布申请」
2. 填写版本号与摘要 → 确定 → toast 成功后回列表
3. 列表「版本/审批」进入版本页 → 点 **「更新策略」** 选编辑器或导入 → 修改后提交发布申请

### 注意事项

- 配置内 `name` 字段（策略名称）必填，否则无法打开/提交弹窗
- 新建策略 `policyId=new` 时不校验版本大于当前；编辑时与 mock 中已发布版本比较
- 版本列表操作列后续再接差异对比、审批等接口

---

## [2026-06-30] 开源风险 · SBOM 导出 Tab

### 改了什么

- Tab 文案改为 **SBOM导出**（去掉「与对比」）
- **`OpenSourceRiskSbomPanel`**：左 1/4 卡片选标准格式（SPDX 默认 / CycloneDX）与文件格式（JSON 默认 / XML）；右 3/4 选输出粒度（项目/模块/包）+ **`RiskSbomPreviewTable`** 清单预览（`ListTable`，3 条/页）
- 左下角 **导出 SBOM**：`exportOpenSourceRiskSbom` 提交配置，mock 返回 `downloadUrl` 后 `triggerReportDownload` 下载
- 预览：`getOpenSourceRiskSbomPreview`；mock 在 `openSourceRiskSbom.ts`

### 注意事项

- 切换粒度会重置分页并重新拉预览
- 联调后 export 接口应返回真实文件 URL；preview 列定义与原型三种粒度一致

---

## [2026-06-30] 开源风险 · 漏洞风险列表操作（详情 / 处置 / 复核）

### 改了什么

- **`RiskVulnerabilityTable`**：按 `processingStatus` 展示操作——待处理「详情+处置」、需复核「详情+复核」、已验证仅「详情」
- **`RiskVulnerabilityDetailDrawer`**：右侧抽屉统一展示；待处理含修复建议 + 未登记提示；需复核含「待复核处置方案」；已验证含处置结果 + **`ChainTimeline`** 时间线
- **`RiskVulnerabilityRegisterModal`**：CVE/组件只读展示；处置方式四选一；计划完成日默认今日；负责人 **`UserSearchInput`**；处置说明必填；提交后状态变需复核
- **`RiskVulnerabilityReviewModal`**：展示登记信息与复核结论（通过/驳回）+ 复核意见；通过→已验证，驳回→待处理
- API/mock：`getOpenSourceRiskVulnerabilityDetail`、`registerOpenSourceRiskVulnerabilityDisposition`、`reviewOpenSourceRiskVulnerabilityDisposition`（`openSourceRiskVulnerabilityDetail.ts`）

### 怎么用

1. 开源风险详情 → 漏洞风险 Tab → 待处理行点「处置」登记，或点「详情」看 CVE/CVSS/修复建议
2. 登记成功后列表状态变为「需复核」，点「复核」提交审计结论
3. 复核通过后变为「已验证」，详情抽屉可看最终方式与时间线

### 注意事项

- mock 阶段登记人 `registeredBy` 暂用负责人姓名；联调后应由登录用户写入
- 所有处置方式提交后均进入「需复核」（与原型部分文案不同，按产品要求实现）
- 静态 seed：`CVE-2024-3094` 默认需复核、`CVE-2024-2201` 等默认已验证，便于演示三种抽屉内容

---

## [2026-06-30] background.md §9 需规验收清单 + 原型 M03-S07

### 改了什么

- **`background.md` §9**：从《需求规格说明书.docx》提炼功能/验收/非功能/自主率附录检查点，供后期代码与联调对照
- **`prototype.html`**：季度更新改为独立页 **M03-S07-P01**（侧栏菜单 + 知识库列表跳转链接）；执行计划 8 态 + 操作列 + 新建计划弹窗 + 批次详情抽屉

### 注意事项

- 需规正文页面表仍写 27 页，以 **background §4 + 原型 28 页** 为准（含 M03-S07）
- 前端实现季度执行计划列表时对照 **§9.3** 与原型 `#/M03-S07-P01`

---

## [2026-06-30] 知识库 · 季度更新管理页（骨架）

### 改了什么

- 新增 **`KbQuarterUpdateManage.vue`**（`/knowledge/quarter-updates`），与覆盖统计、漏洞知识库同级侧栏菜单
- 顶部 **`StatCardRow`** 4 项：`getKbQuarterUpdateOverview` → 最近季度 / 新增项目 / 上传包 / 云端拉取
- mock：`quarterUpdateOverview.ts`；映射 **`mapKbQuarterUpdateToStatCards`**（`utils/statCard.ts`）
- 下方业务内容暂未实现，后续可在此页扩展批次列表与操作

### 注意事项

- 路由需放在 `knowledge/:kbProjectId/*` 之前，避免 `quarter-updates` 被误匹配为项目 ID
- 联调时替换 `getKbQuarterUpdateOverview` 为 `GET /api/knowledge/quarter-updates/overview`

---

## [2026-06-30] 知识库管理页 · 顶部分类图 + 入库待办

### 改了什么

- 移除 **`StatCardRow`** 五卡统计，改为 **`KbProjectOverviewSection`** 双栏（高度对齐漏洞知识库风险摘要）
- **`KbProjectCategoryPiePanel`**：`getKbProjectOverview` + `useECharts` 普通扇形图（非玫瑰图），标题含入库总数，hover 显示分类与数量
- **`KbIntakeTodoPanel`** / **`KbIntakeTodoTable`**：`getKbIntakeTodoList`，4 条/页，列：项目 / 状态 / 详情
- mock：`kbIntakeTodoList.ts`；类型 `KbIntakeTodoItem` / `KbIntakeTodoStatus`

### 注意事项

- 扇形图仅在 `useECharts` composable 内 init/dispose，遵守 chart-lifecycle 规则
- 编辑/删除项目后调用 `overviewSectionRef.refresh()` 刷新两模块

---

## [2026-06-30] 知识库 · 版本管理操作列交互

### 改了什么

- **`KbVersionActionCell`**：索引构建中仅「构建日志」（无项目目录）；已就绪保留目录+更新说明；已归档保留目录+恢复
- **`KbVersionUpdateNotesModal`** / **`KbVersionRestoreModal`**：更新说明展示、恢复确认弹窗
- **`restoreKbVersion()`**：mock 提交恢复请求，**不刷新列表状态**
- **构建日志**：`router-link` 至 `/system/logs?traceId=...`，日志页自动填 TraceID 并查询
- **`KbVersion`** 扩展 `indexBuildTraceId`、`updateNotes`；mock 与 `logList` 增加 OpenFOAM 索引构建 Trace 样例

### 注意事项

- 恢复成功后仅 toast，列表仍显示「已归档」（待后端异步生效后由刷新/轮询更新）
- 索引构建中若无 `indexBuildTraceId` 仍跳转日志页但不带筛选
- **mock 状态规则**：至多 1 条 `indexing`（最新候选）、1 条 `ready`（当前基线）、其余 `archived`；OpenFOAM 为 v2406-rc1 / v2312 / 历史归档

---

## [2026-06-30] 知识库 · 项目目录文件详情（M03-S03-P01 · 下部）

### 改了什么

- **`KbProjectFileDetailPanel.vue`**：右侧文件详情面板，选中树节点时请求详情；含 desc-grid 字段、指纹与来源摘要表、导出元数据按钮（无「查看来源证据」）
- **`KbProjectFingerprintSummaryTable.vue`**：复用 `ListTable`，无分页，列：维度 / 命中数 / 最高置信度 / 说明
- **`projectDirectoryFileDetail.ts`**：mock 详情与导出；`createFields.H` 等对齐原型数据，其余文件走兜底生成
- **`getKbProjectFileDetail()` / `exportKbProjectFileMetadata()`**：`api/knowledge.ts`
- **`KbProjectDirectory.vue`**：挂载详情面板；目录树加载后由 `LinuxStyleFileTree` 默认选中首个文件并触发详情请求
- **`kbProjectDirectoryDisplay.ts`**：来源候选分号拼接、最近更新时间行、置信度格式化

### 怎么实现的

- 页面传 `kbProjectId`、`versionId`、`fileNodeId` 给面板；`watch` 三者变化时 `getKbProjectFileDetail`
- 导出点击调 `exportKbProjectFileMetadata`，用 `triggerReportDownload` 下载 mock JSON
- 路径 / MD5 / SHA1 / 来源候选 / 最近更新使用 `desc-item--full` 独占一行

### 注意事项

- mock 导出为浏览器 Blob URL，刷新后旧 URL 失效属正常
- 真实接口对接时仅需改 `api/knowledge.ts` 两处 TODO
- **2026-06-30 补充**：「导出元数据」移至文件详情卡片右上角 `#extra`；指纹摘要表改为 `ListTable` 前端分页，每页 3 行

---

## [2026-06-30] 检测分析 · 自主率 / 开源风险拆分为两个列表页

### 改了什么

- **路由**：`/detect/autonomy`（自主率检测）、`/detect/risk`（开源风险检测）；结果页改为 `/detect/autonomy/:taskId/result`、`/detect/risk/:taskId`
- **旧路由兼容**：`/detect/tasks` 及原结果路径 301 式 redirect 到新路径
- **`AutonomyDetectTaskList.vue`** / **`OpenSourceRiskTaskList.vue`**：独立页面（非共用组件 props），避免路由切换时列表类型不刷新
- 删除 **`DetectTaskListPage.vue`**；`AdminLayout` 的 `router-view` 增加 `:key="route.path"`
- **列表差异**：无「检测类型」列/筛选项；自主率列名为「模式」，开源风险列名为「来源」
- **创建入口**：各页顶部按钮直接打开对应创建弹窗（不再二次选类型）
- **侧栏**：「检测任务」拆为「自主率检测」「开源风险检测」两项

### 注意事项

- 首页最近任务、项目关联任务仍展示两种类型（保留检测类型列）
- 结果页跳转仍走 `getTaskResultRoute()`（按 taskType 选路由 name）

---

## [2026-06-30] 列表操作列 · 删除链接统一标红

### 改了什么

- **`DetectTaskActionCell.vue`**：检测任务列表「删除」操作补充 `list-table-link--danger`（此前为默认蓝色）
- **`styles/list-table.css`**：将 `list-table-link` / `--danger` 等列表操作样式从 `ListTable.vue` 抽到全局，`main.ts` 引入

### 已覆盖的删除操作（均为红色 `#ff4d4f`）

项目 / 策略 / 报告 / 报告模板 / 知识库开源项目 / 用户 / 角色 / 部门 / 项目交付物 / 检测任务

### 注意事项

- 破坏性但文案非「删除」的操作（如成员「移除」、组件「忽略」）沿用 `--danger`，与删除视觉一致
- 内置角色等不可删场景不展示删除链接

---

## [2026-06-30] 知识库管理 · 顶部 5 项统计卡片

### 改了什么

- **`KnowledgeBaseList.vue`**：顶部接入 `StatCardRow`（5 列）：入库总数 + 仿真框架/数值计算/前后处理/通用依赖分类计数
- **`getKbProjectOverview()`**：新增概览 API，计划对接 `GET /api/knowledge/projects/overview`
- **`kbProjectOverview.ts`**：mock 按 `MOCK_ALL_KB_PROJECTS` 动态汇总，删除/改分类后刷新卡片数字一致
- **`mapKbProjectOverviewToStatCards()`**：概览数据 → 通用 `StatCardItem` 映射

### 注意事项

- 统计卡片为全库汇总，不受列表筛选条件影响
- 编辑改分类、删除项目后会重新请求 overview

---

## [2026-06-30] 知识库管理 · 开源项目分类调整为四类

### 改了什么

- **`KbProjectCategory`**：由「仿真框架 / 数值计算 / 工具链」改为「仿真框架 / 数值计算 / 前后处理 / 通用依赖」
- **`knowledgeDisplay.ts` / `knowledgeQuery.ts`**：分类标签、颜色、筛选/编辑下拉选项同步更新（`KbProjectQueryBar` 等组件自动生效）
- **`knowledgeList.ts`**：mock 种子数据按新分类重映射（如 VTK/Gmsh → 前后处理，fmt/protobuf → 通用依赖）
- **`coverageCategoryStats.ts` / `coverageCollectionMethodStats.ts`**：覆盖统计 mock 分类文案与项目数分布对齐

### 注意事项

- 后端枚举值：`simulation_framework` / `numerical_computing` / `pre_post_processing` / `general_dependency`
- 原 `toolchain` 已废弃，联调时需与后端确认迁移映射

---

## [2026-06-29] 报告模板 · 保存后回列表 + 系统模板只读查看

### 改了什么

- **`ReportTemplateEditor.vue`**：保存成功后 `router.push('/reports/templates')`；系统模板（`isSystem`）进入只读模式，顶部 `a-alert` 提示，隐藏保存按钮
- **`ReportTemplateActionCell.vue`**：系统默认模板操作列改为蓝色链接「查看」（不再显示灰色不可操作文案）
- **子组件** `BasicInfoForm` / `ContentPanel` / `MarkdownEditor` / `ExportPanel` / `ExportDownloadForm`：新增 `readonly` prop，禁用全部表单与编辑交互

### 注意事项

- 系统模板与普通模板共用 `/reports/templates/:id/edit` 路由，只读态由详情 `isSystem` 决定
- 只读模式下 Markdown 编辑器 textarea 不可编辑，变量库不可点击，导出 Markdown 按钮隐藏

---

### 改了什么

- **`ReportTemplateEditor.vue`**：「保存模板」按钮接入 `saveReportTemplate`；保存前校验基本信息必填项、Markdown 正文、水印内容
- **`ReportTemplateCreateModal.vue`**：确认后仅 `emit('navigate')` 跳转 `/reports/templates/new/edit`，不再调用创建 API
- **`api/reportTemplate.ts`**：新增 `getNewReportTemplateEditorDetail`、`saveReportTemplate`；移除 `createReportTemplate`
- **`utils/reportTemplateMarkdown.ts`**：`convertMarkdownVariablesToEnglish` / `ToChinese`（保存转英文、加载转中文）
- **`utils/reportTemplateEditorValidate.ts`**：保存前统一校验
- **`mock/modules/report/templateDetail.ts`**：新建草稿详情 + `mockSaveReportTemplate` 落库

### 保存提交内容

- 基本信息：名称、版本、输出格式、可见范围、绑定项目（项目组可用时）、是否默认模板
- Markdown 正文：编辑器内 `$中文变量名` → 提交时转为 `$英文varKey`
- 导出与权限：敏感字段 + 下载与水印（不含只读 roleRules）

### 注意事项

- 新建流程：弹窗填名称 → 编辑器 `/new/edit` → 填完点保存 → mock 分配真实 `templateId` 并 `router.replace`
- 直接访问 `/reports/templates/new/edit` 且无 `history.state.draft` 会显示加载失败
- 联调时 `saveReportTemplate('new', …)` 对应 `POST`，已有 ID 对应 `PUT`

---

### 改了什么

- **`ReportTemplateExportPanel.vue`**：左右分栏——按角色脱敏（`ListTable` 无分页）+ 敏感字段多选；下载与水印表单
- **`ReportTemplateExportDownloadForm.vue`**：允许格式、导出需审批、水印、谁可下载、链接有效期、下载审计
- 详情 API 增加 **`exportSettings`**；空白新建用默认配置，复制/编辑从 mock 加载（tpl-002/004/005 有差异化示例）

### 默认项

- 敏感字段 / 允许格式 / 下载审计：全选
- 导出需审批：是；水印：开启，内容 `机密｜{user}｜{project}｜{time}`
- 谁可下载：项目成员；链接有效期：24 小时

---

## [2026-06-29] 报告模板编辑器 · Markdown 工作区 + 实时预览

### 改了什么

- **`ReportTemplateMarkdownEditor.vue`**：MD 语法提示（`a-alert`）、变量库 `a-tag`（不可关闭，点击插入 `$中文变量名`）、全宽自适应高度 textarea、底部「导出 Markdown」下载
- **`ReportTemplateMarkdownPreview.vue`**：左侧正文实时渲染；`$变量` 显示为蓝色中文标签
- **`utils/reportTemplateMarkdown.ts`**：轻量 Markdown 渲染、变量映射、光标插入、文件下载
- **`mock/modules/report/templateVariables.ts`**：变量库 + 默认示例正文；**`templateMarkdown.ts`**：已有模板正文存储
- 详情 API 增加 `variables` + `markdownContent`；复制/编辑加载已有正文，空白新建用原型默认正文

### 布局

- 编辑器区 **2/3** 宽，实时预览 **1/3** 宽（`grid-template-columns: 2fr 1fr`）

### 注意事项

- 变量 tag 仅展示中文名；插入与预览均用 `$中文变量名`；Backspace/Delete 在占位符内/边界时整段删除
- 编辑器与预览区等高（flex 撑满 card body）；所有 mock 模板（tpl-001～018）均有 Markdown 正文

---

## [2026-06-29] 报告模板编辑器 · 基本信息 + Tab 骨架

### 改了什么

- **`ReportTemplateEditor.vue`**：顶部「保存模板」按钮（暂无交互）；`PageNavTabs` 切换「模板内容 / 导出与权限」；进入页按路由 `templateId` 调 `getReportTemplateDetail` 回填表单
- **`ReportTemplateBasicInfoForm.vue`**：模板名称、版本、输出格式（HTML/PDF/Word 无默认）、可见范围、绑定项目（`AsyncOptionsSelect`）、默认模板
- **`ReportTemplateContentPanel.vue`** / **`ReportTemplateExportPanel.vue`**：左右编辑器/预览、导出权限区占位（待接入）
- **`api/reportTemplate.ts`** + **`mock/modules/report/templateDetail.ts`**：新增详情接口 mock
- **`types/reportTemplate.ts`**：新增 `ReportTemplateDetail`、`ReportTemplateEditorForm`

### 怎么用

1. 报告模板列表点「编辑」→ `/reports/templates/:templateId/edit`
2. 页面加载后自动请求详情，基本信息字段已填好；可见范围=项目组可用时绑定项目下拉必填且可搜索
3. Markdown 编辑器与实时预览、导出与权限 Tab 内容下一阶段再做

### 注意事项

- 保存模板按钮尚未接 API；输出格式/可见范围/默认模板下拉 intentionally 无默认值（新建空白场景），编辑态由详情 API 回填
- **新建空白**：`createReportTemplate` 设 `isNewBlank: true`，详情 API 只返回 `templateName` + `version: v1.0`，其余 undefined
- **新建且复制自**：创建时存 `copyFromTemplateId`，详情 API 读取源模板完整字段，但 `templateName` 用新建名、`version` 固定 `v1.0`、`isDefault` 为 false
- **列表点编辑已有模板**：无上述标记，详情 API 返回模板自身完整数据
- 绑定项目下拉复用 `loadDetectTaskProjectSelectOptions`；编辑态通过 `seedOption` + `prefetchOptions` 展示项目名称

---

## [2026-06-29] 修复用户列表 / 个人设置无法进入（mock 循环引用）

### 改了什么

- 新增 `src/mock/modules/system/userProjectRelations.ts`：仅存放 `USER_PROJECT_RELATIONS` 与 `getMockOwnedProjectCount`
- `userList.ts` 改为从 `userProjectRelations` 取负责项目数，**不再** import `userProjects.ts`
- `userProjects.ts` 改为从 `userProjectRelations` 读关系表，并 re-export `getMockOwnedProjectCount`

### 为什么这么做

`userList → userProjects → projectList → userList` 形成循环引用。加载用户列表或个人设置页时会触发 `projectList` 在 `MOCK_ALL_USERS` 初始化前调用 `findMockEnabledUserByRealName`，浏览器报：

`ReferenceError: can't access lexical declaration 'MOCK_ALL_USERS' before initialization`

路由守卫 / 菜单跳转因此失败，表现为「点了没反应」。

### 注意事项

- mock 模块之间禁止「A 引 B、B 再引回 A」；共享种子数据应抽到无反向依赖的独立文件
- 若新增 mock 又在模块顶层互相 import，可用同样方式拆关系表 / 常量文件

---

## [2026-06-29] 用户列表 · 修复点击无响应 & 消除 filterForm v-model 编译警告

### 改了什么

- `useFilteredPaginatedList.ts`：`filterForm` 从 `reactive()` 改为 `ref()`，模板仍写 `v-model="filterForm"`（自动解包），消除 Vue 3.5 的 `const reactive binding` 编译警告
- `UserList.vue`：`watch(route.query)` 在带 `departmentName` / `roleName` 跳转时重新填筛选并查询；详情抽屉改为 `detailUserId` + 常驻挂载（对齐 `LogList` / `LogDetailDrawer` 模式）
- `UserDetailDrawer.vue`：`userId` 改为 `string | null`，仅在抽屉打开且 ID 存在时拉详情
- 脚本里直接改 `filterForm.xxx` 的页面改为 `filterForm.value.xxx`（LogList、KnowledgeBaseList、VulnItemList、OpenSourceRiskVulnerabilityPanel）
- `AdminLayout.vue`：`handleMenuClick` 对 `key` 做 `String()`，兼容 Ant Design Menu 的 `Key` 类型

### 为什么这么做

1. **编译警告**：`v-model="filterForm"` 会编译成 `filterForm = $event`，而 `useFilteredPaginatedList` 解构出来的是 `const` + `reactive()`，Vue 3.5 会警告并自动降级为 `let`。改成 `ref` 后 `v-model` 更新的是 `.value`，不再冲突。
2. **点击无反应**：从部门/角色页点「成员数/绑定用户数」跳转到 `/system/users?...` 时，若用户列表组件已被复用，`onMounted` 不会再次执行，筛选和列表不刷新，看起来像「点了没反应」。详情抽屉原先 `v-if="detailUser"` .mount 时序也可能导致首次点「详情」不稳定。

### 注意事项

- 侧栏已在 `/system/users` 时再点「用户列表」，Vue Router 默认不会重复导航，页面不会刷新——这是预期行为
- 若仍无反应，打开浏览器控制台看是否有红色报错，并说明是侧栏、查询按钮还是表格「修改/详情」

---

## [2026-06-18] 修复「打开策略编辑器失败」（CodeMirror 依赖未预构建）

### 改了什么

- `vite.config.ts`：新增 `optimizeDeps.include`，把 `codemirror`、`@codemirror/state`、`@codemirror/view`、`@codemirror/commands`、`@codemirror/language`、`@codemirror/lang-json`、`@lezer/highlight` 全部加入预构建
- `PolicyEntryWizardModal.vue`：跳转 catch 里补 `console.error`，失败时控制台能看到真实原因，不再只弹一句提示

### 为什么这么做

入口弹窗点「策略编辑器」直接弹「打开策略编辑器失败」。根因不是布局/路由，而是 dev 模式下 CodeMirror 这组依赖没在启动时预构建——用户首次进入编辑器页时 Vite 才发现新依赖，触发二次预构建并自动 reload，导致那一次路由的异步 `import()` 被 reject，被 `navigateToPolicyEditor` 外层的 `catch` 弹成「打开失败」。

### 怎么实现的

- 把 CodeMirror 全家桶塞进 `optimizeDeps.include`，启动时就预构建好，进入编辑器不再触发二次优化 → 异步 chunk 正常加载
- 改完需**重启 dev server**（Vite 检测到 config 变化会自动重建 `.vite/deps` 缓存）
- 已用浏览器动态 `import('/src/views/policy/PolicyEditor.vue')` 验证整条依赖链加载成功（返回 `OK:default`）

### 注意事项

- 改了 `optimizeDeps` 后必须重启 dev，且浏览器最好硬刷新（Ctrl+Shift+R）一次，清掉旧的依赖缓存
- 以后再引入新的第三方非 ESM/大型库且用于懒加载路由时，记得同样加进 `optimizeDeps.include`，避免同类「首次进入 reject」问题

---

## [2026-06-18] 策略编辑器页 · JSON 编辑与动态解析预览

### 改了什么

- `PolicyEditor`：顶栏 `page-actions`（与其他页一致，无独立白底条）；主体左右分栏占满内容区高度
- **左侧** `PolicyJsonEditorPanel`（标题「JSON/ YAML 配置编辑器」）：CodeMirror 黑底可编辑
- **右侧** `PolicyConfigPreviewPanel`：只读预览；排除目录 tag 纵向排列
- 新建/编辑、解析失败提示逻辑不变；依赖 `codemirror`

### 注意事项

- 数据流单向：仅左侧 JSON 编辑器可改，右侧预览随解析更新
- 高度占满：`PageLoading` 内部 `.page-loading__body` 默认无 `flex`，会把高度卡成内容高度。页面里必须 `:deep` 打通 `a-spin 根 → .ant-spin-container → .page-loading__body → 工作区` 整条 `flex:1` 链；工作区再加 `min-height: calc(100vh - 152px)` 兜底，两个卡片 `height:100%` 才能撑满视口
- 允许根字段：`name`、`similarity_threshold`、`min_match_len`、`excluded_folders`、`retry`、`output_format`
- 字段值约束（`policyConfigParse.ts`）：`similarity_threshold` 必须是 0–1 的数字（`readNumberField` 支持传 range 校验）；`output_format` 只能是 `json` 或 `yaml`（类型已收窄为联合类型，超范围/非枚举均报对应 schema 错误）
- 联调：`GET /api/policies/:policyId/editor-content`（`new` 用默认模板）
- 顶部按钮交互、保存草稿/发布申请弹窗待后续迭代
- 入口弹窗选「策略编辑器」须先 `emit` 再关弹窗（`EntryTypePickModal`），跳转使用命名路由 `PolicyEditor`

---


### 改了什么

- 新增 `getPolicyDetectParams(policyId)`：返回策略当前生效版本的相似度阈值、最小匹配长度、排除目录
- `ProjectCreateWizardModal`、`ProjectPolicyPanel`：选择/切换检测策略后自动填充上述三项，用户可在默认值基础上修改
- 未选策略时参数字段禁用；切换策略会重新拉取该策略默认值（覆盖当前编辑中的参数）
- composable：`usePolicyBindingParamsFill`；mock：`policy/policyDetectParams.ts`

### 注意事项

- 项目详情 Tab 初次加载仍回显**已保存的项目绑定**（含用户曾修改过的覆盖值），不会因拉策略默认值而覆盖
- 仅在用户**切换**策略下拉选项时重新填充；联调接口 `GET /api/policies/:policyId/detect-params`

---


### 改了什么

- 从 `ProjectDeliverableAddBar` 既有 **520px** 选型弹窗样式抽取 `EntryTypePickModal`（`a-modal` + 提示 + 选项卡片）
- `ProjectDeliverableAddBar`、`DetectTaskCreateBar`、`PolicyEntryWizardModal`、`KbVersionUpdateBar` 均改为引用该组件
- 删除误建的 `EntryTypeOptionList`（只抽了列表、没抽 modal 壳，与交付物页重复）

### 怎么用

```vue
<EntryTypePickModal
  v-model:open="visible"
  title="选择交付物类型"
  hint="请选择要添加的交付物类型"
  :options="[{ key, title, description }]"
  @select="handleSelect"
/>
```

### 注意事项

- 选项类型 `EntryTypePickOption` 从 `EntryTypePickModal.vue` 导出；`muted: true` 可弱化标题（创建项目向导内联表单暂未接入）
- 选中后组件内部自动关弹窗，父级在 `@select` 里打开下一步弹窗即可

---

## [2026-06-18] 策略管理 · 添加/编辑入口向导与导入

### 改了什么

- 入口与交付物/检测任务一致：`EntryTypePickModal` 选方式；导入另开 `PolicyImportModal`（560px），不再用 `FormStepWizardModal` 包第一步
- 选编辑器 → 跳转编辑页；选导入 → 上传 JSON/YAML + `importPolicy`，toast 后不刷新列表

### 注意事项

- 导入默认勾选三项导入前校验；编辑场景默认导入模式为「导入为新版本」
- 联调：`POST /api/policies/import`（multipart）

---

## [2026-06-18] 自主率检测结果 · 指纹检测证据卡片

### 改了什么

- `AutonomyFingerprintEvidenceItem` 扩展字段：`alertType` / `confidence` / `sourceProject` / `sourceVersion` / `description`
- `AutonomyFingerprintEvidenceCard`：顶部元信息与代码证据共用 `AutonomyEvidenceMetaRow`，下方一段描述文字（无 diff 区，卡片更矮）
- mock `solver.cpp` 3 条指纹证据对齐原型文案；与代码证据同接口 `getAutonomyDetectFileDetail` 一次返回
- 指纹区块 `evidence-variant="fingerprint"` 使用更紧凑的 `--evidence-fp-item-height: 110px`

### 怎么用

文件证据 Tab → 选 `solver.cpp` → 代码证据下方查看指纹区块；每页 2 条，超过 2 条分页

### 注意事项

- 告警类型枚举：`fingerprint-hit` / `fingerprint-sequence` / `segment-fingerprint`，文案见 `autonomyDetectResultDisplay.ts`
- 描述段落为后端 `description` 字段，勿包含原型布局备注

---

## [2026-06-18] 自主率检测结果 · 代码检测证据 diff 与分页

### 改了什么

- **数据加载**：`getAutonomyDetectFileDetail` 一次返回该文件全部证据；树加载后自动选中首文件并请求详情，切换左侧文件节点时再请求
- **分页**：`AutonomyEvidenceSection` 客户端切片 — 代码每页 **1** 条（>1 条分页）、指纹每页 **2** 条（>2 条分页）
- **代码证据**：`AutonomyCodeEvidenceCard` — 顶部告警类型 Tag / 置信度 / 来源项目 / 来源版本；左右 diff 双栏，标题居中无底色
- **CodeSnippetBlock**：新增 `lines` diff 模式，红底删除、绿底新增行高亮
- mock `solver.cpp` 两条证据对齐原型（高相似 + 片段重组）

### 怎么用

1. 自主率检测结果 →「文件证据」→ 默认选中首文件即加载详情
2. 选 `solver.cpp` 查看两条代码 diff；指纹区块仍为占位卡片

### 注意事项

- 指纹证据内容待下一迭代；分页仅控制展示，不额外按页请求接口
- `AutonomyCodeAlertType` 当前为 `high-similarity` / `fragment-reassembly`，后端新增类型需补 `autonomyDetectResultDisplay.ts` 文案

---

## [2026-06-18] 自主率检测结果 · 文件详情模块（样式占位）

### 改了什么

- 右侧「文件详情」：`AutonomyFileDetailPanel` — 摘要区（问题行数/整体问题率/来源项目/来源版本/最高置信度）+ 当前文件提示行，对齐原型 `panel-head-row` + `desc-grid`
- `AutonomyEvidenceSection`：代码检测证据、指纹检测证据两区块，标题旁蓝色数量角标

### 怎么用

1. 进入自主率检测结果页 →「文件证据」Tab → 左侧树选 `solver.cpp`
2. 右侧查看摘要与证据卡片布局；证据 diff/指纹说明下一迭代填充

### 注意事项

- 字段「整体问题率」与证据树节点 `issueRate`、原型一致（非环图「总体自主率」）
- 无证据时对应区块显示 `a-empty`

---

## [2026-06-18] 文档 · 公共组件清单同步至 22 个

### 改了什么

- 更新下文「公共组件清单」：`18 → 22` 个对外组件；补充 `ChainTimeline`、`CodeSnippetBlock`、`LineAreaTrendChart`、`RiskRosePieChart` 及引用统计

---

## [2026-06-18] 告警中心 · 处置弹窗、已处理列表与时间线

### 改了什么

- **未处理 Tab**：未读蓝底 + 标题旁蓝点；筛选「已读状态」；操作「处理 / 详情」（「忽略本次」仅在处理弹窗处置下拉中）
- **`AlertHandleModal`**：7 种处置方式 + 后续动作联动表单；`handleAlert()` 提交后 mock 就地更新列表
- **已处理 Tab**：分页列表 + 详情抽屉 + `getAlertTimeline` 处理时间线弹窗
- 抽离 **`ChainTimeline.vue`**（日志详情、告警时间线复用）；修复已读行 `[object Object]`（蓝点并入标题列）
- 新增 mock：`alertHandle.ts`、`alertTimeline.ts`、`alertAssignees.ts`；工具 `utils/alertDisposition.ts`

### 注意事项

- 联调：`POST /api/system/alerts/:id/handle`、`GET .../timeline`；处理人 mock 阶段由页面传 `authStore.userInfo.realName`

---

## [2026-06-18] 策略治理子页去掉顶部 Tab 切换

### 改了什么

- `PolicyRuleTrace.vue`、`PolicyGovernance.vue` 移除 `PageNavTabs`；两页各自独立，仅保留策略名统计卡片
- 删除 `POLICY_GOVERNANCE_TABS` 常量

### 注意事项

- 策略列表操作列仍分别跳转「版本/审批」与「命中追溯」，两页互不嵌套 Tab

---

## [2026-06-18] 策略管理 · 规则命中追溯页

### 改了什么

- 新增 `PolicyRuleTrace.vue`（路由 `/policies/:policyId/trace`），从策略列表「命中追溯」独立进入
- 新增 `PolicyRuleHitQueryBar` / `PolicyRuleHitTable` / `PolicyRuleHitDetailDrawer` 组件
- 抽离公共 `CodeSnippetBlock.vue`（黑底等宽代码块），`LogDetailDrawer` 原始日志区复用
- 新增 mock `policy/ruleHitList.ts`、api `getPolicyRuleHitList` / `getPolicyRuleHitDetail` / `getPolicyById`
- `PolicyActionCell` 命中追溯改跳 `/trace`；`PolicyGovernance` 补策略名卡片
- `LogList` 支持 `?traceId=` 查询参数自动填充筛选

### 怎么实现的

- 顶部策略名单卡靠左展示；刷新后用 `getPolicyById` 兜底
- 列表用 `useFilteredPaginatedList` + `ListTable`；TraceID 列 `router-link` 到 `/system/logs?traceId=`
- 详情抽屉 `a-descriptions` 展示规则/对象/脱敏动作/TraceID/命中片段/处理结果

### 注意事项

- `PolicyGovernance` 仍为占位，仅保留策略名卡片；与命中追溯为两个独立页面，无顶部 Tab 互跳

---

## [2026-06-17] 报告查看 · PDF/HTML 在线预览 viewer

### 改了什么

- 新增 `ReportPreviewViewer.vue`,替换 `ReportDetailDrawer.vue` 里的"报告预览占位",支持内嵌浏览 PDF / HTML 报告
- 新增类型 `ReportPreviewFormat` / `ReportPreview`(`types/report.ts`)、mock `report/reportPreview.ts`、api `getReportPreview(reportId)`
- PDF/HTML 都采用零依赖 iframe 内嵌预览，避免 Vite 对 PDF 依赖包的解析问题
- `public/mock-reports/` 放 `sample-report.html`(完整样式示例)与 `sample-report.pdf`(纯文本最小 PDF)作为 mock 预览源

### 怎么实现的

- **HTML 报告**:`<iframe sandbox="allow-same-origin">` 内嵌,样式隔离、禁脚本
- **PDF 报告**:`<iframe>` 交给浏览器内置 PDF viewer 渲染,零依赖、不会触发额外 npm 包解析
- **鉴权**:当前 mock 直接用 `public/` 同源静态文件,无需 token。真实接入两条路(见 `getReportPreview` 注释):①后端返回带签名临时 URL,前端直接塞 iframe(推荐);②前端 `request.get(url,{responseType:'blob'})` 拉带 token 的 blob → `URL.createObjectURL` → 渲染,**关闭时务必 `revokeObjectURL`**
- **三态**:`PageLoading` 加载态、`a-result` 失败可重试、按 `format` 渲染;viewer 仅在抽屉打开(`active`)且有 `reportId` 时拉取
- mock 按 reportId 序号规则返回 pdf/html（`001/005...` 为 PDF，`003/009...` 为 HTML），确保 completed 报告也能覆盖两种预览形态

### 注意事项

- 当前方案不需要安装额外 PDF 预览依赖；浏览器内置 PDF viewer 能满足查看场景
- `sample-report.pdf` 是手写最小 PDF,仅用于演示,真实报告由后端产出
- 预览区最小高度改为 `calc(100vh - 220px)`，按视口高度撑满抽屉元信息下方区域；后续如果改成全屏预览，可在 drawer 外层新增独立预览页

---

## [2026-06-17] 开源风险详情 · G6 v5 组件依赖关系图

### 改了什么

- 新增 `RiskComponentGraph.vue`:用 G6 v5 画组件依赖有向图,替换原 `RiskComponentGraphPlaceholder.vue`(已删除)
- `OpenSourceRiskComponentPanel.vue`:接入依赖图,点击节点打开现有组件详情抽屉
- 新增类型 `RiskComponentGraphNode` / `RiskComponentGraphEdge` / `RiskComponentGraph`(`types/detect.ts`)
- 新增 mock `detect/riskComponentGraph.ts` + api `getRiskComponentGraph(taskId)`
- `useG6Graph` 增加可选 `onReady(graph)` 回调,用于实例创建后绑定事件

### 怎么实现的

- **图形态**:`antv-dagre` 自上而下分层,根节点=被测项目,下挂直接依赖(depth1)与传递依赖(depth2/3);边为 `cubic-vertical` 带箭头
- **配色**:节点底色按风险等级走低饱和度(高 #e89a9a / 中 #e8c79a / 低 #a7cfa0 / 无 #c9ccd1),根节点蓝 #7aa7e0;卡片右上角自带 HTML 图例
- **交互**:`drag-canvas` / `zoom-canvas` / `drag-element` / `hover-activate`;tooltip 插件 hover 显示风险等级+漏洞数;minimap 插件;点击节点经 `node:click` 上抛 `componentId`
- **数据一致性**:mock 节点复用组件清单前 9 条(`getMockOpenSourceRiskComponentPage`)+ 漏洞计数(`countMockOpenSourceRiskVulnerabilitiesByComponent`),节点 ID 即 componentId,所以点击能直接命中详情抽屉的按 ID 查询
- **空态**:画布容器常驻 DOM,无数据时用绝对定位 `a-empty` 覆盖(遵守图表生命周期规范)

### 注意事项

- 类型名 `RiskComponentGraph` 与组件名同名,在 Panel 里用 `import type { RiskComponentGraph as RiskComponentGraphData }` 避免 "different imports aliased to same local name"
- 依赖父子关系目前是 mock 里写死的树形(`DIRECT_DEPENDENCY_INDEXES` + `TRANSITIVE_DEPENDENCY_EDGES`);真实接口接入时后端需返回 nodes/edges,depth 由前端 BFS 兜底计算
- G6 v5 内置扩展(antv-dagre / tooltip / minimap / hover-activate)随 `@antv/g6` 主包默认注册,无需手动 register

---

## [2026-06-17] 图表 composable 代码评审修复（Bug 1 & 2）

### 改了什么

- `useECharts.ts`：修复数据更新时每次 `clear()` + `notMerge` 重放进场动画导致的闪烁（Bug 1）
- `useECharts.ts`：`setOption()` 去掉 `notMerge` 参数，调用方不再需要关心合并策略
- 7 个图表组件同步去掉 `setOption(..., true)` 的第二个实参（环形率、AI 解析覆盖、漏洞来源排行、采集方式分布、分类覆盖、风险玫瑰饼、趋势折线）
- `useG6Graph.ts`：补齐与 `useECharts` 一致的生命周期（Bug 2）

### 怎么实现的

- `useECharts` 用 `hasRenderedSinceInit` 标记当前实例是否已渲染首帧：
  - 首帧 `setOption(option, { notMerge: true })` → 从 0 播放进场动画
  - 后续更新 `setOption(option, { notMerge: false, replaceMerge: ['series'] })` → 复用 ECharts 内置补间动画做平滑过渡，`replaceMerge` 同时清掉数量变化后残留的旧 series（避免幽灵 series）
  - `initChart` 重置 `hasRenderedSinceInit = false`，切回页面重建实例时进场动画会重新播放
- `useG6Graph` 改造：`nextTick(initGraph)`、`onActivated`/`onDeactivated`/`onUnmounted` 统一销毁、`ResizeObserver → graph.resize()` 容器自适应、缓存 `lastData` 在重建时重放（G6 v5 已确认存在 `resize()` / `setData` / `render` / `destroy`）

### 注意事项

- 轮询/动态数据刷新场景下，现在更新走 merge，不会再整图重绘闪烁；如确需强制整图重置，应 dispose 后重建实例
- `replaceMerge: ['series']` 只替换 series 组件，grid / axis / legend 保持稳定；轴的 `data` 数组本身是整体替换，分类变化可正常更新
- G6 目前仍只有占位组件，本次仅统一 composable，未接入真实图

---

## [2026-06-17] ECharts 生命周期 · 首帧动画重放

### 改了什么

- `useECharts.ts`：缓存最近一次 `setOption`，即使组件先调用 `setOption`、ECharts 实例后初始化，也不会丢配置
- `useECharts.ts`：在浏览器下一帧写入 option，并在 `notMerge` 时先 `clear()`，让首次绘制动画能重新触发
- `useECharts.ts`：补充 `onActivated` / `onDeactivated`，兼容后续页面使用 KeepAlive 时的切出销毁、切回重建

### 怎么实现的

- `setOption()` 先保存 `lastOption` 和 `lastNotMerge`，如果实例未就绪就等待 `initChart()` 后重放
- `onUnmounted` 和 `onDeactivated` 都会断开 `ResizeObserver` 并 `dispose()` 图表实例
- 本地运行验证：覆盖统计页进入时有 3 个 ECharts 实例，切到首页后覆盖统计实例消失，切回覆盖统计后生成新的 3 个实例 ID

### 注意事项

- 当前布局没有使用 `KeepAlive`，但 composable 已兼容该场景；图表占位组件仍不涉及 ECharts 生命周期

---

## [2026-06-17] ECharts 全局绘制动画

### 改了什么

- `LineAreaTrendChart.vue`：折线 / 面积趋势图增加从左到右的绘制动画
- `RiskRosePieChart.vue`、`AutonomyRateRing.vue`：饼图 / 环形图增加扇区展开动画
- `CoverageCategoryRateChart.vue`、`CoverageCollectionMethodChart.vue`、`VulnKnowledgeRiskSummary.vue`、`AiParseCoverageBar.vue`：柱状图、堆叠柱、水平进度条增加从 0 增长的动画
- `CoverageCategoryRateChart.vue`、`CoverageCollectionMethodChart.vue`：右侧 legend 改为垂直居中显示

### 怎么实现的

- 在 ECharts option 顶层统一启用 `animation`、`animationDuration`、`animationEasing`，让初次绘制有过渡
- 饼图 series 使用 `animationType: 'expansion'`；柱图和堆叠柱通过默认 bar 动画从 0 增长，并对部分 series 做轻微 `animationDelay`
- 自主率环心文字的 ECharts graphic 文本对齐属性改为 `align` / `verticalAlign`，避免旧属性带来类型问题

### 注意事项

- 本次只调整前端图表表现，无 API / mock 变更；占位图组件未处理动画

---

## [2026-06-17] 覆盖统计图表 · Legend 右置与采集方式散点

### 改了什么

- `CoverageCollectionMethodChart.vue`：采集方式图表画布高度从 280 调到 336，让下方表格更贴近模块底部
- `CoverageCollectionMethodChart.vue`：成功率从折线改为散点，只用点表达每种采集方式的成功率
- `CoverageCollectionMethodChart.vue` / `CoverageCategoryRateChart.vue`：legend 改为右侧纵向展示，避免和图表主体挤在一起

### 怎么实现的

- 通过 ECharts `grid.right` 给右侧 legend 预留空间，`legend.orient = 'vertical'` 控制纵向布局
- 成功率 series 从 `line` 改为 `scatter`，继续绑定右侧 0–100% 成功率 Y 轴

### 注意事项

- 本次只调整图表视觉表现，无 API / mock 字段变更

---

## [2026-06-17] 覆盖统计采集方式分布 · 堆叠柱与成功率折线

### 改了什么

- `CoverageCollectionMethodChart.vue`：新增采集方式分布组合图，替换原占位图
- `KnowledgeCoverage.vue`：接入采集方式图表，表格保留原来的项目数 / 成功率 / 平均耗时
- `CollectionMethodCoverageStat`：增加 `categoryCounts`，用于展示每种采集方式下的分类构成
- `coverageCollectionMethodStats.ts`：mock 补充仿真框架 / 数值计算 / 工具链的项目数分布

### 怎么实现的

- 图表左 Y 轴展示项目数，按分类做堆叠柱；右 Y 轴展示成功率，用折线叠加在同一张图里
- 图表实例仍通过 `useECharts` 管理初始化、ResizeObserver 和卸载销毁，避免图表页内存泄漏
- 页面只调用 `getCollectionMethodCoverageStats()`，mock 数据仍只放在 `src/mock/modules/knowledge/`

### 注意事项

- 真实接口需要返回 `categoryCounts: { category, projectCount }[]`，并保证分类项目数合计与 `projectCount` 对齐

---

## [2026-06-17] 覆盖统计分类覆盖 · 恢复竖向分组柱

### 改了什么

- `CoverageCategoryRateChart.vue`：分类覆盖从横向条形图恢复为竖向分组柱状图

### 怎么实现的

- X 轴恢复为分类名称，Y 轴恢复为 0–100% 百分比
- 保留此前确认的视觉设置：柱宽 26、同组两柱间距 55%、不显示柱顶数值、顶部 legend 区分两个率

### 注意事项

- 本次只调整图表方向，无 API / mock 变更

---

## [2026-06-17] 覆盖统计 · 分类横向条与周列表滚动

### 改了什么

- `CoverageCategoryRateChart.vue`：分类覆盖从竖向分组柱改为横向分组条，Y 轴显示分类，X 轴显示 0–100%
- `KnowledgeCoverage.vue`：待补全清单分页从 8 条恢复为 6 条
- `CoverageUpdateWeekList.vue`：更新趋势摘要列表一次性接收 6 周数据，但容器只显示约 3 行，剩余内容通过内部滚动查看

### 怎么实现的

- 横向条形图切换 `xAxis: value`、`yAxis: category`，保留两个百分比指标和顶部 legend
- 周列表通过 `max-height` + `overflow-y: auto` 实现前端内部滚动，不触发二次请求

### 注意事项

- 本次无 mock 数据结构变更；`API.md` 已恢复待补全清单为 6 条/页

---

## [2026-06-17] 覆盖统计分类覆盖 · 柱宽与标签微调

### 改了什么

- `CoverageCategoryRateChart.vue`：柱宽从 18 调整为 26，圆角同步加大
- `CoverageCategoryRateChart.vue`：同一分类下两根柱子的间距加大
- `CoverageCategoryRateChart.vue`：移除柱顶百分比数值，只保留 tooltip 查看详情

### 怎么实现的

- 通过 ECharts `barWidth` / `barGap` 控制柱宽和分组间距，删除 series 的 label 配置

### 注意事项

- 本次只调整图表视觉参数，无 API / mock 变更

---

## [2026-06-17] 覆盖统计分类覆盖 · 百分比分组柱状图

### 改了什么

- `CoverageCategoryRateChart.vue`：新增分类覆盖图，使用竖向分组柱状图展示目录覆盖率 / 漏洞映射率
- `KnowledgeCoverage.vue`：将「分类覆盖」占位替换为 `CoverageCategoryRateChart`

### 怎么实现的

- X 轴展示分类（仿真框架 / 数值计算 / 工具链），Y 轴固定 0–100%
- 顶部 legend 区分「目录覆盖率」和「漏洞映射率」，不在图里展示项目数和版本数
- 图表通过 `useECharts` 管理生命周期，数据来自已有 `getCategoryCoverageStats()`

### 注意事项

- 本次只替换分类覆盖图展示形式，无 API / mock 变更；采集方式分布仍保持占位

---

## [2026-06-17] 覆盖统计更新趋势 · 纯折线、全周标签和右侧图例

### 改了什么

- `LineAreaTrendChart.vue`：新增 `showArea` / `showLegend` / `showAllXAxisLabels` 配置
- `CoverageUpdateTrendChart.vue`：更新趋势改为纯折线，X 轴显示 W15–W20 全部周标签，右侧显示三条线的 legend
- `KnowledgeCoverage.vue`：待补全清单分页从 6 条改为 8 条

### 怎么实现的

- 首页继续使用默认面积图；覆盖统计通过 props 关闭面积、开启右侧 legend 和全量 X 轴标签
- 待补全清单只调整 `usePaginatedList` 的 `pageSize`

### 注意事项

- 本次无 mock 结构变更；`API.md` 已把待补全清单备注更新为 8 条/页

---

## [2026-06-17] 覆盖统计更新趋势 · 复用通用折线面积图

### 改了什么

- `LineAreaTrendChart.vue`：从首页自主率趋势抽出通用低饱和折线面积图，支持多序列、首尾 X 轴强制显示和空态
- `AutonomyTrendChart.vue`：改为复用 `LineAreaTrendChart`，自身只负责标题和自主率数据映射
- `CoverageUpdateTrendChart.vue`：新增覆盖统计更新趋势图，展示近 6 周「新增项目 / 目录补全 / 漏洞映射更新」三条趋势线
- `KnowledgeCoverage.vue`：将更新趋势占位替换为 `CoverageUpdateTrendChart`，分类覆盖和采集方式占位保持不动
- `types/knowledge.ts` / `coverageUpdateTrend.ts`：为 `CoverageUpdateTrendWeek` 增加三项数值字段，并补齐 6 周 mock

### 怎么实现的

- 通用组件内部统一使用 `useECharts` 管理 init / resize / dispose
- 更新趋势 API 仍沿用 `getCoverageUpdateTrendWeeks()`，只是 mock 和类型补充了可画图的结构化数值

### 注意事项

- 分类覆盖和采集方式分布图本次未实现，等后续确认样式后再接入

---

## [2026-06-17] 首页自主率趋势图 · 坐标轴与视觉降噪

### 改了什么

- `AutonomyTrendChart.vue`：标题改为「近30日自主率趋势」
- `AutonomyTrendChart.vue`：X 轴强制展示首日、末日和少量中间日期，避免今日日期被隐藏
- `AutonomyTrendChart.vue`：加大 grid 留白和坐标轴 label 间距，缓解 X / Y 轴文字重叠
- `AutonomyTrendChart.vue`：折线颜色改为低饱和蓝，并移除 80% 绿色参考线

### 怎么实现的

- X 轴 `axisLabel.interval` 改为函数：首尾必显，中间每 6 个点显示一次
- 折线保留轻微面积填充，用更浅的蓝色降低视觉噪声

### 注意事项

- 本次只调整首页趋势图展示，无 API / mock 变更

---

## [2026-06-17] 漏洞知识库风险摘要 · 左右图表补充小标题

### 改了什么

- `VulnKnowledgeRiskSummary.vue`：左侧玫瑰图新增「风险等级分布」小标题
- `VulnKnowledgeRiskSummary.vue`：右侧条形图新增「高危来源排行」小标题

### 怎么实现的

- 在左右 `a-col` 顶部增加轻量标题行，并同步把两侧图表高度调整为 252px，避免标题挤压图表区域

### 注意事项

- 本次仅调整展示文案和布局，无 API / mock 变更

---

## [2026-06-17] 漏洞知识库风险摘要 · 右侧条形图容器常驻

### 改了什么

- `VulnKnowledgeRiskSummary.vue`：右侧高危来源排行的 ECharts 容器不再被 `v-if="hasData"` 包住
- 空态改为在无数据时额外显示，不影响左右图表容器挂载

### 怎么实现的

- 原因是 `useECharts` 在组件 `onMounted` 阶段初始化实例；之前整行图表在数据返回前不渲染，`barChartRef` 为空，导致右侧条形图没有实例
- 修复后 `a-row` 和 `barChartRef` 常驻，数据返回后 `renderBarChart()` 能正常 `setOption`

### 注意事项

- 本次只修复图表生命周期，无 API / mock 变更

---

## [2026-06-17] 漏洞知识库风险摘要 · 玫瑰饼图 + 高危来源排行

### 改了什么

- `RiskRosePieChart.vue`：从首页漏洞分布抽出通用低饱和玫瑰饼图，统一使用 `useECharts`
- `VulnRiskDistributionChart.vue`：首页右侧图改为复用 `RiskRosePieChart`
- `VulnKnowledgeRiskSummary.vue`：替换占位，左侧展示高/中/低风险总量玫瑰饼图，右侧展示各来源高危漏洞数量横向条形图
- `api/knowledge.ts`：新增 `getVulnRiskSummary`
- `types/knowledge.ts`：新增 `VulnRiskSummary` 等图表类型
- `mock/modules/knowledge/vulnRiskSummary.ts`：新增风险摘要 mock，数据与顶部总数 8,420 / 高危 312 对齐
- `utils/vulnRiskLevel.ts`：抽出高/中/低风险低饱和配色、标签与排序

### 怎么实现的

- 风险摘要组件挂载后调用 `getVulnRiskSummary()`，页面不直接读 mock
- 左侧玫瑰图展示全库高危 / 中危 / 低危数量；右侧条形图按来源 `high` 倒序展示，tooltip 展示来源总数、高危占比和最近同步时间
- 通用玫瑰饼图内部保持图表容器常驻，数据到达后 `setOption`，避免异步数据导致 ECharts 初始化失败

### 注意事项

- 真实接口规划：`GET /api/knowledge/vulnerabilities/risk-summary`
- 当前右侧条形图只做高危排行；如果后续要展示中/低危构成，可改为堆叠条形图

---

## [2026-06-17] 首页漏洞风险分布 · 改为玫瑰饼图与低饱和配色

### 改了什么

- `VulnRiskDistributionChart.vue`：从环形图改为 `roseType: 'radius'` 的玫瑰饼图，数量越多扇区半径越大
- `VulnRiskDistributionChart.vue`：总数从环心挪到卡片标题右侧，hover 时用 tooltip 展示风险等级、数量和占比
- `dashboardVulnRisk.ts`：高危 / 中危 / 低危颜色改为更低饱和度的红、黄、绿

### 怎么实现的

- 饼图开启外侧标签和引导线，保留三档风险等级排序
- `useECharts` 生命周期不变，只调整 option 配置与标题 slot

### 注意事项

- 本次只调整展示形式和颜色，无 API / mock 数据变更

---

## [2026-06-17] 首页图表空白修复 · 保持 ECharts 容器常驻

### 改了什么

- `AutonomyTrendChart.vue`：图表 DOM 改为始终渲染，空态只做覆盖层
- `VulnRiskDistributionChart.vue`：同样保持环图容器常驻，避免初始化时 `ref` 为空

### 怎么实现的

- 原因是页面首次渲染时图表数据还没返回，组件里的 `v-if/v-else` 把 `ref` 容器移除了；`useECharts` 在 `onMounted` 时拿不到 DOM，就不会初始化实例
- 修复后图表容器先挂载，数据回来后 `watch` 正常 `setOption`

### 注意事项

- 本次只改图表生命周期和空态覆盖层，无 API / mock 变更

---

## [2026-06-17] 首页仪表盘 · 自主率趋势折线与漏洞风险环形图

### 改了什么

- `AutonomyTrendChart.vue`：近 30 天平台平均自主率折线（`useECharts`，80% 参考虚线）
- `VulnRiskDistributionChart.vue`：高危 / 中危 / 低危三档环形图，环心展示漏洞总数
- `Dashboard.vue`：替换 `ChartPlaceholder`，并行拉取两个图表接口
- `api/dashboard.ts`：`getAutonomyTrend`、`getVulnerabilityDistribution`
- `types/dashboard.ts`：趋势与分布类型；`utils/dashboardVulnRisk.ts`：三档颜色/标签
- mock：`dashboard/autonomyTrend.ts`、`dashboard/vulnerabilityDistribution.ts`

### 怎么实现的

- 折线：X 轴 MM-DD（30 点），Y 轴自主率 %，单系列平滑折线 + 圆点
- 环图：`radius ['48%','72%']`，右侧图例，环心 graphic 显示 total（与 overview 漏洞数 23 一致）
- mock 趋势末点 87.6% 与统计卡「平均自主率」对齐

### 注意事项

- 风险等级采用三档（high / medium / low），与开源风险任务口径一致
- 真实 API：`GET /api/dashboard/autonomy-trend?days=30`、`GET /api/dashboard/vulnerability-distribution`

---

## [2026-06-17] AI 解析结果抽屉 · 覆盖率条、License 树与冲突列表

### 改了什么

- `AiParseResultDrawer.vue`：抽屉打开时请求 `getAiParseResultDetail`；顶栏 AI 解析完成/扫描深度/完成时间；ECharts 覆盖率条；License 树；潜在冲突列表
- `AiParseCoverageBar.vue`：左侧「AI解析覆盖率 xx%」+ 右侧 ECharts 水平进度条（`useECharts`，抽屉 `destroy-on-close` 自动 dispose）
- `LinuxStyleFileTree`：新增 `initialExpandMode="all"`、`selectable=false`；节点支持 `licenseLabel` / `licenseTagColor` Tag
- `types/detect.ts`：`AiParseResultDetail`；`types/fileTree.ts`：License Tag 字段
- `api/detect.ts`：`getAiParseResultDetail`；`mock/.../aiParseResultDetail.ts`

### 怎么实现的

- 点击「查看结果」打开抽屉 → `watch(open + taskId)` 拉取详情
- License 树复用 `LinuxStyleFileTree`，默认全部展开、不可选中；每行（含目录）右侧 `a-tag` 展示许可证
- 覆盖率 93% 等为结果字段 `aiParseCoverage`，非任务执行进度

### 注意事项

- mock 目前仅 `ai-parse-001`、`ai-parse-004` 有完整结果；其余 completed 任务需补 mock 或会空态
- 真实 API 规划 `GET /api/detect/ai-parse/tasks/:parseTaskId/result`

---

## [2026-06-17] 证据文件树 · 节点问题率 Tag（对齐原型）

### 改了什么

- `types/fileTree.ts`：`FileTreeNode` 新增可选 `issueRate`（0–100）
- `LinuxStyleFileTreeNode.vue`：有 `issueRate` 时展示橙色 Tag（目录「整体问题率 xx%」，文件「xx%」）
- `utils/fileTree.ts`：`formatFileTreeIssueRateLabel` 等格式化工具
- `mock/.../autonomyEvidenceTree.ts`：各节点补全原型问题率（src 18.2%、solver.cpp 31.6% 等）

### 怎么实现的

- 问题率随 `getAutonomyDetectEvidenceTree` 与树节点一并返回；知识库目录树无 `issueRate` 字段时不显示 Tag，不影响现有页面

---

## [2026-06-17] 自主率检测结果页 · Tab（文件证据 / 来源汇总）与来源定位

### 改了什么

- `AutonomyDetectResult.vue`：统计卡片下增加 `PageNavTabs`（文件证据 / 来源汇总）；移除原型底部来源表与列表视图
- `AutonomyEvidencePanel.vue`：文件证据 Tab（左树右详情，树数据独立拉取）
- `AutonomySourceHitPanel.vue` + `AutonomySourceHitQueryBar` + `AutonomySourceHitTable`：来源汇总 Tab（筛选 + 分页列表 + 定位）
- `LinuxStyleFileTree`：新增 `locateFile` / `locateFileByName` 暴露方法
- `utils/fileTree.ts`：`findFileNodeIdByName`、`collectAncestorDirectoryIds`
- `types/detect.ts`：`AutonomySourceHitItem` 等；`api/detect.ts`：`getAutonomyDetectSourceHitList`
- `mock/modules/detect/autonomySourceHits.ts`：12 条来源汇总 mock（total > pageSize）

### 为什么这么做

底部单独放来源表语义不清；改为 Tab 区分「按文件看证据」与「按知识库来源汇总」。来源汇总支持筛选与定位回文件证据 Tab。

### 怎么实现的

- Tab 1「文件证据」：`AutonomyEvidencePanel` 内 1:3 栅格 + `LinuxStyleFileTree`
- Tab 2「来源汇总」：`ListQueryBar`（来源项目关键词 + 风险等级）+ `ListTable` 分页；列含来源知识库项目/版本/命中文件/许可证/风险等级/操作
- 「定位」：父页切 Tab → `nextTick` → `evidencePanelRef.locateFileByName(首个命中文件)`，树展开祖先目录并高亮
- 来源列表 Tab 首次可见时 lazy load（`visible` watch）

### 注意事项

- 定位默认高亮该行 `hitFileNames[0]`；多文件行后续可改为下拉选择
- 真实 API 规划 `GET /api/detect/tasks/:taskId/autonomy/source-hits`

---

## [2026-06-17] 自主率检测结果页 · 相似代码证据文件树（左 1/4 + 右详情占位）

### 改了什么

- `src/views/detect/AutonomyDetectResult.vue`：内容区改为 1:3 栅格；左侧复用 `LinuxStyleFileTree` 展示证据树，右侧「文件详情」占位
- `src/api/detect.ts`：新增 `getAutonomyDetectEvidenceTree(taskId)`
- `src/mock/modules/detect/autonomyEvidenceTree.ts`：mock 证据树（src/solver.cpp 等，对齐原型 M05-S04-P01）

### 为什么这么做

原型检测结果页下方为「相似代码证据文件树 + 文件详情」左右分栏；知识库项目目录页已封装 `LinuxStyleFileTree`，直接复用避免重复实现。

### 怎么实现的

- 页面 `onMounted` 并行拉取 `getAutonomyDetectResultOverview` 与 `getAutonomyDetectEvidenceTree`
- 树数据写入 `treeNodes`，`v-model:selected-file-id` 双向绑定选中文件
- 默认展开/选中：`LinuxStyleFileTree` 内部 `watch(nodes)` 调用 `computeFileTreeDefaultState`，DFS 展开至首个文件所在目录并高亮 `solver.cpp`
- 右侧用 `findFileTreeNodeById` 解析当前选中文件，暂显示「已选中 xxx（文件详情待实现）」

### 注意事项 / 已知限制

- 真实接口规划 `GET /api/detect/tasks/:taskId/autonomy/evidence-tree`
- 树节点暂不含「整体问题率」等扩展字段（当前 `FileTreeNode` 未定义）；后续可扩展类型或业务组件
- 文件详情（代码证据 diff、指纹证据等）待下一迭代

---

## [2026-06-17] 自主率检测结果页 · 顶部总体自主率环形图

### 改了什么

- `src/views/detect/AutonomyDetectResult.vue`：原占位页改为真实页面，顶部展示总体自主率环形图 + 任务/项目信息 + 4 个统计卡片（问题文件数、代码问题、指纹问题、风险自主率）；下方证据树/列表暂留占位
- `src/components/detect/AutonomyRateRing.vue`：新增环形自主率图组件（ECharts 空心环 + 环心百分比）
- `src/utils/autonomyRate.ts`：新增自主率配色阈值工具（<50 红 / 50–80 黄 / ≥80 绿）
- `src/types/detect.ts`：新增 `AutonomyDetectResultOverview` 接口
- `src/api/detect.ts`：新增 `getAutonomyDetectResultOverview(taskId)`
- `src/mock/modules/detect/autonomyResult.ts`：新增结果摘要 mock，自主率覆盖红/黄/绿三档

### 为什么这么做

原型 M05-S04-P01「检测结果」顶部是一个总体自主率圆环，需要用 ECharts 实现空心环形、环心显示百分比，并按自主率高低用红/黄/绿区分。

### 怎么实现的

- 数据来源：页面 `onMounted` 时按路由 `:taskId` 调 `getAutonomyDetectResultOverview`（mock 阶段从任务列表 mock 派生），存入 `overview`，三态用 `PageLoading` + `a-empty` 处理
- 配色集中在 `utils/autonomyRate.ts`，`getAutonomyRateColor(rate)` 返回阈值色，组件与统计共用，避免阈值散落
- 环形图：复用现有 `useECharts` composable（满足 `chart-lifecycle` 生命周期约束，自动 init/dispose/ResizeObserver）；pie `radius:['72%','92%']` 做空心环，自主部分用阈值色、剩余用浅灰，环心用 ECharts `title` 居中显示百分比
- 首帧绘制放在组件自身 `onMounted`（在 useECharts 的 onMounted 之后执行，此时实例已 init），`rate` 变化用 `watch`（非 immediate）重绘——避免 immediate 在实例 init 前 setOption 丢失首帧

### 注意事项 / 已知限制

- `getAutonomyDetectResultOverview` 目前是 mock，真实接口规划 `GET /api/detect/tasks/:taskId/autonomy/overview`，切换时只改函数体
- 取数用路由 `:taskId`（与现有路由参数一致）；若后端确为按任务名称查询，仅需改 API 参数
- 下方「相似代码证据」树状/列表视图、文件详情、来源命中表暂未实现，仅占位
- `AutonomyRateRing` 为 detect 业务组件（非公共组件），可被首页「平均自主率」等场景复用

---

## 公共组件清单（`src/components/common/`，截至 2026-06-18）

共 **22 个**对外 Vue 组件（另含 `LinuxStyleFileTreeNode` 为树内部递归子组件、`linuxStyleFileTreeContext.ts` 为 provide 上下文，业务不直接引用）。引用数为 `src/` 内 `import '@/components/common/<Name>'` 的业务文件数（不含 `components.d.ts`、不含 common 自身互引）。

### 一、页面状态与布局（5 个）

| 组件 | 作用 | 引用约 |
|---|---|---|
| `PageLoading` | 页面/面板 loading 遮罩（`a-spin`），路由切换时全局遮罩也可用 | 44 处 |
| `ListEmptyGuide` | 列表空态 + 可选跳转引导 | 26 处 |
| `PageNavTabs` | 详情页 Tab 导航 | 4 处（项目详情、自主率/开源风险详情、告警中心） |
| `StatCard` | 单张统计卡（标签 + 数值 + 可选对比行） | 13 处 |
| `StatCardRow` | 多张 `StatCard` 横向排列 | 9 处 |

### 二、列表页体系（4 个）

| 组件 | 作用 | 引用约 |
|---|---|---|
| `ListQueryBar` | 统一查询区卡片（查询/重置 + `#extra-actions` 插槽） | 20 处 |
| `ListTable` | 封装 `a-table`（分页、横向滚动、`rowClassName`、默认 `bodyCell`） | 25 处 |
| `ListTableCell` | 单元格默认渲染（按列配置省略号或 `—`） | 随 `ListTable` |
| `EllipsisText` | 超长文本单行省略 + tooltip | 3 处 |

### 三、表单与远程数据（4 个）

| 组件 | 作用 | 引用约 |
|---|---|---|
| `UserSearchInput` | 防抖搜用户，候选列表点选 | 4 处 |
| `AsyncOptionsSelect` | 展开下拉时请求选项（部门/项目/知识库版本等） | 11 处 |
| `TagInput` | 回车添加标签、可删除 | 3 处 |
| `SourceIngestForm` | 源码入库（仓库拉取 / 上传包 + 凭据联动） | 4 处 |

### 四、向导与表单操作（2 个）

| 组件 | 作用 | 引用约 |
|---|---|---|
| `FormStepWizardModal` | 分步向导弹窗壳（步骤条 + 上一步/下一步） | 3 处（创建项目、自主检测任务、添加开源项目） |
| `ProfileFormActions` | 详情 Tab 内保存/取消按钮区 | 3 处（项目基本信息/策略、个人设置） |

### 五、目录树（1 个对外）

| 组件 | 作用 | 引用约 |
|---|---|---|
| `LinuxStyleFileTree` | Linux 风格目录树；`v-model:selected-file-id`；`expandAll` / `collapseToFirstLevel` | 5 处（知识库项目目录、自主率文件证据、AI 解析结果树等） |

配套：`utils/fileTree.ts`、`types/fileTree.ts`。

### 六、详情、代码与时间线（3 个）

| 组件 | 作用 | 引用约 |
|---|---|---|
| `DetailText` | 抽屉/详情中长文本，保留换行 | 9 处 |
| `CodeSnippetBlock` | 黑底等宽代码块（日志节选、规则命中代码片段） | 2 处（日志详情、命中追溯详情） |
| `ChainTimeline` | `a-timeline` 链路时间线（`time` + `message` 条目） | 2 处（日志详情、告警处理时间线弹窗） |

### 七、图表（2 个）

| 组件 | 作用 | 引用约 |
|---|---|---|
| `LineAreaTrendChart` | 低饱和折线/面积趋势图（可配置图例、面积填充） | 2 处（首页自主率趋势、覆盖统计更新趋势） |
| `RiskRosePieChart` | 玫瑰饼图（风险档位分布） | 2 处（首页漏洞环图、漏洞库风险摘要） |

内部封装 `useECharts`，页面只传数据与配色。

### 八、通用弹窗（1 个）

| 组件 | 作用 | 引用约 |
|---|---|---|
| `BoundCountDeleteModal` | 删除前绑定数校验二次确认 | 3 处（用户/角色/部门） |

### 新增组件速查（相对 2026-06-16 版）

| 组件 | 引入时间 | 典型场景 |
|---|---|---|
| `LineAreaTrendChart` | 2026-06-17 前后 | 仪表盘/覆盖统计趋势 |
| `RiskRosePieChart` | 2026-06-17 前后 | 风险分布玫瑰图 |
| `CodeSnippetBlock` | 2026-06-18 | 日志/策略命中代码展示 |
| `ChainTimeline` | 2026-06-18 | 日志链路、告警处置时间线 |

### 配套公共能力（非 `common/` 组件，常与上面一起用）

| 类型 | 路径 | 说明 |
|---|---|---|
| Loader 工具 | `src/utils/remoteSelectLoaders.ts` | 部门/检测项目/知识库项目与版本下拉 |
| 文件树工具 | `src/utils/fileTree.ts` + `src/types/fileTree.ts` | 默认展开路径、关键字过滤、展开/折叠 map |
| 上传 composable | `src/composables/useSingleFileUpload.ts` | 单文件拖拽上传校验 |
| 文件工具 | `src/utils/fileUpload.ts` | accept 后缀、扩展名校验 |
| 源码入库 | `src/types/sourceIngest.ts` + `src/utils/sourceIngest.ts` | 与 `SourceIngestForm` 配套 |
| 列表分页 | `src/composables/usePaginatedList.ts` / `useFilteredPaginatedList.ts` | 列表页分页 + 筛选 |
| 详情返回 | `src/components/layout/PageBackButton.vue` + `usePageBack` + `useRouteWithFrom` | 顶栏返回与 `from` query |
| 图表生命周期 | `src/composables/useECharts.ts` / `useG6Graph.ts` | ECharts / G6 封装（业务图表组件内部使用） |
| 轮询 | `src/composables/usePolling.ts` | 任务进度等定时刷新 |
| 统计卡映射 | `src/utils/statCard.ts` | 各模块概览 API 数据 → `StatCardItem[]` |

### 抽取原则

- 仅当 **≥2 个业务页面/模块** 复用同一 UI 块时放入 `common/`；单模块专用放 `components/<模块>/`（如 `AutonomyRateRing` 在 detect）
- 新公共组件需在本文档本节补充一行，并在顶部工程师日志记一笔

---

## [2026-06-16] 知识库 · 目录树展开/折叠 + 列表修复 + 分版本 mock

### 改了什么

- **修复知识库列表空白**：`api/knowledge.ts` 误删 `MOCK_ALL_KB_PROJECTS` import，导致 `getKbProjectList` 运行时报错、列表无法渲染
- **筛选区**：重置右侧新增「展开全部」「折叠全部」（`ListQueryBar` `#extra-actions`）
- **`LinuxStyleFileTree`**：暴露 `expandAll()` / `collapseToFirstLevel()`（折叠至仅第一级根目录展开）
- **`projectDirectoryTree.ts` 重写**：按 `kbProjectId` + `versionId` 返回不同目录结构（OpenFOAM / Eigen / fmt / Deal.II / PETSc 等各有差异；同项目不同版本文件数/目录也有区别）

### 注意事项

- 「折叠全部」= 仅第一级根目录展开，其下子目录全部收起
- 切换版本后目录树会整体替换，节点 ID 带版本前缀避免选中态串扰

---

## [2026-06-16] 知识库 · 项目目录树（公共组件 LinuxStyleFileTree）

### 改了什么

- **`LinuxStyleFileTree.vue` + `LinuxStyleFileTreeNode.vue`**（`components/common/`）：Linux 风格目录树公共组件；目录 `name/` + ▸▾ 展开收起；文件点击高亮；`v-model:selected-file-id`；数据变化时默认展开至首个文件并选中
- **`utils/fileTree.ts`**、**`types/fileTree.ts`**：默认展开路径、关键字过滤、按 ID 查找节点
- **`mock/modules/knowledge/projectDirectoryTree.ts`** + **`getKbProjectDirectoryTree()`**：OpenFOAM（kb-001）对齐原型目录结构
- **`KbProjectDirectory.vue`**：筛选区下方 1:3 布局（左树右详情占位）；查询/重置刷新目录树

### 注意事项

- 右侧文件详情仅占位，选中文件后显示文件名提示
- 关键字检索在 mock 层过滤树节点（目录名 / 文件名 / MD5）
- 其他项目使用通用简化目录 mock

---

## [2026-06-16] 知识库 · 项目目录页统计卡片 API 兜底

- **`KbProjectDirectory.vue`**：无 `history.state.kbProject` 时调用 `getKbProjectDetail(kbProjectId)` 填充顶部 5 项统计卡片；加载中包 `PageLoading`
- 版本默认 label 同步改用 `projectContext.latestVersion`

---

## [2026-06-16] 知识库 · 项目目录页调整（去掉项目下拉 + 顶部统计卡片）

### 改了什么

- **`KbProjectDirectory.vue`**：顶部 `StatCardRow` 5 项（项目名称 / 最新版本 / 采集方式 / 分类 / 最近更新），数据来自 `history.state.kbProject`；筛选区仅保留版本 + 关键字
- **`KbProjectDirectoryQueryBar.vue`**：移除项目 `AsyncOptionsSelect`
- **`KbVersionManage.vue` / `KbVersionTable` / `KbVersionActionCell`**：跳转目录时一并携带 `kbProject`，保证从版本管理进入也有统计卡片数据

### 注意事项

- 统计卡片优先 `history.state.kbProject`；直接刷新 URL 时由 `getKbProjectDetail` API 兜底
- 项目固定在路由 `:kbProjectId`，不再支持页内切换项目

---

## [2026-06-16] 知识库 · 项目目录页筛选区（M03-S03-P01 · 上部）

### 改了什么

- **`KbProjectDirectory.vue`**：替换占位页，实现顶部筛选区（目录树 / 文件详情区域待后续迭代）
- **`KbProjectDirectoryQueryBar.vue`**：复用 `ListQueryBar` + 两个 `AsyncOptionsSelect`（项目 / 版本）+ 关键字输入
- **`api/knowledge.ts`**：新增 `getKbProjectSelectOptions`、`getKbVersionSelectOptions`
- **`utils/kbProjectDirectoryQuery.ts`**、**`utils/remoteSelectLoaders.ts`**：筛选表单与下拉 loader
- **`KbProjectActionCell` / `KbVersionActionCell`**：跳转时经 `useRouteWithFrom` 附加 `from`，顶栏 `PageBackButton` 可返回列表

### 怎么实现的

- 项目默认：路由 `:kbProjectId` + 列表经 `history.state.kbProject` 携带；下拉异步拉取全部知识库开源项目（与项目管理 `projectId` 无关）
- 版本默认：版本管理跳转带 `state.kbVersion` / `query.versionId`；否则取 `getKbVersionOverview` 的当前基线；下拉拉取该项目全部版本
- 切换项目时 `router.push` 到新 `:kbProjectId` 并保留 `from` query；关键字 placeholder 对齐原型「目录、文件名或哈希」
- 查询 / 重置已写入 `appliedQuery`（供后续目录树 API 对接）；下方内容区尚未实现

### 注意事项

- 直接刷新 URL 时无 navigation state，项目 / 版本 label 依赖下拉 prefetch + 概览 API
- 目录树、展开/折叠全部、文件详情等待下一迭代

---

## [2026-06-15] AI 辅助分析 · AI 解析页

- 路由 `/detect/ai-analysis` → `AiAnalysis.vue`：开始解析弹窗 + 筛选 + 分页历史列表
- 弹窗：`AsyncOptionsSelect` 关联项目 + `SourceIngestForm` + 扫描深度；`createAiParseTask` 提交后列表新增「进行中」
- 筛选：来源 / 状态；操作：已完成→结果抽屉（占位）、失败→规则回退弹窗（蓝色 info 提示 + 无分页对比表 + 必选回退原因）
- mock：`mock/modules/detect/aiParseTasks.ts`

---

## [2026-06-15] 开源风险详情 · 组件忽略 / 撤销忽略

- 操作「忽略」→ `RiskComponentIgnoreModal`：原型文案 + 必选忽略原因 → `ignoreOpenSourceRiskComponent`
- 已忽略行：整行灰色、组件名后「（已忽略）」、操作改为「撤销忽略」→ `RiskComponentRevokeIgnoreModal` → `revokeOpenSourceRiskComponentIgnore`
- 筛选新增勾选框「显示已忽略组件」（默认不勾选，列表不含已忽略项；勾选后 `includeIgnored=true`）
- 忽略后顶部「识别组件」统计 -1（mock 与 `getOpenSourceRiskDetailSummary` 联动）；「待处理」卡片文案改为「待处理漏洞」
- mock 忽略状态存于 `openSourceRiskComponents.ts` 内存 Map，刷新页面会重置

---

## [2026-06-16] 开源风险详情 · 漏洞风险 Tab

- `OpenSourceRiskVulnerabilityPanel`：`ListQueryBar` + 分页 `ListTable`
- 筛选：CVE 编号、风险等级（低/中/高）、组件、处理状态（待处理/需复核/已验证）
- 列：CVE、组件、版本、风险等级、CVSS、状态、识别来源、操作（详情/跟踪/忽略占位）
- API：`getOpenSourceRiskVulnerabilityList`

---

## [2026-06-16] 开源风险详情 · 组件清单 Tab

- 顶部 6 项摘要改为一行 6 列，窄屏逐级折行
- 组件清单：依赖关系图占位（后续 ECharts）+ `ListQueryBar` 筛选 + `ListTable` 分页
- 筛选：组件名、来源（项目扫描/导入 SBOM）、风险等级（低/中/高）
- API：`getOpenSourceRiskComponentList`
- 组件详情抽屉：`getOpenSourceRiskComponentDetail`；「查看漏洞」跳转漏洞 Tab 并筛选组件名

---

## [2026-06-16] 开源风险检测详情页（骨架）

- 路由 `/detect/tasks/:taskId/risk` → `OpenSourceRiskDetail.vue`
- 顶部 6 项摘要（4 列 × 2 行）：数据优先来自列表 `history.state.task`
- 统计卡片：`getOpenSourceRiskDetailSummary`（识别组件/高危漏洞/待处理/许可证风险）
- Tab：组件清单 / 漏洞风险 / SBOM 导出与对比（内容占位）
- 顶栏返回：`PageBackButton`（面包屑 ≥3 级自动显示）；列表跳转带 `from` query

---

## [2026-06-15] 项目详情 · 检测策略 Tab + 创建成功留列表

- **创建项目成功**：刷新列表，不再跳转详情页
- **检测策略 Tab**（`ProjectPolicyPanel`）：字段与创建向导「绑定策略」一致；默认回显已绑策略、阈值、排除目录
- 底部复用 `ProfileFormActions`：「更新检测策略」/「取消修改」
- API：`getProjectPolicyBinding`、`updateProjectPolicyBinding`；种子项目 mock 自动初始化绑定

---

## [2026-06-15] 新增项目 · 交付物「稍后上传」

- 第三步类型选择新增 **稍后上传**：选中后直接可确认创建，`deliverables` 传空数组
- 交付物可在项目详情 · 交付物 Tab 后续补传

---

## [2026-06-15] 新增项目向导 · 内联交付物 + 部门必填

- 基本信息：**所属部门改为必填**
- 第三步：进入即显示**交付物类型选择**，选中后在向导内展示对应表单（源码 / 二进制），无「添加交付物」按钮、无独立弹窗
- 新组件 `ProjectDeliverableInlineForm`；项目详情页仍用 `ProjectDeliverableAddBar` + 弹窗

---

## [2026-06-15] 新增项目三步向导 + FormStepWizardModal 公共组件

### 改了什么

- **`FormStepWizardModal`**：抽离步骤条 / 内容区 / 底部按钮，供自主率任务、知识库添加、**新增项目**复用
- **`ProjectCreateWizardModal`**：① 基本信息 ② 绑定策略（`AsyncOptionsSelect` + 阈值/匹配长度/`TagInput` 排除目录）③ 上传交付物（`ProjectDeliverableAddBar` collectOnly）
- **`createProject`** 改为接收 `CreateProjectWizardParams`（含 policy + deliverables），mock 写入策略绑定、负责人成员、交付物
- 交付物弹窗支持 **`collectOnly`**，向导内只收集数据、最后统一提交
- **`AutonomyDetectTaskCreateModal`** / **`KbProjectAddModal`** 已改用 `FormStepWizardModal`

### 注意事项

- 创建项目必须：选策略 + 至少 1 项交付物；无「默认策略」
- 联调：`POST /api/projects` 需接收完整 wizard body

---

## [2026-06-15] 项目详情 · 基本信息 Tab（可编辑表单）

### 改了什么

- **`ProjectBasicInfoPanel.vue`**：项目名称只读；负责人 `UserSearchInput` + `searchUsers`；说明 textarea；状态下拉（进行中/已完成/失败）；提交 `updateProjectBasicInfo`
- 布局：第一行项目名称 + 负责人并排；第二行左侧项目说明、右侧所属部门 + 状态
- **`ProfileFormActions.vue`**：从个人设置抽出「更新基本信息 / 取消修改」按钮，`ProfileBasicPanel` 已复用
- **`Project` 类型**：新增 `ownerUserId`、`departmentId`；mock 种子补全说明并与人/部门 ID 对齐
- **`getEnabledUserOptions`** + `loadEnabledUserSelectOptions`：负责人下拉数据源

### 怎么实现的

- 详情页优先用列表 `history.state.project` 填充，无需单独请求基本信息
- 进入 Tab 时 `prefetchOptions` 保证当前负责人/部门显示正确
- 更新成功后 `emit('updated')` 同步顶部 StatCard 摘要

### 注意事项

- 联调：`PUT /api/projects/:projectId/basic-info`
- 检测策略 Tab 仍为占位

---

## [2026-06-15] 公共用户搜索 + 远程下拉组件

### 改了什么

- **`UserSearchInput.vue`**：防抖输入搜用户，`v-model` 为 `UserSearchCandidate | null`；搜索逻辑由父组件传入
- **`AsyncOptionsSelect.vue`**：首次展开下拉时调 `loadOptions()`；支持 `prefetchOptions` / `resetOptions` / `getSelectedLabel`
- **`remoteSelectLoaders.ts`**：部门（注册/个人设置/用户管理）、检测任务关联项目的统一 loader
- **`searchUsers()`** API + mock `searchMockUsers`
- 接入：**`ProjectFormModal`**（负责人 + 部门）、**`ProjectAddMemberModal`**（排除已在项目成员）、**`LoginPage`** 注册部门、**`UserFormModal`** / **`ProfileBasicPanel`** 部门、**`AutonomyDetectTaskCreateModal`** / **`RiskDetectTaskCreateModal`** 关联项目

### 怎么实现的

- 用户搜索：输入停止 300ms 后请求；添加成员由 `searchProjectMemberCandidates` 过滤，新增项目负责人用 `searchUsers` 不过滤
- 远程下拉：默认懒加载，编辑回填场景在打开弹窗/进入页面时 `prefetchOptions()`
- 检测任务创建：不再打开弹窗即拉项目列表；开源风险弹窗仍打开时拉漏洞库版本

### 注意事项

- 新增项目负责人必须从搜索结果选中；编辑可保留原姓名（未重选时提交原 `ownerName`）
- 联调：`GET /api/system/users/search`、`GET /api/system/departments/options`、`GET /api/detect/tasks/project-options`

---

## [2026-06-15] 知识库 · 版本管理更新（获取更新 / 上传更新包）

### 改了什么

- **`KbVersionFetchModal`**：选「获取更新」后自动请求 `fetchKbVersionUpdate`，loading 期间仅旋转动画；成功展示包大小与预计分钟数 + 后端 `message`；仅「确定」关闭
- **`KbVersionUploadModal`**：拖拽上传 zip/7z/tar.gz，复用 `useSingleFileUpload`；`uploadKbVersionPackage`
- **`KbVersionUpdateBar`** 传入 `kbProjectId`，串联双选与两个子弹窗

### 注意事项

- 联调：`POST .../versions/fetch-update`、`POST .../versions/upload-package`
- 提交后不刷新版本列表

---

## [2026-06-15] 知识库 · 添加开源项目弹窗

### 改了什么

- **`KnowledgeBaseList.vue`** 顶部「添加开源项目」按钮
- **`KbProjectAddModal.vue`**：三步向导（基本信息 → 入库配置 → 补充信息），样式对齐 `AutonomyDetectTaskCreateModal`；复用 **`SourceIngestForm`**、**`TagInput`**
- **`TagInput.vue`**：回车生成 tag、可删除，公共组件
- **`createKbProject`** API + mock（异步处理，不刷新列表）

### 注意事项

- 第二步内容区可滚动，避免小屏溢出

- 联调：`POST /api/knowledge/projects`
- 标签提交为 `string[]`，mock 不落库

---

## [2026-06-15] 项目详情 · 添加源码交付物弹窗 + 公共 SourceIngestForm

### 改了什么

- 新增 **`SourceIngestForm.vue`**（`components/common/`）：来源方式切换、仓库拉取凭据、压缩包上传，供交付物与后续知识库「添加开源项目」复用
- 新增 **`ProjectSourceDeliverableAddModal.vue`**：封装 SourceIngestForm + 扫描路径前缀，提交 `addProjectSourceDeliverable`
- **`types/sourceIngest.ts`**、**`utils/sourceIngest.ts`**：共用类型、校验、扩展名常量
- **`ProjectDeliverableAddBar`**：选「添加源码交付物」打开新弹窗

### 怎么实现的

- 仓库拉取：地址必填（仅 placeholder）；登录方式联动 Token / 用户名密码 / SSH 私钥；匿名访问显示蓝色 info
- 上传源码包：复用 `useSingleFileUpload`，仅允许 zip / 7z / tar.gz
- 扫描路径前缀可选，仅 placeholder，无长文案提示
- 确定后调 API，提示后台解析，不刷新列表

### 注意事项

- 知识库添加开源项目尚未接入 SourceIngestForm，接入时传 `source-mode-label="入库方式"` 即可
- 联调：`POST /api/projects/:projectId/deliverables/add-source`

---

## [2026-06-15] 项目详情 · 交付物类型 Tag + 二进制上传

### 改了什么

- **`ProjectDeliverableTable.vue`**：类型列改为 `a-tag`（源码 purple / 二进制 orange）
- 新增 **`ProjectBinaryDeliverableUploadModal.vue`**：拖拽上传 `.a/.so/.dll`，校验通过后「确定」才可点
- **`ProjectDeliverableAddBar.vue`**：选「上传二进制」后打开上传弹窗；传入 `projectId`
- 公共上传：**`utils/fileUpload.ts`**、**`composables/useSingleFileUpload.ts`**；`VulnSourceImportModal`、`RiskDetectTaskCreateModal` 已复用
- **`api/project.ts`**：`uploadProjectBinaryDeliverable`；mock 在 `projectDeliverables.ts`

### 怎么实现的

- `before-upload` 拦截自动上传，校验后缀；`hasValidFile` 控制确定按钮 disabled
- 确认后调 `uploadProjectBinaryDeliverable`，提示「后台解析中」，**不刷新列表**（等后端解析完成）
- 「添加源码交付物」仍占位，未实现

### 注意事项

- 联调：`POST /api/projects/:projectId/deliverables/upload-binary`，FormData 字段 `file`
- 列表更新需后端解析完成后的推送或轮询，当前 mock 不写入列表

---

## [2026-06-15] 项目详情 · 交付物 Tab

### 改了什么

- 新增 **`ProjectDeliverablesPanel.vue`** 及交付物表格/操作/删除弹窗、**`ProjectDeliverableAddBar.vue`**（双选类型弹窗，样式对齐检测任务创建）
- **`mock/modules/project/projectDeliverables.ts`**：含仓库拉取/上传源码包/上传文件三类 mock
- **`api/project.ts`**：`getProjectDeliverableList`、`getProjectDeliverableDownload`、`deleteProjectDeliverable`
- **`utils/projectDeliverableDisplay.ts`**：来源/类型文案、大小与时间格式化、剪贴板复制

### 怎么实现的

- 添加交付物：双选弹窗（添加源码交付物 / 上传二进制），选中后暂关弹窗，后续表单待做
- 列表 `ListTable` 分页 10 条；仓库类「查看来源」复制 URL 并新标签打开；上传类「下载」点击时调 API 再 `triggerReportDownload`
- 所有项均有红色「删除」，确认文案「是否将该交付物从「xx项目」项目中移除？」

### 注意事项

- mock 仓库 URL 暂为 `https://github.com/`；联调后由列表项 `repositoryUrl` 字段返回
- `proj-002` 有 7 条交付物，可测分页

---

## [2026-06-15] 项目详情 · 项目成员 Tab

### 改了什么

- 新增 **`ProjectMembersPanel.vue`** 及成员表格/操作/三个弹窗组件
- **`mock/modules/project/projectMembers.ts`**：初始成员（负责人 + 额外成员），复用 `MOCK_ALL_USERS`
- **`api/project.ts`**：`getProjectMemberList`、`searchProjectMemberCandidates`、`addProjectMember`、`transferProjectOwner`、`removeProjectMember`
- **`types/project.ts`**：`ProjectMember`、`ProjectMemberCandidate` 等

### 怎么实现的

- 添加成员：输入防抖 300ms 搜索 → 下拉选姓名 → 确认后添加；无匹配显示「没有找到该用户」
- 成员列表：`ListTable` 分页 10 条；负责人无操作，成员可「设为负责人」「移除」
- 更换负责人后同步 `MOCK_ALL_PROJECTS.owner` 并 emit 更新顶部摘要卡片

### 注意事项

- mock 下「结构分析平台」负责人为李四，另有张三、吴九等成员；搜索「张」可测添加流程
- 联调时替换 `api/project.ts` 中 5 个成员相关函数即可

---

## [2026-06-15] 项目详情 · 关联任务 Tab

### 改了什么

- 新增 **`ProjectRelatedTasksPanel.vue`**：左上角「创建检测任务」链至 `/detect/tasks`；下方复用 `DetectTaskTable`（无项目列、有分页、操作列与首页最近任务一致）
- **`api/project.ts`** 新增 `getProjectRelatedTasks()`，mock 阶段委托 `getTaskList({ projectId })` 复用检测任务数据
- **`DetectTaskTable`** 新增 `hideProjectColumn`；**`taskDisplay.ts`** 新增 `DETECT_TASK_TABLE_NO_PROJECT_SCROLL_X`
- **`verifyProjectRelatedTasks()`**：接口返回后二次校验 `projectId` + `projectName` 与当前项目一致

### 怎么实现的

- `ProjectDetail` 在 `activeTab === 'tasks'` 时展示面板；切换 Tab 时 `router.replace` 同步 `?tab=`，避免 Tab 选中态丢失
- 关联任务列表在 `visible` 为 true 时请求，创建按钮用 `router.push` 替代 `router-link`（避免挂载 link 干扰 `history.state`）
- 列与首页最近任务相同：任务名称、检测类型、运行状态、进度、耗时、操作（查看结果/查看日志）
- 每页 10 条，分页器与检测任务列表页一致

### 注意事项

- mock 下 `proj-001`（飞控仿真V2）等有多条关联任务可供验证
- 联调时替换 `getProjectRelatedTasks` 为真实 API 即可，二次校验逻辑可保留

---

## [2026-06-15] 项目管理 · 项目详情页骨架

### 改了什么

- 实现 **`ProjectDetail.vue`**：顶部 4 项项目简介 + 5 个 Tab（内容区占位）
- 新增 **`ProjectDetailSummary.vue`**：复用 `StatCard`，状态项用 `#value` 插槽展示 Tag
- 新增公共 **`PageNavTabs.vue`**，告警中心改为复用该组件
- **`StatCard.vue`** 增加 `#value` 插槽，支持 Tag 等非文本主数值
- **`api/project.ts`** 新增 `getProjectDetail()`；列表「编辑」/ 新建成功跳转经 `history.state.project` 携带数据

### 怎么实现的

- 详情页优先读 `history.state.project`（与 `KbVersionManage` 同模式）；缺失时调 `getProjectDetail` 兜底
- Tab 配置在 `utils/projectDisplay.ts` → `PROJECT_DETAIL_TABS`（基本信息、交付物、检测策略、项目成员、关联任务）
- 各 Tab 下方 `a-card` 暂空，后续按 Tab 分别实现

### 注意事项

- 刷新详情页会丢失 `history.state`，需走 API；mock 阶段 `getProjectDetail` 从 `MOCK_ALL_PROJECTS` 查找
- 从告警中心等跨模块跳转项目详情时，若未携带 state 仍会 API 兜底

---

## [2026-06-12] 系统管理 · 个人设置页

### 改了什么

- 实现 `UserProfile.vue`：左侧头像/姓名/用户名 + Tab（基本设置、修改密码、消息偏好）
- 组件：`ProfileSider`、`ProfileBasicPanel`、`ProfilePasswordPanel`、`ProfileNotifyPanel`
- 新增 `api/profile.ts`、`types/profile.ts`、`mock/.../userProfile.ts`

### 怎么实现的

- 基本设置：姓名/手机/部门可改；用户名与角色只读；部门下拉请求 `getProfileDepartmentOptions`（全部部门）
- 更新基本信息 → `updateUserProfile`；取消 → 重新 `getUserProfile` 恢复表单
- 修改密码 → `changeUserPassword`，成功后 `logout` 并跳登录；mock 旧密码默认 `Admin123`
- 消息偏好 5 项多选 → `updateNotifyPreferences`；站内消息「去修改密码」带 `?tab=password`

### 注意事项

- mock 当前用户固定 admin（`user-001`）；联调后 `/api/system/profile` 应凭 token 识别当前用户

---

## [2026-06-12] 顶栏「返回」与跨模块 from 来源

### 改了什么

- `PageBackButton` 置于 `AdminLayout` 面包屑左侧
- `utils/navigation.ts`：`appendFromQuery`、`shouldShowPageBack`、`resolvePageBackTarget`
- `composables/usePageBack.ts`、`useRouteWithFrom.ts`

### 怎么实现的

- 显示条件：`meta.showBack`、或 URL 带 `?from=`、或面包屑层级 ≥ 3
- 返回优先级：`from` → `router.back()` → 面包屑上级 path → 首页
- 跨模块跳转已带 `from`：站内消息、部门/角色→用户、用户详情→项目、告警详情、覆盖统计→知识库、任务→日志

### 注意事项

- 新增跨模块 `router.push` / `router-link` 请用 `useRouteWithFrom().withFrom(target)`
- `from` 仅接受站内相对路径，排除 `/login`

---

## [2026-06-12] 系统管理 · 站内消息页

### 改了什么

- 实现 `SiteMessage.vue`：全部标为已读、筛选（类型/标题/状态）、分页列表
- 组件：`SiteMessageActionBar`、`SiteMessageQueryBar`、`SiteMessageTable`、`SiteMessageActionCell`
- 新增 `api/siteMessage.ts`、`types/siteMessage.ts`、扩展 `mock/.../siteMessageList.ts`（12 条 admin 消息）
- `ListTable` 增加可选 `rowClassName`，未读行浅蓝背景

### 怎么实现的

- 列表按 `createdAt` 倒序；mock 按 `recipientUsername` 过滤当前用户
- 操作列按 `action.type` 跳转；任务通知用 `action.taskType`：自主率→`/result`，开源风险/SBOM→`/risk`
- 标为已读/查看xx：先 `updateSiteMessageReadStatus` 再 `syncMessageRead` 即时去掉行高亮，查看xx 后再 `router.push`
- 页面容器勿再加 padding（`AdminLayout.admin-content` 已有 margin 24px）

### 注意事项

- 密码重置公告仍由 `appendPasswordResetSiteMessage` 追加，带「去修改密码」操作
- 联调时需 `GET /api/system/messages` 等接口，未读数顶栏角标尚未接入

---

## [2026-06-12] 登录页 · 记住我 / 忘记密码提示 / 注册部门下拉

### 改了什么

- `LoginPage.vue`：登录表单增加「记住我」勾选 +「忘记密码请联系管理员重置」小字
- `tokenStorage.ts`（新）：统一管理 token 读写；记住我→`localStorage`，否则→`sessionStorage`
- `auth.ts` / `request.ts`：改为走 `tokenStorage` 工具
- 注册表单「部门」由输入框改为下拉，调用 `getEnabledDepartmentOptions()` 拉启用部门

### 怎么实现的

- 登录成功 `authStore.setToken(token, rememberMe)`，偏好键 `sca_remember_me` 存 localStorage 供回显
- 注册切换时 `loadDepartmentOptions()`，提交时将 `departmentId` 解析为 `departmentName` 传给 `register()`
- 登出/401 只清 token，不清记住我偏好

### 注意事项

- 注册部门接口与用户管理弹窗共用 `getEnabledDepartmentOptions`，联调时须允许未登录访问（或单独提供公开 options 接口）

---

## [2026-06-12] 用户详情抽屉 · 项目展示改为 Tag

### 改了什么

- `UserDetailDrawer.vue`：「已加入项目」「负责项目」由 `a-tabs` 改为独立 `a-tag` 列表

### 为什么这么做

- Tab 有选中态和底部横线，但点击即跳转项目页，不需要切换态，视觉上也像 Tab 控件而非链接标签

### 怎么实现的

- 两组项目各用 `flex-wrap` 排列默认样式 Tag，统一样式无选中态；hover 变主题蓝；点击 `router.push(/projects/:id)`

---

## [2026-06-12] 系统管理 · 用户列表（详情/删除/重置密码）

### 改了什么

- **详情抽屉**：用户名/姓名/部门/角色/状态/最后登录；已加入项目、负责项目各一组可点击 Tag，点击跳转项目详情
- **删除**：复用 `BoundCountDeleteModal`；`ownedProjectCount > 0` 提示先移交负责项目
- **重置密码**：两步弹窗（确认 → 展示随机密码 → 提交）；mock 写入 `siteMessageList.ts` 系统公告
- mock：`userProjects.ts`（用户-项目关系）、`siteMessageList.ts`（站内消息，含密码重置通知模板）

---

## [2026-06-12] 系统管理 · 用户列表页

### 改了什么

- 实现 `UserList.vue`：新增用户、筛选、分页列表、新增/修改弹窗
- 组件：`UserCreateBar`、`UserQueryBar`、`UserTable`、`UserActionCell`、`UserFormModal`
- 新增 `src/api/user.ts`、`src/types/user.ts`、`mock/modules/system/userList.ts`（12 条用户）
- 工具：`userQuery.ts`、`userDisplay.ts`、`userValidation.ts`、`passwordGenerator.ts`

### 怎么实现的

- 弹窗打开时并行请求 `getEnabledDepartmentOptions` + `getEnabledRoleOptions`
- 新增时初始密码前端自动生成 8 位（大小写+数字），可点「重新生成」
- 筛选：真实姓名、系统角色（全部+API）、部门 input、创建时间范围（含时分）
- 操作列：修改可用；详情/删除/重置密码灰色占位无交互
- 创建用户会同步更新部门 `memberCount` 与角色 `boundUserCount` mock

### 注意事项

- 用户名 4-20 位字母数字；手机号 `^1[3-9]\\d{9}$`
- 登录注册用的 `auth/users.ts` 与系统用户列表 mock 分离，创建用户会写入 `MOCK_REGISTERED_USERNAMES`

---

## [2026-06-12] 系统管理 · 角色管理页

### 改了什么

- 实现 `RoleManage.vue`：新增按钮、筛选、分页列表、右侧抽屉（名称/编码/状态/备注/权限树）
- 组件：`RoleCreateBar`、`RoleQueryBar`、`RoleTable`、`RoleActionCell`、`RoleFormDrawer`、`RolePermissionTree`
- mock：`roleList.ts`（4 内置 + 2 自定义）、`rolePermissionDefs.ts`（与原型 `ROLE_PERMISSIONS` 一致）
- API：`getRoleList` / `createRole` / `updateRole` / `deleteRole`
- 公共组件 `BoundCountDeleteModal`：部门/角色删除共用；部门删除改为用列表 `memberCount`，不再请求 `checkDepartmentMembers`
- 删除 `DepartmentDeleteModal.vue`

### 怎么实现的

- 新建角色默认权限 = 只读角色；可在权限树勾选更多项
- 内置角色（admin/auditor/engineer/readonly）操作列显示灰色「内置」，不可删除
- 自定义角色删除：用列表 `boundUserCount` 判断，>0 提示先解绑
- 角色编码校验：`^[A-Za-z_]+$`；内置角色编辑时编码只读
- 内置只读角色：未勾选的权限项 disabled（与原型一致）

### 注意事项

- 权限树定义在 mock，组件通过 `utils/rolePermissions.ts` 桥接引用
- `checkDepartmentMembers` API 仍保留但未在删除流程使用

---

## [2026-06-12] 系统管理 · 部门管理页（成员人数列 + 删除弹窗修复）

### 改了什么

- 列表在备注后新增「成员人数」列，数据来自 `Department.memberCount`
- 修复删除弹窗首次打开时确定按钮不可点：`watch` 增加 `immediate: true`，挂载时即执行成员检查

---

## [2026-06-12] 系统管理 · 部门管理页（去掉排序字段）

### 改了什么

- 新增/编辑弹窗与列表列移除「排序」；列表按创建时间倒序
- `DepartmentActionCell` 改为与项目列表一致的 `action-cell`（`gap: 12px`），修复修改/删除贴在一起

---

## [2026-06-12] 系统管理 · 部门管理页

### 改了什么

- 新增页面 `DepartmentManage.vue`（路由 `/system/departments`）
- 新增组件：`DepartmentCreateBar`、`DepartmentQueryBar`、`DepartmentFormModal`、`DepartmentTable`、`DepartmentActionCell`、`DepartmentDeleteModal`
- `api/system.ts`：部门列表/新增/修改/删除前校验/删除
- `types/system.ts`：部门相关类型
- `mock/modules/system/departmentList.ts`：11 条平级部门 + 成员数映射
- `utils/departmentQuery.ts`、`utils/departmentDisplay.ts`
- `AdminLayout` 系统管理菜单增加「部门管理」

### 为什么这么做

按原型实现部门管理，但**不做上下级**：所有部门平级展示，弹窗无「上级部门」字段。

### 怎么实现的

- 列表数据流复用 `useFilteredPaginatedList` + `ListQueryBar` + `ListTable`（与项目列表一致）
- 新增/修改共用 `DepartmentFormModal`：`mode` 区分 create/edit，确定后调 `createDepartment` / `updateDepartment`，成功后 `loadPage()` 刷新
- 删除流程：`DepartmentDeleteModal` 打开时先 `checkDepartmentMembers`；有成员显示不可删提示；无成员二次确认后 `deleteDepartment`，前端乐观移除行并修正 `pagination.total`
- Mock 在内存数组 `MOCK_ALL_DEPARTMENTS` 上 CRUD，成员数在 `MOCK_DEPARTMENT_MEMBER_COUNTS`（如 dept-001 有 2 人，dept-003 可删）

### 注意事项 / 已知限制

- 全部为 mock，联调时替换 `api/system.ts` 内 TODO 为 `request.*`
- 用户列表/角色管理仍为占位页，部门与用户绑定在用户页实现后再接真实校验

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
