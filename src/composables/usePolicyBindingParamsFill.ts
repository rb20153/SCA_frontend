import { computed, ref, watch, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import { getPolicyDetectParams } from '@/api/policy'

interface PolicyBindingParamsTarget {
  similarityThreshold: number
  minMatchLength: number
  excludeDirectories: string[]
}

/**
 * 选择检测策略后，从策略配置拉取默认检测参数并写入表单
 * @param policyId - 当前选中的策略 ID
 * @param target - 待填充的阈值 / 匹配长度 / 排除目录字段
 * @param options.skipFill - 为 true 时不触发填充（用于从服务端回显绑定数据）
 */
export function usePolicyBindingParamsFill(
  policyId: Ref<string | undefined>,
  target: PolicyBindingParamsTarget,
  options: { skipFill: Ref<boolean> },
) {
  const paramsLoading = ref(false)

  const paramsFieldsDisabled = computed(
    () => !policyId.value || paramsLoading.value,
  )

  /** 将策略默认参数写入绑定表单 */
  async function fillParamsFromPolicy(id: string) {
    paramsLoading.value = true
    try {
      const res = await getPolicyDetectParams(id)
      if (!res.data) {
        message.warning('未获取到该策略的默认参数')
        return
      }
      target.similarityThreshold = res.data.similarityThreshold
      target.minMatchLength = res.data.minMatchLength
      target.excludeDirectories = [...res.data.excludeDirectories]
    } finally {
      paramsLoading.value = false
    }
  }

  watch(policyId, (id, prevId) => {
    if (!id) {
      target.similarityThreshold = 0
      target.minMatchLength = 0
      target.excludeDirectories = []
      return
    }
    if (options.skipFill.value || id === prevId) {
      return
    }
    void fillParamsFromPolicy(id)
  })

  return {
    paramsLoading,
    paramsFieldsDisabled,
  }
}
