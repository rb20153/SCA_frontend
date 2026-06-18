import type { AutonomyCodeEvidenceItem, AutonomyFileDetail } from '@/types/detect'

interface FileDetailSeed {
  fileTypeLabel: string
  issueLineRanges: string
  sourceProject: string
  sourceVersion: string
  maxConfidence: number
  codeEvidenceCount: number
  fingerprintEvidenceCount: number
}

/** 与 evidence 树 localId 对应（不含 task 前缀） */
const FILE_DETAIL_SEEDS: Record<string, FileDetailSeed> = {
  'file-solver': {
    fileTypeLabel: '文本文件',
    issueLineRanges: '120-132，54-58',
    sourceProject: 'OpenFOAM',
    sourceVersion: 'v2312',
    maxConfidence: 0.91,
    codeEvidenceCount: 2,
    fingerprintEvidenceCount: 3,
  },
  'file-mesh': {
    fileTypeLabel: '文本文件',
    issueLineRanges: '88-95',
    sourceProject: 'Eigen',
    sourceVersion: '3.4.0',
    maxConfidence: 0.74,
    codeEvidenceCount: 1,
    fingerprintEvidenceCount: 0,
  },
  'file-boundary': {
    fileTypeLabel: '文本文件',
    issueLineRanges: '42-48',
    sourceProject: 'OpenFOAM',
    sourceVersion: 'v2312',
    maxConfidence: 0.68,
    codeEvidenceCount: 1,
    fingerprintEvidenceCount: 0,
  },
  'file-inlet': {
    fileTypeLabel: '配置文件',
    issueLineRanges: '12-18',
    sourceProject: 'OpenFOAM',
    sourceVersion: 'v2312',
    maxConfidence: 0.72,
    codeEvidenceCount: 1,
    fingerprintEvidenceCount: 0,
  },
  'file-outlet': {
    fileTypeLabel: '配置文件',
    issueLineRanges: '—',
    sourceProject: 'OpenFOAM',
    sourceVersion: 'v2312',
    maxConfidence: 0.55,
    codeEvidenceCount: 0,
    fingerprintEvidenceCount: 0,
  },
}

const ISSUE_RATE_BY_LOCAL_ID: Record<string, number> = {
  'file-solver': 31.6,
  'file-mesh': 12.4,
  'file-boundary': 8.7,
  'file-inlet': 15.3,
  'file-outlet': 4.2,
}

/** solver.cpp 两条代码证据（对齐原型 M05-S04-P01） */
function buildSolverCodeEvidences(prefix: string): AutonomyCodeEvidenceItem[] {
  return [
    {
      evidenceId: `${prefix}:code-1`,
      alertType: 'high-similarity',
      confidence: 0.91,
      sourceProject: 'OpenFOAM',
      sourceVersion: 'v2312',
      currentCode: {
        paneTitle: '当前被检测代码 · solver.cpp L128-132',
        lines: [
          { kind: 'context', lineNumber: 128, text: ' void FvSolver::solve()' },
          { kind: 'context', lineNumber: 129, text: ' {' },
          { kind: 'delete', lineNumber: 129, text: '    scalar residual = gSum(mag(A()));' },
          { kind: 'add', lineNumber: 129, text: '    scalar residual = gSum(mag(A() & U()));' },
          { kind: 'context', lineNumber: 130, text: '     if (residual < tolerance_) return;' },
          { kind: 'context', lineNumber: 131, text: '     assembleMatrix();' },
          { kind: 'context', lineNumber: 132, text: ' }' },
        ],
      },
      suspectedCode: {
        paneTitle: '疑似来源代码 · OpenFOAM / fvMatrix.C L214-218',
        lines: [
          { kind: 'context', lineNumber: 214, text: ' void fvMatrix::solve()' },
          { kind: 'context', lineNumber: 215, text: ' {' },
          { kind: 'delete', lineNumber: 215, text: '    scalar residual = gSum(mag(A()));' },
          { kind: 'add', lineNumber: 215, text: '    scalar residual = gSum(mag(A() & psi()));' },
          { kind: 'context', lineNumber: 216, text: '     if (residual < solverTolerance_) return;' },
          { kind: 'context', lineNumber: 217, text: '     factorize();' },
          { kind: 'context', lineNumber: 218, text: ' }' },
        ],
      },
    },
    {
      evidenceId: `${prefix}:code-2`,
      alertType: 'fragment-reassembly',
      confidence: 0.88,
      sourceProject: 'OpenFOAM',
      sourceVersion: 'v2312',
      currentCode: {
        paneTitle: '当前被检测代码 · solver.cpp L54-58',
        lines: [
          { kind: 'context', lineNumber: 54, text: ' // flux assembly' },
          { kind: 'context', lineNumber: 55, text: ' forAll(cells, cellI)' },
          { kind: 'add', lineNumber: 55, text: '    phi[cellI] = linearInterpolate(U)[cellI];' },
          { kind: 'context', lineNumber: 56, text: ' {' },
          { kind: 'context', lineNumber: 57, text: '     divPhi[cellI] = fvc::div(phi)[cellI];' },
          { kind: 'context', lineNumber: 58, text: ' }' },
        ],
      },
      suspectedCode: {
        paneTitle: '疑似来源代码 · OpenFOAM / fvMatrix.C L86-90',
        lines: [
          { kind: 'context', lineNumber: 86, text: ' // face flux' },
          { kind: 'context', lineNumber: 87, text: ' forAll(owner, faceI)' },
          { kind: 'add', lineNumber: 87, text: '    phi[faceI] = linearInterpolate(Uf)[faceI] & Sf[faceI];' },
          { kind: 'context', lineNumber: 88, text: ' {' },
          { kind: 'context', lineNumber: 89, text: '     divPhi[faceI] = fvc::surfaceIntegrate(phi)[faceI];' },
          { kind: 'context', lineNumber: 90, text: ' }' },
        ],
      },
    },
  ]
}

