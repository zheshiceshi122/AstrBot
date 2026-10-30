<script setup lang="ts">
import PageToolbar from '@/components/shared/PageToolbar.vue';
import ComponentPanel from "@/components/extension/componentPanel/index.vue";
import { useModuleI18n } from "@/i18n/composables";

const { tm } = useModuleI18n("features/extension");
</script>

<template>
  <div class="plugin-section-page">
    <PageToolbar class="tool-page-header">
      <h2 class="text-h2 mb-0">{{ tm("tabs.handlersOperation") }}</h2>
    </PageToolbar>
    <ComponentPanel :active="true" />
  </div>
</template>

<style scoped>
.plugin-section-page {
  padding: 0 12px;
  width: 100%;
}
</style>
