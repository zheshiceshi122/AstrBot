<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from '@/i18n/composables';

const props = defineProps({ item: Object, rail: Boolean });
const { t } = useI18n();
const route = useRoute();
const isItemActive = computed(() => props.item.activePaths.some(path => route.path === path || route.path.startsWith(`${path}/`)));
</script>

<template>
  <v-tooltip :disabled="!rail" location="right" :text="t(item.title)" :open-delay="0" content-class="sidebar-rail-tooltip">
    <template #activator="{ props: tooltipProps }">
      <v-list-item v-bind="tooltipProps" :to="item.to" :active="isItemActive" rounded class="dashboard-nav-item"
        color="primary" :aria-label="t(item.title)">
        <template #prepend>
          <component :is="item.icon" :size="18" class="sidebar-lucide-icon hide-menu" />
        </template>
        <v-list-item-title class="dashboard-nav-item__title">{{ t(item.title) }}</v-list-item-title>
      </v-list-item>
    </template>
  </v-tooltip>
</template>

<style scoped>
.dashboard-nav-item__title { font-size: 14px; font-weight: 500; line-height: 20px; word-break: break-word; }
.sidebar-lucide-icon { flex: 0 0 auto; color: currentcolor; stroke-width: 2; }
</style>