/** 其他文件的简化单条代码证据 */
function buildGenericCodeEvidence(
  prefix: string,
  fileName: string,
  lineRange: string,
  alertType: AutonomyCodeEvidenceItem['alertType'],
  confidence: number,
  sourceProject: string,
  sourceVersion: string,
  suspectPath: string,
): AutonomyCodeEvidenceItem {
  const [startLine, endLine] = lineRange.split('-').map((part) => Number.parseInt(part, 10))
  const contextLine = Number.isFinite(startLine) ? startLine : 1
  const lastLine = Number.isFinite(endLine) ? endLine : contextLine + 4

  return {
    evidenceId: `${prefix}:code-1`,
    alertType,
    confidence,
    sourceProject,
    sourceVersion,
    currentCode: {
      paneTitle: `当前被检测代码 · ${fileName} L${lineRange}`,
      lines: [
        { kind: 'context', lineNumber: contextLine, text: ' void processSegment()' },
        { kind: 'context', lineNumber: contextLine + 1, text: ' {' },
        { kind: 'delete', lineNumber: contextLine + 1, text: '    auto result = legacyCompute();' },
        { kind: 'add', lineNumber: contextLine + 1, text: '    auto result = adaptedCompute();' },
        { kind: 'context', lineNumber: contextLine + 2, text: '     if (!result.valid()) return;' },
        { kind: 'context', lineNumber: lastLine - 1, text: '     applyResult(result);' },
        { kind: 'context', lineNumber: lastLine, text: ' }' },
      ],
    },
    suspectedCode: {
      paneTitle: `疑似来源代码 · ${suspectPath} L${lineRange}`,
      lines: [
        { kind: 'context', lineNumber: contextLine + 20, text: ' void referenceSegment()' },
        { kind: 'context', lineNumber: contextLine + 21, text: ' {' },
        { kind: 'delete', lineNumber: contextLine + 21, text: '    auto result = legacyCompute();' },
        { kind: 'add', lineNumber: contextLine + 21, text: '    auto result = adaptedCompute();' },
        { kind: 'context', lineNumber: contextLine + 22, text: '     if (!result.valid()) return;' },
        { kind: 'context', lineNumber: contextLine + 24, text: '     applyResult(result);' },
        { kind: 'context', lineNumber: contextLine + 25, text: ' }' },
      ],
    },
  }
}

