import type { ApiResponse, PageResult } from '@/types/common'
import type { KbIntakeTodoItem, KbIntakeTodoQueryParams } from '@/types/knowledge'

const INTAKE_TODO_SEEDS: Omit<KbIntakeTodoItem, 'todoId'>[] = [
  {
    projectName: 'OpenFOAM',
    status: 'in_progress',
    detail: 'v2406-rc1 索引构建中，预计 18 分钟完成目录与指纹入库',
  },
  {
    projectName: 'Eigen',
    status: 'pending',
    detail: '季度更新批次 KB-2026Q2-02 待拉取 3.4.1 候选版本',
  },
  {
    projectName: 'fmt',
    status: 'alert',
    detail: '上传更新包校验失败：版本号与包内元数据不一致，需重新上传',
  },
  {
    projectName: 'VTK',
    status: 'pending',
    detail: '漏洞映射规则升级后待补跑组件关联',
  },
  {
    projectName: 'CGAL',
    status: 'in_progress',
    detail: '云端仓库拉取进行中，已同步 62% 文件树',
  },
  {
    projectName: 'Boost',
    status: 'alert',
    detail: '许可证线索解析低置信度，需人工复核 GPL/LGPL 边界',
  },
  {
    projectName: 'PETSc',
    status: 'pending',
    detail: '待配置云端凭据后启动首次入库',
  },
]

/**
 * 分页返回入库待办 mock
 * @param params - 分页参数
 */
export function getMockKbIntakeTodoListPage(
  params: KbIntakeTodoQueryParams,
): ApiResponse<PageResult<KbIntakeTodoItem>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 4
  const list: KbIntakeTodoItem[] = INTAKE_TODO_SEEDS.map((seed, index) => ({
    todoId: `kb-intake-todo-${String(index + 1).padStart(3, '0')}`,
    ...seed,
  }))
  const start = (page - 1) * pageSize

  return {
    code: 200,
    message: 'ok',
    data: {
      list: list.slice(start, start + pageSize),
      total: list.length,
      page,
      pageSize,
    },
  }
}
