# 角色页面权限接口变更说明

> 适用模块：系统管理 - 角色管理、登录认证
>
> 前端状态：已按本文字段实现，待后端联调
>
> 更新日期：2026-08-29

## 1. 变更目的

角色权限由旧的扁平权限标识改为按页面配置读写权限。前端角色“修改角色”抽屉已按固定页面列表展示，每行可选择“可读”和“可编辑”。

`read` 控制页面和关联子页是否可访问；`write` 控制新增、编辑、删除、同步、提交等修改操作。后端仍必须在接口层完成最终鉴权，前端隐藏按钮不作为安全校验。

## 2. 统一字段格式

所有以下接口统一使用 `permission`（单数）字段：

```json
{
  "/projects": { "read": true, "write": false },
  "/detect/autonomy": { "read": true, "write": true },
  "/detect/risk": { "read": false, "write": false }
}
```

规则：

- 每个页面键的值固定为 `{ "read": boolean, "write": boolean }`。
- 不允许 `read: false, write: true`；后端保存时应拒绝或归一化为 `read: true, write: true`。
- 未返回的页面键前端按双 `false` 处理。
- 请不要返回旧字段 `permissions`、`permissionList`，也不要返回旧键如 `project.read`、`op.task_run`。

## 3. 可配置页面键

以下 16 项是角色修改弹窗和后端角色配置需要持久化的完整集合。

| 页面路径键 | 中文页面名 | 英文页面名 |
|---|---|---|
| `/projects` | 项目列表 | Project List |
| `/detect/autonomy` | 自主率检测 | Autonomy Detection |
| `/detect/risk` | 开源风险检测 | Open Source Risk Detection |
| `/detect/ai-analysis` | AI 辅助分析 | AI Assisted Analysis |
| `/policies` | 策略列表 | Policy List |
| `/reports` | 报告列表 | Report List |
| `/reports/templates` | 报告模板 | Report Templates |
| `/knowledge` | 知识库管理 | Knowledge Base Management |
| `/knowledge/coverage` | 覆盖统计 | Coverage Statistics |
| `/knowledge/vulnerabilities` | 漏洞知识库 | Vulnerability Knowledge Base |
| `/knowledge/quarter-updates` | 季度更新管理 | Quarterly Update Management |
| `/system/users` | 用户列表 | User Management |
| `/system/departments` | 部门管理 | Department Management |
| `/system/roles` | 角色管理 | Role Management |
| `/system/logs` | 日志列表 | Audit Log |
| `/system/alerts` | 告警中心 | Alert Center |

以下基础页面不在角色配置弹窗中出现，由前端强制视为 `read: true, write: true`：

- `/dashboard`（首页仪表盘）
- `/system/messages`（站内消息）
- `/system/profile`（个人设置）

详情页不单独配置，继承父页面权限。例如 `/projects/:projectId` 使用 `/projects`，`/policies/:policyId/edit` 使用 `/policies`，检测结果使用对应检测列表权限。

## 4. 接口改造

### 4.1 `GET /api/auth/me`

返回当前用户角色的页面权限。前端登录和刷新时读取该字段以控制菜单和路由。

```json
{
  "code": 0,
  "data": {
    "userId": "1001",
    "username": "zhangsan",
    "role": "auditor",
    "permission": {
      "/projects": { "read": true, "write": false },
      "/detect/autonomy": { "read": true, "write": true }
    }
  }
}
```

### 4.2 `PUT /api/system/roles/{roleId}`

角色修改请求体中的旧 `permissions` 字段替换为 `permission`。前端已按下述格式发送。

```json
{
  "roleName": "审计员",
  "roleCode": "auditor",
  "status": "enabled",
  "remark": "负责审核策略版本",
  "permission": {
    "/projects": { "read": true, "write": false },
    "/detect/autonomy": { "read": true, "write": true },
    "/detect/risk": { "read": false, "write": false },
    "/detect/ai-analysis": { "read": false, "write": false },
    "/policies": { "read": true, "write": false },
    "/reports": { "read": true, "write": false },
    "/reports/templates": { "read": false, "write": false },
    "/knowledge": { "read": false, "write": false },
    "/knowledge/coverage": { "read": false, "write": false },
    "/knowledge/vulnerabilities": { "read": false, "write": false },
    "/knowledge/quarter-updates": { "read": false, "write": false },
    "/system/users": { "read": false, "write": false },
    "/system/departments": { "read": false, "write": false },
    "/system/roles": { "read": false, "write": false },
    "/system/logs": { "read": true, "write": false },
    "/system/alerts": { "read": true, "write": false }
  }
}
```

建议 `POST /api/system/roles` 同样接受该请求体，以保证新增角色与修改角色使用相同的数据结构。前端新增角色也已使用 `permission` 字段。

### 4.3 `GET /api/system/roles?page=...`

分页响应的 `records`（或现有等价列表字段）中每一条角色记录必须返回 `permission`，以便打开“修改角色”弹窗时回填。

```json
{
  "code": 0,
  "data": {
    "records": [
      {
        "roleId": "role-auditor",
        "roleName": "审计员",
        "roleCode": "auditor",
        "status": "enabled",
        "remark": "负责审核策略版本",
        "isBuiltin": true,
        "createdAt": "2026-08-29T09:00:00Z",
        "boundUserCount": 2,
        "permission": {
          "/projects": { "read": true, "write": false },
          "/policies": { "read": true, "write": false }
        }
      }
    ],
    "total": 1
  }
}
```

缺失的 16 项允许不返回，前端会按 `{ "read": false, "write": false }` 补齐；若后端方便，建议完整返回全部 16 项以减少歧义。

## 5. 联调验收

1. 打开“修改角色”，16 行页面权限均正确回填；首页、站内消息、个人设置不显示在授权表中。
2. 勾选“可编辑”后，前端提交同页面 `read: true, write: true`。
3. 取消“可读”后，前端提交同页面 `read: false, write: false`。
4. 保存后重新请求角色分页接口，`records[].permission` 与保存内容一致。
5. 重新登录后，`GET /api/auth/me` 返回同格式 `permission`，前端据此更新侧栏和路由访问控制。
