import type { FileTreeNode } from '@/types/fileTree'
import type { KbProject, KbProjectDirectoryQueryParams, KbVersion } from '@/types/knowledge'
import { MOCK_ALL_KB_PROJECTS } from '@/mock/modules/knowledge/knowledgeList'
import { getMockKbVersions } from '@/mock/modules/knowledge/versionList'
import { filterFileTreeByKeyword } from '@/utils/fileTree'

interface DirectoryTreeContext {
  project: KbProject
  version: KbVersion
  versionIndex: number
}

/** 创建文件节点 */
function file(name: string, path: string, md5: string, localId: string): FileTreeNode {
  return {
    nodeId: localId,
    name,
    type: 'file',
    path,
    md5,
  }
}

/** 创建目录节点 */
function dir(name: string, localId: string, children: FileTreeNode[]): FileTreeNode {
  return {
    nodeId: localId,
    name,
    type: 'directory',
    children,
  }
}

/** 为节点 ID 加上版本前缀，避免切换版本时选中态冲突 */
function prefixNodeIds(nodes: FileTreeNode[], prefix: string): FileTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    nodeId: `${prefix}:${node.nodeId}`,
    children: node.children ? prefixNodeIds(node.children, prefix) : undefined,
  }))
}

/** OpenFOAM 目录树：不同版本结构略有差异 */
function buildOpenFoamTree(versionNo: string, versionIndex: number): FileTreeNode[] {
  const applications = dir('applications', 'dir-applications', [
    dir('solvers', 'dir-solvers', [
      dir('simpleFoam', 'dir-simple-foam', [
        file('createFields.H', 'applications/solvers/simpleFoam/createFields.H', '6d7fce9fee471194aa8b5b6e47267f03', 'file-create-fields'),
        file('UEqn.H', 'applications/solvers/simpleFoam/UEqn.H', 'a1b2c3d4e5f6789012345678abcdef01', 'file-ueqn'),
        file('pEqn.H', 'applications/solvers/simpleFoam/pEqn.H', 'b2c3d4e5f6789012345678abcdef0123', 'file-peqn'),
        ...(versionIndex === 0
          ? [file('simpleFoam.C', 'applications/solvers/simpleFoam/simpleFoam.C', 'aa11bb22cc33dd44ee55ff6677889900', 'file-simple-foam-c')]
          : []),
      ]),
      ...(versionIndex <= 1
        ? [
            dir('interFoam', 'dir-inter-foam', [
              file('alphaControls.H', 'applications/solvers/interFoam/alphaControls.H', 'cc11dd22ee33ff445566778899aabbcc', 'file-alpha-controls'),
            ]),
          ]
        : []),
    ]),
  ])

  const src = dir('src', 'dir-src', [
    dir('OpenFOAM', 'dir-src-openfoam', [
      file('fvMatrix.C', 'src/OpenFOAM/fvMatrix.C', 'c3d4e5f6789012345678abcdef012345', 'file-fvmatrix'),
      file('lduMatrix.C', 'src/OpenFOAM/lduMatrix.C', 'd4e5f6789012345678abcdef0123456', 'file-ldumatrix'),
    ]),
  ])

  const metaChildren: FileTreeNode[] = [
    file('LICENSE', 'meta/LICENSE', 'e5f6789012345678abcdef012345678', 'file-license'),
  ]
  if (versionIndex <= 2) {
    metaChildren.push(
      file('README.md', 'meta/README.md', 'f6789012345678abcdef0123456789', 'file-readme'),
    )
  }
  const meta = dir('meta', 'dir-meta', metaChildren)

  const rootChildren: FileTreeNode[] = [applications, src, meta]

  if (versionNo === 'v2406-rc1' || versionIndex === 1) {
    rootChildren.push(
      dir('tutorials', 'dir-tutorials', [
        dir('incompressible', 'dir-tutorials-inc', [
          file('cavityFoam.C', 'tutorials/incompressible/cavityFoam.C', '11223344556677889900112233445566', 'file-cavity'),
        ]),
      ]),
      dir('mesh', 'dir-mesh', [
        file('blockMeshDict', 'mesh/blockMeshDict', '22334455667788990011223344556677', 'file-block-mesh'),
      ]),
    )
  }

  return [dir('OpenFOAM', 'dir-openfoam-root', rootChildren)]
}

/** Eigen 目录树 */
function buildEigenTree(versionIndex: number): FileTreeNode[] {
  const children: FileTreeNode[] = [
    dir('Core', 'dir-eigen-core', [
      file('Matrix.h', 'Eigen/Core/Matrix.h', 'eigen0011223344556677889900112233', 'file-matrix-h'),
      file('Array.h', 'Eigen/Core/Array.h', 'eigen1122334455667788990011223344', 'file-array-h'),
      ...(versionIndex <= 1
        ? [file('DenseBase.h', 'Eigen/Core/DenseBase.h', 'eigen2233445566778899001122334455', 'file-dense-base')]
        : []),
    ]),
    dir('LU', 'dir-eigen-lu', [
      file('PartialPivLU.h', 'Eigen/LU/PartialPivLU.h', 'eigen3344556677889900112233445566', 'file-piv-lu'),
    ]),
  ]

  if (versionIndex <= 2) {
    children.push(
      dir('unsupported', 'dir-eigen-unsupported', [
        file('EulerAngles.h', 'unsupported/EulerAngles.h', 'eigen4455667788990011223344556677', 'file-euler'),
      ]),
    )
  }

  return [dir('Eigen', 'dir-eigen-root', children)]
}