/** 按 localId 构建代码证据列表 */
function buildCodeEvidences(
  localId: string,
  prefix: string,
  fileName: string,
  seed: FileDetailSeed,
): AutonomyCodeEvidenceItem[] {
  if (seed.codeEvidenceCount === 0) {
    return []
  }

  if (localId === 'file-solver') {
    return buildSolverCodeEvidences(prefix)
  }

  const lineRangeByFile: Record<string, string> = {
    'file-mesh': '88-95',
    'file-boundary': '42-48',
    'file-inlet': '12-18',
  }

  const suspectByFile: Record<string, string> = {
    'file-mesh': 'Eigen / DenseBase.h',
    'file-boundary': 'OpenFOAM / fvPatchField.C',
    'file-inlet': 'OpenFOAM / boundaryConditions',
  }

  return [
    buildGenericCodeEvidence(
      prefix,
      fileName,
      lineRangeByFile[localId] ?? '1-5',
      localId === 'file-mesh' ? 'high-similarity' : 'fragment-reassembly',
      seed.maxConfidence,
      seed.sourceProject,
      seed.sourceVersion,
      suspectByFile[localId] ?? seed.sourceProject,
    ),
  ]
}

/** 构建指纹证据列表（与代码证据同接口一次返回） */
function buildFingerprintEvidences(
  localId: string,
  prefix: string,
  fileName: string,
  seed: FileDetailSeed,
): AutonomyFileDetail['fingerprintEvidences'] {
  if (seed.fingerprintEvidenceCount === 0) {
    return []
  }

  if (localId === 'file-solver') {
    return [
      {
        evidenceId: `${prefix}:fp-1`,
        alertType: 'fingerprint-hit',
        confidence: 0.83,
        sourceProject: 'OpenFOAM',
        sourceVersion: 'v2312',
        description: `指纹命中定位到 ${fileName} 的字段初始化区间，与知识库中 OpenFOAM 版本的函数级指纹序列相似。`,
      },
      {
        evidenceId: `${prefix}:fp-2`,
        alertType: 'fingerprint-sequence',
        confidence: 0.79,
        sourceProject: 'OpenFOAM',
        sourceVersion: 'v2312',
        description: `函数级指纹序列与知识库 OpenFOAM v2312 中 fvMatrix 求解流程片段高度一致，覆盖 ${fileName} 内 assemble 调用链。`,
      },
      {
        evidenceId: `${prefix}:fp-3`,
        alertType: 'segment-fingerprint',
        confidence: 0.76,
        sourceProject: 'OpenFOAM',
        sourceVersion: 'v2312',
        description: `片段指纹命中 ${fileName} 第 54–58 行 flux 组装逻辑，与知识库同版本 surfaceIntegrate 实现片段匹配。`,
      },
    ]
  }

  return [
    {
      evidenceId: `${prefix}:fp-1`,
      alertType: 'fingerprint-hit',
      confidence: seed.maxConfidence,
      sourceProject: seed.sourceProject,
      sourceVersion: seed.sourceVersion,
      description: `指纹命中定位到 ${fileName}，与知识库 ${seed.sourceProject} ${seed.sourceVersion} 中同类结构指纹相似。`,
    },
  ].slice(0, seed.fingerprintEvidenceCount)
}

/** 从带 task 前缀的 nodeId 解析 localId，如 task-001:file-solver → file-solver */
function parseLocalFileId(fileId: string): string {
  const idx = fileId.lastIndexOf(':')
  return idx >= 0 ? fileId.slice(idx + 1) : fileId
}

/**
 * mock：按任务与文件节点 ID 一次性返回文件详情与全量证据
 * @param taskId - 检测任务 ID
 * @param fileId - 文件树节点 ID（含 task 前缀）
 * @param fileName - 当前文件名（来自树节点）
 */
export function getMockAutonomyFileDetail(
  taskId: string,
  fileId: string,
  fileName: string,
): AutonomyFileDetail | null {
  const localId = parseLocalFileId(fileId)
  const seed = FILE_DETAIL_SEEDS[localId]
  if (!seed) {
    return null
  }

  const overallIssueRate = ISSUE_RATE_BY_LOCAL_ID[localId] ?? 0
  const evidencePrefix = `task-${taskId}:${localId}`

  return {
    summary: {
      fileId,
      fileName,
      fileTypeLabel: seed.fileTypeLabel,
      issueLineRanges: seed.issueLineRanges,
      overallIssueRate,
      sourceProject: seed.sourceProject,
      sourceVersion: seed.sourceVersion,
      maxConfidence: seed.maxConfidence,
    },
    codeEvidences: buildCodeEvidences(localId, evidencePrefix, fileName, seed),
    fingerprintEvidences: buildFingerprintEvidences(
      localId,
      evidencePrefix,
      fileName,
      seed,
    ),
  }
}
