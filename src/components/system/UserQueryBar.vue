<template>
  <ListQueryBar @search="emit('search')" @reset="emit('reset')">
    <a-form-item label="真实姓名">
      <a-input
        v-model:value="filters.realName"
        placeholder="输入真实姓名"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="系统角色">
      <a-select
        v-model:value="filters.roleId"
        :options="roleOptions"
        :loading="roleOptionsLoading"
        class="list-query-select"
      />
    </a-form-item>

    <a-form-item label="部门">
      <a-input
        v-model:value="filters.departmentName"
        placeholder="输入部门名称"
        allow-clear
        class="list-query-input"
        @press-enter="emit('search')"
      />
    </a-form-item>

    <a-form-item label="创建时间">
      <a-range-picker
        v-model:value="filters.createdAtRange"
        show-time
        format="YYYY-MM-DD HH:mm"
        :placeholder="['开始时间', '结束时间']"
        class="list-query-datetime-range"
      />
    </a-form-item>
  </ListQueryBar>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getRoleFilterOptions } from '@/api/user'
import ListQueryBar from '@/components/common/ListQueryBar.vue'
import type { RoleOption, UserListFilters } from '@/types/user'

const filters = defineModel<UserListFilters>({ required: true })

const emit = defineEmits<{
  search: []
  reset: []
}>()

const roleOptionsLoading = ref(false)
const roleOptions = ref<{ label: string; value: string }[]>([
  { label: '全部角色', value: '' },
])

/** 加载筛选区系统角色下拉 */
async function loadRoleOptions() {
  roleOptionsLoading.value = true
  try {
    const res = await getRoleFilterOptions()
    roleOptions.value = [
      { label: '全部角色', value: '' },
      ...res.data.map((item: RoleOption) => ({
        label: item.roleName,
        value: item.roleId,
      })),
    ]
  } finally {
    roleOptionsLoading.value = false
  }
}

onMounted(() => {
  loadRoleOptions()
})
</script>