/** fmt 目录树 */
function buildFmtTree(versionIndex: number): FileTreeNode[] {
  return [
    dir('fmt', 'dir-fmt-root', [
      dir('include', 'dir-fmt-include', [
        dir('fmt', 'dir-fmt-headers', [
          file('core.h', 'include/fmt/core.h', 'fmt001122334455667788990011223344', 'file-core-h'),
          file('format.h', 'include/fmt/format.h', 'fmt112233445566778899001122334455', 'file-format-h'),
          ...(versionIndex === 0
            ? [file('chrono.h', 'include/fmt/chrono.h', 'fmt223344556677889900112233445566', 'file-chrono-h')]
            : []),
        ]),
      ]),
      dir('src', 'dir-fmt-src', [
        file('format.cc', 'src/format.cc', 'fmt334455667788990011223344556677', 'file-format-cc'),
        ...(versionIndex <= 1 ? [file('os.cc', 'src/os.cc', 'fmt445566778899001122334455667788', 'file-os-cc')] : []),
      ]),
    ]),
  ]
}

/** Deal.II 目录树 */
function buildDealIITree(versionIndex: number): FileTreeNode[] {
  return [
    dir('dealii', 'dir-dealii-root', [
      dir('source', 'dir-dealii-source', [
        dir('fe', 'dir-dealii-fe', [
          file('fe_q.cc', 'source/fe/fe_q.cc', 'deal001122334455667788990011223344', 'file-fe-q'),
        ]),
        dir('grid', 'dir-dealii-grid', [
          file('grid_generator.cc', 'source/grid/grid_generator.cc', 'deal1122334455667788990011223344', 'file-grid-gen'),
        ]),
      ]),
      ...(versionIndex <= 2
        ? [
            dir('examples', 'dir-dealii-examples', [
              file('step-1.cc', 'examples/step-1/step-1.cc', 'deal2233445566778899001122334455', 'file-step-1'),
            ]),
          ]
        : []),
    ]),
  ]
}

/** PETSc 目录树 */
function buildPetscTree(versionIndex: number): FileTreeNode[] {
  return [
    dir('petsc', 'dir-petsc-root', [
      dir('src', 'dir-petsc-src', [
        dir('mat', 'dir-petsc-mat', [
          file('matrix.c', 'src/mat/matrix.c', 'petsc001122334455667788990011223344', 'file-matrix-c'),
        ]),
        dir('vec', 'dir-petsc-vec', [
          file('vector.c', 'src/vec/vector.c', 'petsc112233445566778899001122334455', 'file-vector-c'),
        ]),
      ]),
      ...(versionIndex <= 1
        ? [
            dir('include', 'dir-petsc-include', [
              file('petscksp.h', 'include/petscksp.h', 'petsc223344556677889900112233445566', 'file-ksp-h'),
            ]),
          ]
        : []),
    ]),
  ]
}

/** 按项目名称生成通用目录树（未单独建模的项目） */
function buildGenericNamedTree(projectName: string, versionIndex: number): FileTreeNode[] {
  const rootName = projectName.split('-')[0].toLowerCase().replace(/\./g, '')
  const moduleCount = Math.max(1, 3 - Math.floor(versionIndex / 2))

  const modules: FileTreeNode[] = Array.from({ length: moduleCount }, (_, index) => {
    const moduleName = index === 0 ? 'core' : `module-${index}`
    return dir(moduleName, `dir-${rootName}-mod-${index}`, [
      file(`${moduleName}.cpp`, `${moduleName}/${moduleName}.cpp`, `${rootName}md${index}0123456789abcdef0123456789ab`, `file-${rootName}-${index}`),
      file(`${moduleName}.h`, `${moduleName}/${moduleName}.h`, `${rootName}hd${index}123456789abcdef0123456789abc`, `file-${rootName}-h-${index}`),
    ])
  })

  return [dir(rootName, `dir-${rootName}-root`, modules)]
}

/** 按项目 + 版本构建目录树 */
function buildDirectoryTree(ctx: DirectoryTreeContext): FileTreeNode[] {
  const { project, versionIndex } = ctx
  const baseName = project.projectName.split('-')[0]

  let nodes: FileTreeNode[]
  switch (baseName) {
    case 'OpenFOAM':
      nodes = buildOpenFoamTree(ctx.version.versionNo, versionIndex)
      break
    case 'Eigen':
      nodes = buildEigenTree(versionIndex)
      break
    case 'fmt':
      nodes = buildFmtTree(versionIndex)
      break
    case 'Deal.II':
      nodes = buildDealIITree(versionIndex)
      break
    case 'PETSc':
      nodes = buildPetscTree(versionIndex)
      break
    default:
      nodes = buildGenericNamedTree(project.projectName, versionIndex)
  }

  return prefixNodeIds(nodes, ctx.version.versionId)
}

/**
 * mock：获取知识库项目目录树（按项目 + 版本返回不同结构）
 * @param params - 项目 ID、版本 ID、关键字
 */
export function getMockKbProjectDirectoryTree(
  params: KbProjectDirectoryQueryParams,
): FileTreeNode[] {
  const project = MOCK_ALL_KB_PROJECTS.find((item) => item.kbProjectId === params.kbProjectId)
  const versions = getMockKbVersions(params.kbProjectId)
  const version = versions.find((item) => item.versionId === params.versionId)

  if (!project || !version) {
    return []
  }

  const versionIndex = versions.findIndex((item) => item.versionId === version.versionId)
  const tree = buildDirectoryTree({
    project,
    version,
    versionIndex: versionIndex >= 0 ? versionIndex : 0,
  })

  if (!params.keyword?.trim()) {
    return tree
  }

  return filterFileTreeByKeyword(tree, params.keyword)
}
