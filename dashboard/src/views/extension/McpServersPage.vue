<script setup lang="ts">
import McpServersSection from "@/components/extension/McpServersSection.vue";
import { useI18n, useModuleI18n } from "@/i18n/composables";

const { t } = useI18n();
const { tm } = useModuleI18n("features/extension");
</script>

<template>
  <div class="plugin-section-page">
    <McpServersSection>
      <template #heading><h2>{{ tm("tabs.installedMcpServers") }}</h2></template>
      <template #description>{{ t("features.tooluse.mcpServers.description") }}</template>
    </McpServersSection>
  </div>
</template>

<style scoped>
.plugin-section-page {
  margin: 0 auto;
  max-width: 1200px;
  padding: 0 12px;
  width: 100%;
}
</style>
