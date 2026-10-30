<script setup lang="ts">
import SkillsSection from "@/components/extension/SkillsSection.vue";
import { useModuleI18n } from "@/i18n/composables";

const { tm } = useModuleI18n("features/extension");
</script>

<template>
  <div class="plugin-section-page">
    <SkillsSection>
      <template #heading><h2>{{ tm("tabs.skills") }}</h2></template>
      <template #description>{{ tm("skills.runtimeHint") }}</template>
    </SkillsSection>
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
