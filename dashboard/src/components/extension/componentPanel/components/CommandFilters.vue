<script setup lang="ts">
import { commandPermissionOptions, commandPermissions } from '../permissions';
import { computed } from 'vue';
import { useModuleI18n } from '@/i18n/composables';
import { normalizeTextInput } from '@/utils/inputValue';

const { tm } = useModuleI18n('features/command');

// Props
const props = defineProps<{
  availablePlugins: string[];
  hasSystemPluginConflict: boolean;
  effectiveShowSystemPlugins: boolean;
  pluginFilter: string;
  typeFilter: string;
  permissionFilter: string;
  statusFilter: string;
  showSystemPlugins: boolean;
  searchQuery: string;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:pluginFilter', value: string): void;
  (e: 'update:typeFilter', value: string): void;
  (e: 'update:permissionFilter', value: string): void;
  (e: 'update:statusFilter', value: string): void;
  (e: 'update:showSystemPlugins', value: boolean): void;
  (e: 'update:searchQuery', value: string): void;
}>();

// Computed items for selects
const pluginItems = computed(() => [
  { title: tm('filters.all'), value: 'all' },
  ...props.availablePlugins.map(p => ({ title: p, value: p }))
]);

const typeItems = [
  { title: tm('filters.all'), value: 'all' },
  { title: tm('type.group'), value: 'group' },
  { title: tm('type.command'), value: 'command' },
  { title: tm('type.subCommand'), value: 'sub_command' }
];

const permissionItems = computed(() => [
  { title: tm('filters.all'), value: 'all' },
  ...commandPermissionOptions.map(permission => ({
    title: tm(commandPermissions[permission].label),
    value: permission === 'member' ? 'everyone' : permission,
  })),
]);

const statusItems = [
  { title: tm('filters.all'), value: 'all' },
  { title: tm('filters.enabled'), value: 'enabled' },
  { title: tm('filters.disabled'), value: 'disabled' },
  { title: tm('filters.conflict'), value: 'conflict' }
];

</script>

<template>
  <!-- 过滤器行 -->
  <div class="command-filter-grid">
    <div>
      <v-select
        :model-value="pluginFilter"
        @update:model-value="emit('update:pluginFilter', $event)"
        :items="pluginItems"
        :label="tm('filters.byPlugin')"
        density="compact"
        variant="outlined"
        hide-details
      />
    </div>
    <div>
      <v-select
        :model-value="typeFilter"
        @update:model-value="emit('update:typeFilter', $event)"
        :items="typeItems"
        :label="tm('filters.byType')"
        density="compact"
        variant="outlined"
        hide-details
      />
    </div>
    <div>
      <v-select
        :model-value="permissionFilter"
        @update:model-value="emit('update:permissionFilter', $event)"
        :items="permissionItems"
        :label="tm('filters.byPermission')"
        density="compact"
        variant="outlined"
        hide-details
      />
    </div>
    <div>
      <v-select
        :model-value="statusFilter"
        @update:model-value="emit('update:statusFilter', $event)"
        :items="statusItems"
        :label="tm('filters.byStatus')"
        density="compact"
        variant="outlined"
        hide-details
      />
    </div>
  </div>

  <!-- 搜索栏 + 统计信息行 -->
  <div class="command-search-summary">
    <div class="command-search-input">
      <v-text-field
        :model-value="searchQuery"
        @update:model-value="emit('update:searchQuery', normalizeTextInput($event))"
        density="compact"
        :label="tm('search.placeholder')"
        prepend-inner-icon="mdi-magnify"
        clearable
        variant="solo-filled"
        flat
        hide-details
        single-line
      />
    </div>
    <div class="d-flex align-center flex-wrap ga-2">
      <slot name="stats"></slot>
      <v-divider vertical class="mx-1" style="height: 20px;" />
      <v-checkbox
        :model-value="effectiveShowSystemPlugins"
        @update:model-value="emit('update:showSystemPlugins', !!$event)"
        :label="tm('filters.showSystemPlugins')"
        density="compact"
        hide-details
        :disabled="hasSystemPluginConflict"
        class="system-plugin-checkbox"
      >
        <template v-slot:label>
          <span class="text-body-2">{{ tm('filters.showSystemPlugins') }}</span>
          <v-tooltip v-if="hasSystemPluginConflict" location="top">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon v-bind="tooltipProps" size="16" color="warning" class="ml-1">mdi-alert-circle</v-icon>
            </template>
            {{ tm('filters.systemPluginConflictHint') }}
          </v-tooltip>
        </template>
      </v-checkbox>
    </div>
  </div>
</template>

<style scoped>
.system-plugin-checkbox {
  flex: none;
}

.system-plugin-checkbox :deep(.v-selection-control) {
  min-height: auto;
}
.command-filter-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 8px 0 12px; }
.command-search-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 12px; }
.command-search-input { min-width: 0; max-width: 350px; flex: 1 1 200px; }
@media (max-width: 600px) {
  .command-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 8px; margin: 6px 0 10px; }
  .command-search-summary { margin-bottom: 8px; }
}
</style>
