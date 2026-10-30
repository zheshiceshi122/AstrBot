<script setup lang="ts">
import PageToolbar from '@/components/shared/PageToolbar.vue';
import { computed } from "vue";
import { BookSearch, Cable, ChevronRight, Heart, ListChecks, Puzzle, Sparkles, Users } from "@lucide/vue";
import { useI18n } from "@/i18n/composables";
import "@/styles/workspace-menu.css";

const { t } = useI18n();
const groups = computed(() => [
  {
    title: "dialogue",
    items: [
      { to: "/persona", key: "persona", icon: Heart },
      { to: "/knowledge-base", key: "knowledgeBase", icon: BookSearch },
    ],
  },
  {
    title: "tools",
    items: [
      { to: "/extension/plugins", key: "extension", icon: Puzzle },
      { to: "/extension/mcp", key: "extensionTabs.mcp", icon: Cable },
      { to: "/extension/skills", key: "extensionTabs.skills", icon: Sparkles },
      {
        to: "/extension/components",
        key: "extensionTabs.components",
        icon: ListChecks,
      },
      { to: "/subagent", key: "subagent", icon: Users },
    ],
  },
]);
</script>

<template>
  <div class="workspace-home">
    <PageToolbar class="workspace-home__header"><h1>{{ t("core.navigation.mobileExtensions") }}</h1></PageToolbar>
    <template v-for="group in groups" :key="group.title">
      <h2 class="workspace-menu__group">
        {{ t(`core.navigation.hubGroups.${group.title}`) }}
      </h2>
      <div class="workspace-menu">
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="workspace-menu__item"
        >
          <component :is="item.icon" :size="20" aria-hidden="true" />
          <span
            ><strong>{{ t(`core.navigation.${item.key}`) }}</strong
            ><small>{{
              t(
                `core.navigation.hubHints.${item.key.replace(
                  "extensionTabs.",
                  "",
                )}`,
              )
            }}</small></span
          >
          <ChevronRight :size="16" aria-hidden="true" />
        </RouterLink>
      </div>
    </template>
  </div>
</template>
